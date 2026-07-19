import os
import secrets
import stripe
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func

from . import models, schemas, auth
from .database import engine, get_db

# Schema is managed by Alembic migrations — run `alembic upgrade head` on deploy.
# (Serverless has no startup hook to migrate; don't create tables at import time.)

app = FastAPI(title="GetBuddy API")

# Country → local currency — listings are priced in the host's currency.
# Hosts can be anywhere; unknown codes fall back to USD.
COUNTRIES = {
    "IN": "INR", "US": "USD", "GB": "GBP", "JP": "JPY", "KR": "KRW",
    "AE": "AED", "SG": "SGD", "AU": "AUD", "CA": "CAD", "NZ": "NZD",
    "DE": "EUR", "FR": "EUR", "ES": "EUR", "IT": "EUR", "NL": "EUR",
    "PT": "EUR", "IE": "EUR", "AT": "EUR", "BE": "EUR", "FI": "EUR", "GR": "EUR",
    "CH": "CHF", "SE": "SEK", "NO": "NOK", "DK": "DKK", "PL": "PLN",
    "CZ": "CZK", "HU": "HUF", "RO": "RON", "TR": "TRY", "UA": "UAH",
    "CN": "CNY", "HK": "HKD", "TW": "TWD", "TH": "THB", "VN": "VND",
    "ID": "IDR", "MY": "MYR", "PH": "PHP", "BD": "BDT", "PK": "PKR",
    "LK": "LKR", "NP": "NPR", "SA": "SAR", "QA": "QAR", "KW": "KWD",
    "BH": "BHD", "OM": "OMR", "IL": "ILS", "EG": "EGP", "ZA": "ZAR",
    "NG": "NGN", "KE": "KES", "GH": "GHS", "MA": "MAD", "BR": "BRL",
    "MX": "MXN", "AR": "ARS", "CL": "CLP", "CO": "COP", "PE": "PEN",
}

def currency_for(country: Optional[str]) -> str:
    return COUNTRIES.get(country or "IN", "USD")

EDIT_WINDOW = timedelta(hours=1)  # hosts can rectify a listing for 1 hour after publishing

# Comma-separated list, e.g. "https://getbuddy.example.com,https://www.getbuddy.example.com"
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").strip().lower()
# ponytail: mock OTP until an SMS provider is wired in; set OTP_CODE in prod and the code stops being echoed back
OTP_CODE = os.getenv("OTP_CODE", "123456")

# ---- Stripe ----
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "").strip()
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
# Safety latch: a live key can move real money. It only works once the app is
# actually deployed and you explicitly set STRIPE_ALLOW_LIVE=true.
STRIPE_ALLOW_LIVE = os.getenv("STRIPE_ALLOW_LIVE") == "true"
ZERO_DECIMAL_CURRENCIES = {"JPY", "KRW", "VND", "CLP"}  # Stripe amounts for these are not in cents

# Admin-tunable rates (settings table); these are the fallbacks.
DEFAULT_COMMISSION_RATE = 0.15
# Stripe's cut passed on to the guest at checkout. Default to the worst-case
# (international card 3% + 18% GST ≈ 3.54%, rounded up) so the platform never
# under-recovers; admin can lower it via /admin/settings.
DEFAULT_PAYMENT_FEE_RATE = 0.04

def _get_rate(db: Session, key: str, default: float) -> float:
    s = db.query(models.Setting).filter(models.Setting.key == key).first()
    try:
        return float(s.value) if s else default
    except (TypeError, ValueError):
        return default

def get_commission_rate(db: Session) -> float:
    return _get_rate(db, "commission_rate", DEFAULT_COMMISSION_RATE)

def get_payment_fee_rate(db: Session) -> float:
    return _get_rate(db, "payment_fee_rate", DEFAULT_PAYMENT_FEE_RATE)

def stripe_enabled() -> bool:
    return bool(STRIPE_SECRET_KEY)

def _assert_stripe_usable():
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Payments are not configured yet.")
    if STRIPE_SECRET_KEY.startswith("sk_live_") and not STRIPE_ALLOW_LIVE:
        raise HTTPException(
            status_code=503,
            detail="A LIVE Stripe key is configured but the app is not deployed for live payments. "
                   "Use a test key (sk_test_...) for development, or set STRIPE_ALLOW_LIVE=true after deploying.",
        )

def _checkout_url_for(booking: "models.Booking", event: "models.Event", db: Session) -> str:
    """Create a Stripe Checkout session for a booking. Amount is always computed
    server-side from the listing's rate x duration, in the listing's currency.
    The guest also pays a processing fee that covers Stripe's cut, so the
    platform nets the full listing price (host payout/commission are unaffected)."""
    _assert_stripe_usable()
    stripe.api_key = STRIPE_SECRET_KEY
    minutes = booking.duration_minutes or event.duration_minutes or 60
    gross = round(event.price * minutes / 60)
    currency = (event.currency or "INR").upper()
    zero_dec = currency in ZERO_DECIMAL_CURRENCIES
    to_minor = lambda amt: int(amt if zero_dec else amt * 100)

    line_items = [{
        "price_data": {
            "currency": currency.lower(),
            "product_data": {"name": event.title},
            "unit_amount": to_minor(gross),
        },
        "quantity": 1,
    }]
    # Pass Stripe's fee to the guest as a separate, transparent line item
    fee = round(gross * get_payment_fee_rate(db))
    if fee > 0:
        line_items.append({
            "price_data": {
                "currency": currency.lower(),
                "product_data": {"name": "Payment processing fee"},
                "unit_amount": to_minor(fee),
            },
            "quantity": 1,
        })
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=line_items,
            metadata={"booking_id": str(booking.id), "app": "getbuddygo"},
            success_url=f"{FRONTEND_URL}/booking-success/{event.id}?paid=1",
            cancel_url=f"{FRONTEND_URL}/my-bookings/{booking.id}",
        )
    except stripe.error.StripeError as e:  # type: ignore[attr-defined]
        raise HTTPException(status_code=502, detail=f"Payment provider error: {getattr(e, 'user_message', None) or 'try again shortly.'}")
    return session.url

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,  # bearer tokens, not cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

def notify(db: Session, user_id: int, title: str, body: str = "", link: str = ""):
    """Queue an in-app notification. Caller commits."""
    db.add(models.Notification(user_id=user_id, title=title, body=body or None, link=link or None))

@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    email = user.email.lower()
    db_user = db.query(models.User).filter(func.lower(models.User.email) == email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=email, full_name=user.full_name, hashed_password=hashed_password,
                          country=user.country, city=user.city)

    # Admin is granted only to the email configured via ADMIN_EMAIL env var
    if ADMIN_EMAIL and email == ADMIN_EMAIL:
        db_user.is_admin = True

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(func.lower(models.User.email) == form_data.username.lower()).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect credentials")
    
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_id": user.id, 
        "is_admin": user.is_admin
    }

# ---- HOST FLOWS ----
# Hosts submit an application; an admin reviews and approves/rejects it.
# is_host stays False until an admin approves (see /admin/hosts/{id}/approve).
@app.post("/host/apply", response_model=schemas.User)
def apply_to_host(application: schemas.HostApply, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    profile = current_user.host_profile
    if profile and profile.status == "APPROVED":
        raise HTTPException(status_code=400, detail="You are already an approved host.")

    # Reject duplicate phone numbers held by a different applicant
    clash = db.query(models.HostProfile).filter(
        models.HostProfile.phone_number == application.phone_number,
        models.HostProfile.user_id != current_user.id,
    ).first()
    if clash:
        raise HTTPException(status_code=400, detail="That phone number is already in use.")

    if profile:
        # Editing a pending application or reapplying after rejection
        for field, value in application.model_dump().items():
            setattr(profile, field, value)
        profile.status = "PENDING"
    else:
        profile = models.HostProfile(user_id=current_user.id, status="PENDING", **application.model_dump())
        db.add(profile)

    db.commit()
    db.refresh(current_user)
    return current_user

# ---- EVENTS / LISTINGS ----
@app.get("/host/me/metrics")
def get_my_host_metrics(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_host)):
    profile = current_user.host_profile
    if not profile:
        raise HTTPException(status_code=400, detail="Not a verified host")
        
    earnings = profile.total_earnings
    active_listings = db.query(models.Event).filter(models.Event.host_id == profile.id).count()
    
    # Track bookings for events managed by this host
    host_events = db.query(models.Event.id).filter(models.Event.host_id == profile.id).all()
    event_ids = [e[0] for e in host_events]
    total_bookings = db.query(models.Booking).filter(models.Booking.event_id.in_(event_ids)).count() if event_ids else 0

    return {
        "total_earnings": earnings,
        "currency": currency_for(current_user.country),
        "active_listings": active_listings,
        "total_bookings": total_bookings
    }

@app.get("/host/me/bookings")
def get_host_managed_bookings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_host)):
    profile = current_user.host_profile
    
    # 1. Get all event IDs for this host
    host_events = db.query(models.Event).filter(models.Event.host_id == profile.id).all()
    event_dict = {e.id: e for e in host_events}
    
    if not event_dict:
        return []
        
    # 2. Get all bookings for those events
    bookings = db.query(models.Booking).filter(models.Booking.event_id.in_(event_dict.keys())).all()
    
    # 3. Enhance bookings with user info and event title
    enhanced = []
    for b in bookings:
        user = db.query(models.User).filter(models.User.id == b.user_id).first()
        ev = event_dict[b.event_id]
        enhanced.append({
            "id": b.id,
            "status": b.status,
            "payment_status": b.payment_status,
            "created_at": b.created_at,
            "listing_kind": ev.listing_kind,
            "event_title": ev.title,
            # Services: the guest's requested slot; events: the listing's schedule
            "start_time": b.start_time or ev.start_time,
            "duration_minutes": b.duration_minutes or ev.duration_minutes,
            "price": ev.price,
            "currency": ev.currency or "INR",
            "guest_name": user.full_name if user else "Unknown Guest",
            "guest_email": user.email if user else "Unknown Email",
            "guest_city": user.city if user else None,
            "guest_photo": user.profile_photo if user else None,
        })
    return enhanced

@app.post("/host/me/bookings/{booking_id}/accept")
def accept_booking_request(booking_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_host)):
    booking = db.query(models.Booking).join(models.Event).filter(
        models.Booking.id == booking_id,
        models.Event.host_id == current_user.host_profile.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Request not found")
    if booking.status != "REQUESTED":
        raise HTTPException(status_code=400, detail="This request has already been handled.")
    booking.status = "CONFIRMED"
    if not stripe_enabled():
        # ponytail: mock path — no Stripe keys, settle instantly for local dev
        _settle_booking(db, booking, booking.event)
    notify(db, booking.user_id, "Request accepted 🎉",
           f"Your buddy accepted your request for “{booking.event.title}”.", f"/my-bookings/{booking.id}")
    db.commit()
    return {"id": booking.id, "status": booking.status, "payment_status": booking.payment_status}

@app.post("/host/me/bookings/{booking_id}/decline")
def decline_booking_request(booking_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_host)):
    booking = db.query(models.Booking).join(models.Event).filter(
        models.Booking.id == booking_id,
        models.Event.host_id == current_user.host_profile.id,
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Request not found")
    if booking.status != "REQUESTED":
        raise HTTPException(status_code=400, detail="This request has already been handled.")
    booking.status = "DECLINED"
    notify(db, booking.user_id, "Request declined",
           f"Your request for “{booking.event.title}” was declined. Browse other buddies nearby.", "/explore")
    db.commit()
    return {"id": booking.id, "status": booking.status}

@app.get("/host/me/transactions")
def get_host_managed_transactions(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_host)):
    profile = current_user.host_profile
    
    # 1. Get all events
    host_events = db.query(models.Event).filter(models.Event.host_id == profile.id).all()
    event_dict = {e.id: e for e in host_events}
    
    if not event_dict:
        return []
        
    # 2. Get bookings
    bookings = db.query(models.Booking).filter(models.Booking.event_id.in_(event_dict.keys())).all()
    booking_dict = {b.id: b for b in bookings}
    
    if not booking_dict:
        return []
        
    # 3. Get transactions
    transactions = db.query(models.Transaction).filter(models.Transaction.booking_id.in_(booking_dict.keys())).all()
    
    # 4. Enhance
    enhanced = []
    for tx in transactions:
        b = booking_dict[tx.booking_id]
        enhanced.append({
            "id": tx.id,
            "created_at": tx.created_at,
            "gross_amount": tx.gross_amount,
            "host_payout": tx.host_payout,
            "platform_commission": tx.platform_commission,
            "currency": tx.currency or "INR",
            "payout_status": tx.payout_status,
            "event_title": event_dict[b.event_id].title
        })
    return enhanced

@app.post("/events", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_host)):
    data = event.model_dump()
    if data["listing_kind"] == "EVENT" and not data.get("start_time"):
        raise HTTPException(status_code=400, detail="Events need a date & time.")
    if data["listing_kind"] == "SERVICE":
        data["start_time"] = None  # guests pick the time when they book
        if not data.get("city") and event.mode == "Offline":
            raise HTTPException(status_code=400, detail="In-person services need a city so guests can find you.")
    # Community-only listings: only the community's owner can post into it
    if data.get("community_id"):
        community = db.query(models.Community).filter(models.Community.id == data["community_id"]).first()
        if not community or community.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only post listings into a community you manage.")
    # Listing lives in the host's country and is priced in its currency
    data["country"] = current_user.country or "IN"
    data["currency"] = currency_for(data["country"])
    db_event = models.Event(**data, host_id=current_user.host_profile.id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.get("/events", response_model=List[schemas.Event])
def list_events(kind: Optional[str] = None, country: Optional[str] = None, city: Optional[str] = None,
                q: Optional[str] = None, category: Optional[str] = None, mode: Optional[str] = None,
                traveller: Optional[bool] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Public catalog: only live, non-community listings; no private location details (see schema)
    query = db.query(models.Event).filter(models.Event.status == "ACTIVE", models.Event.community_id.is_(None))
    if kind in ("EVENT", "SERVICE"):
        query = query.filter(models.Event.listing_kind == kind)
    if country in COUNTRIES:
        query = query.filter(models.Event.country == country)
    if city:
        query = query.filter(models.Event.city.ilike(f"%{city.strip()}%"))
    if q:
        query = query.filter(models.Event.title.ilike(f"%{q.strip()}%") | models.Event.description.ilike(f"%{q.strip()}%"))
    if category:
        query = query.filter(models.Event.category == category)
    if mode in ("Online", "Offline"):
        query = query.filter(models.Event.mode == mode)
    if traveller:
        query = query.filter(models.Event.traveller_friendly.is_(True))
    return query.offset(skip).limit(limit).all()

def _edit_deadline(event: models.Event) -> Optional[datetime]:
    return (event.created_at + EDIT_WINDOW) if event.created_at else None

@app.get("/host/me/listings")
def get_my_listings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_host)):
    events = db.query(models.Event).filter(models.Event.host_id == current_user.host_profile.id).order_by(models.Event.id.desc()).all()
    now = datetime.now(timezone.utc).replace(tzinfo=None)  # DB datetimes are naive UTC
    out = []
    for e in events:
        deadline = _edit_deadline(e)
        out.append({
            "id": e.id, "listing_kind": e.listing_kind, "title": e.title, "status": e.status,
            "price": e.price, "currency": e.currency or "INR", "city": e.city, "category": e.category,
            "start_time": e.start_time, "created_at": e.created_at, "cover_image": e.cover_image,
            "community_id": e.community_id,
            "editable": bool(deadline and now < deadline),
            "editable_until": deadline,
        })
    return out

@app.get("/events/{event_id}", response_model=schemas.Event)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Listing not found")
    return event

@app.put("/events/{event_id}", response_model=schemas.Event)
def update_event(event_id: int, update: schemas.EventCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_host)):
    """Rectification window: hosts can edit a listing for 1 hour after creating it."""
    event = db.query(models.Event).filter(
        models.Event.id == event_id,
        models.Event.host_id == current_user.host_profile.id,
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Listing not found")
    deadline = _edit_deadline(event)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if not deadline or now >= deadline:
        raise HTTPException(status_code=403, detail="The 1-hour edit window for this listing has closed.")
    data = update.model_dump()
    if data["listing_kind"] == "EVENT" and not data.get("start_time"):
        raise HTTPException(status_code=400, detail="Events need a date & time.")
    if data["listing_kind"] == "SERVICE":
        data["start_time"] = None
    data.pop("community_id", None)  # can't move a listing between communities after creation
    for field, value in data.items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event

@app.get("/host/me/profile")
def get_my_host_profile(current_user: models.User = Depends(auth.get_current_host)):
    p = current_user.host_profile
    return {"bio": p.bio, "expertise": p.expertise, "category": p.category, "city": p.city,
            "instagram": p.instagram, "linkedin": p.linkedin, "website": p.website}

@app.put("/host/me/profile", response_model=schemas.User)
def update_host_profile(update: schemas.HostProfileUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_host)):
    profile = current_user.host_profile
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    if update.city:
        current_user.city = update.city
    db.commit()
    db.refresh(current_user)
    return current_user

# ---- BOOKINGS & PAYMENTS ----
def _settle_booking(db: Session, booking: models.Booking, event: models.Event):
    """Record payment for a booking: transaction row + host earnings.
    Pricing is per hour: gross = hourly rate x session duration, rounded to
    whole rupees to match what the guest sees at checkout.
    ponytail: payment_status=PAID without charging — Stripe checkout replaces this next."""
    minutes = booking.duration_minutes or event.duration_minutes or 60
    gross = round(event.price * minutes / 60)
    commission = round(gross * get_commission_rate(db), 2)
    payout = round(gross - commission, 2)

    booking.payment_status = "PAID"
    db.add(models.Transaction(
        booking_id=booking.id,
        gross_amount=gross,
        platform_commission=commission,
        host_payout=payout,
        currency=event.currency or "INR",
        payout_status="PENDING",
    ))
    host_profile = db.query(models.HostProfile).filter(models.HostProfile.id == event.host_id).first()
    host_profile.total_earnings += payout

@app.post("/bookings", response_model=schemas.Booking)
def book_event(booking: schemas.BookingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == booking.event_id, models.Event.status == "ACTIVE").first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.listing_kind == "SERVICE":
        # Buddy booking: guest picks the slot, host must accept before payment settles
        if not booking.start_time or not booking.duration_minutes:
            raise HTTPException(status_code=400, detail="Pick a date, time, and number of hours.")
        pending_same = db.query(models.Booking).filter(
            models.Booking.user_id == current_user.id,
            models.Booking.event_id == event.id,
            models.Booking.status == "REQUESTED",
        ).first()
        if pending_same:
            raise HTTPException(status_code=400, detail="You already have a pending request with this buddy.")
        db_booking = models.Booking(
            user_id=current_user.id, event_id=event.id,
            status="REQUESTED", payment_status="PENDING",
            start_time=booking.start_time, duration_minutes=booking.duration_minutes,
        )
        db.add(db_booking)
        notify(db, event.host.user_id, "New buddy request",
               f"{current_user.full_name} requested “{event.title}”. Accept or decline it.", "/host/bookings")
        db.commit()
        db.refresh(db_booking)
        return db_booking

    # EVENT: seat-limited. With Stripe configured, the seat is confirmed only
    # after payment (webhook); without keys we keep the dev mock (instant PAID).
    existing_booking = db.query(models.Booking).filter(
        models.Booking.user_id == current_user.id,
        models.Booking.event_id == event.id,
        models.Booking.status.in_(["CONFIRMED", "PENDING_PAYMENT"]),
    ).first()
    if existing_booking and existing_booking.status == "CONFIRMED":
        raise HTTPException(status_code=400, detail="You have already registered for this event.")

    confirmed = db.query(models.Booking).filter(models.Booking.event_id == event.id, models.Booking.status == "CONFIRMED").count()
    if event.max_participants and confirmed >= event.max_participants:
        raise HTTPException(status_code=400, detail="This event is fully booked.")

    if stripe_enabled():
        # Reuse an abandoned checkout instead of stacking pending bookings
        db_booking = existing_booking or models.Booking(
            user_id=current_user.id, event_id=event.id,
            status="PENDING_PAYMENT", payment_status="PENDING",
        )
        if not existing_booking:
            db.add(db_booking)
            db.commit()
            db.refresh(db_booking)
        db_booking.checkout_url = _checkout_url_for(db_booking, event, db)  # transient, not stored
        return db_booking

    # ponytail: mock payment path for local dev without Stripe keys
    db_booking = models.Booking(user_id=current_user.id, event_id=event.id, status="CONFIRMED", payment_status="PAID")
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    _settle_booking(db, db_booking, event)
    notify(db, event.host.user_id, "New booking 🎟",
           f"{current_user.full_name} booked a seat at “{event.title}”.", "/host/bookings")

    db.commit()
    return db_booking

@app.post("/bookings/{booking_id}/pay")
def pay_for_booking(booking_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Checkout link for a booking that still needs payment: an event awaiting
    payment, or a service request the host has accepted."""
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id, models.Booking.user_id == current_user.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.payment_status == "PAID":
        raise HTTPException(status_code=400, detail="This booking is already paid.")
    if booking.status not in ("PENDING_PAYMENT", "CONFIRMED"):
        raise HTTPException(status_code=400, detail="This booking isn't ready for payment yet.")
    return {"checkout_url": _checkout_url_for(booking, booking.event, db)}

@app.post("/webhooks/stripe")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, signature, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        booking_id = int(session["metadata"]["booking_id"])
        booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
        # Idempotent: Stripe retries webhooks, settle only once
        if booking and booking.payment_status != "PAID":
            booking.status = "CONFIRMED"
            _settle_booking(db, booking, booking.event)
            notify(db, booking.event.host.user_id, "New booking 🎟",
                   f"A guest booked a seat at “{booking.event.title}”.", "/host/bookings")
            db.commit()
    return {"received": True}

# ---- PUBLIC HOST PROFILE ----
@app.get("/hosts/{host_id}/public")
def get_public_host_profile(host_id: int, db: Session = Depends(get_db)):
    """What guests see before booking: who the host is, their listings, and reviews."""
    profile = db.query(models.HostProfile).filter(
        models.HostProfile.id == host_id, models.HostProfile.status == "APPROVED",
    ).first()
    if not profile or not profile.user:
        raise HTTPException(status_code=404, detail="Host not found")
    reviews = db.query(models.Review).filter(models.Review.host_id == profile.id).all()
    avg = round(sum(r.star_rating for r in reviews) / len(reviews), 1) if reviews else None
    listings = db.query(models.Event).filter(
        models.Event.host_id == profile.id, models.Event.status == "ACTIVE",
        models.Event.community_id.is_(None),
    ).all()
    return {
        "host_id": profile.id,
        "name": profile.user.full_name,
        "photo": profile.user.profile_photo,
        "bio": profile.bio,
        "expertise": profile.expertise,
        "category": profile.category,
        "city": profile.city or profile.user.city,
        "country": profile.user.country,
        "phone_verified": profile.phone_verified,
        "member_since": profile.user.created_at,
        "instagram": profile.instagram,
        "linkedin": profile.linkedin,
        "website": profile.website,
        "rating": avg,
        "review_count": len(reviews),
        "reviews": [{"star_rating": r.star_rating, "review_text": r.review_text, "created_at": r.created_at} for r in reviews[:10]],
        "listings": [schemas.Event.model_validate(e) for e in listings],
    }

# ---- USERS ----
@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.put("/users/me", response_model=schemas.User)
def update_users_me(update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user

# ---- NOTIFICATIONS ----
@app.get("/users/me/notifications", response_model=List[schemas.Notification])
def get_my_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return (db.query(models.Notification).filter(models.Notification.user_id == current_user.id)
            .order_by(models.Notification.id.desc()).limit(50).all())

@app.post("/users/me/notifications/read")
def mark_notifications_read(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id, models.Notification.read.is_(False),
    ).update({"read": True})
    db.commit()
    return {"detail": "ok"}

@app.get("/users/me/bookings", response_model=List[schemas.Booking])
def get_my_bookings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Booking).filter(models.Booking.user_id == current_user.id).all()

@app.get("/users/me/bookings/{booking_id}")
def get_my_booking_detail(booking_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id, models.Booking.user_id == current_user.id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    e = booking.event
    return {
        "id": booking.id,
        "event_id": booking.event_id,
        "status": booking.status,
        "payment_status": booking.payment_status,
        "created_at": booking.created_at,
        # Guest-chosen slot for service bookings (null for events)
        "start_time": booking.start_time,
        "duration_minutes": booking.duration_minutes,
        "event": {
            "listing_kind": e.listing_kind,
            "title": e.title,
            "description": e.description,
            "mode": e.mode,
            "event_type": e.event_type,
            "category": e.category,
            "city": e.city,
            "price": e.price,
            "currency": e.currency or "INR",
            "duration_minutes": e.duration_minutes,
            "start_time": e.start_time,
            # Private — only for the guest who booked, once confirmed AND paid
            "location_details": e.location_details if (booking.status == "CONFIRMED" and booking.payment_status == "PAID") else None,
        },
    }

# ---- COMMUNITIES ----
# A host runs a community (society, PG, club); people join with an invite code.
# Sub-groups split the crowd by interest (food, rent, sports...). Community
# listings are private — visible only inside the community, not on Explore.

def _community_or_404(db: Session, community_id: int) -> models.Community:
    c = db.query(models.Community).filter(models.Community.id == community_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Community not found")
    return c

def _is_member(db: Session, community: models.Community, user_id: int) -> bool:
    if community.owner_id == user_id:
        return True
    return db.query(models.CommunityMember).filter(
        models.CommunityMember.community_id == community.id,
        models.CommunityMember.user_id == user_id,
    ).first() is not None

def _community_summary(c: models.Community, db: Session, user_id: int) -> dict:
    return {
        "id": c.id, "name": c.name, "description": c.description, "city": c.city,
        "cover_image": c.cover_image, "created_at": c.created_at,
        "is_owner": c.owner_id == user_id,
        "member_count": db.query(models.CommunityMember).filter(models.CommunityMember.community_id == c.id).count(),
        # The share code is only for the owner to hand out
        "invite_code": c.invite_code if c.owner_id == user_id else None,
    }

@app.post("/communities")
def create_community(payload: schemas.CommunityCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_host)):
    community = models.Community(
        owner_id=current_user.id, invite_code=secrets.token_hex(4),
        **payload.model_dump(),
    )
    db.add(community)
    db.commit()
    db.refresh(community)
    return _community_summary(community, db, current_user.id)

@app.get("/communities/mine")
def my_communities(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    owned = db.query(models.Community).filter(models.Community.owner_id == current_user.id).all()
    memberships = db.query(models.CommunityMember).filter(models.CommunityMember.user_id == current_user.id).all()
    joined = [m.community for m in memberships if m.community and m.community.owner_id != current_user.id]
    return [_community_summary(c, db, current_user.id) for c in owned + joined]

@app.post("/communities/join")
def join_community(payload: schemas.CommunityJoin, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    community = db.query(models.Community).filter(models.Community.invite_code == payload.invite_code.strip().lower()).first()
    if not community:
        raise HTTPException(status_code=404, detail="No community found for that invite code.")
    if _is_member(db, community, current_user.id):
        raise HTTPException(status_code=400, detail="You're already a member of this community.")
    db.add(models.CommunityMember(community_id=community.id, user_id=current_user.id))
    notify(db, community.owner_id, "New community member",
           f"{current_user.full_name} joined “{community.name}”.", f"/communities/{community.id}")
    db.commit()
    return _community_summary(community, db, current_user.id)

@app.get("/communities/{community_id}")
def get_community(community_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    community = _community_or_404(db, community_id)
    if not _is_member(db, community, current_user.id):
        raise HTTPException(status_code=403, detail="Members only — ask the owner for an invite code.")
    members = db.query(models.CommunityMember).filter(models.CommunityMember.community_id == community.id).all()
    events = db.query(models.Event).filter(
        models.Event.community_id == community.id, models.Event.status == "ACTIVE",
    ).all()
    owner = db.query(models.User).filter(models.User.id == community.owner_id).first()
    return {
        **_community_summary(community, db, current_user.id),
        "owner_name": owner.full_name if owner else "Unknown",
        "subgroups": [{"id": s.id, "name": s.name, "interest": s.interest} for s in community.subgroups],
        "members": [{"id": m.user_id, "name": m.user.full_name if m.user else "?", "photo": m.user.profile_photo if m.user else None, "joined_at": m.joined_at} for m in members],
        "events": [schemas.Event.model_validate(e) for e in events],
    }

@app.post("/communities/{community_id}/subgroups")
def create_subgroup(community_id: int, payload: schemas.SubgroupCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    community = _community_or_404(db, community_id)
    if community.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the community owner can add sub-groups.")
    sub = models.CommunitySubgroup(community_id=community.id, **payload.model_dump())
    db.add(sub)
    db.commit()
    return {"id": sub.id, "name": sub.name, "interest": sub.interest}

# ---- DPDPA: data export + account deletion ----
@app.get("/users/me/export")
def export_my_data(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """DPDPA right of access: everything we hold about the user, as JSON."""
    host = db.query(models.HostProfile).filter(models.HostProfile.user_id == current_user.id).first()
    bookings = db.query(models.Booking).filter(models.Booking.user_id == current_user.id).all()
    return {
        "account": {
            "id": current_user.id, "email": current_user.email, "full_name": current_user.full_name,
            "country": current_user.country, "city": current_user.city,
            "profile_photo": current_user.profile_photo, "is_host": current_user.is_host,
            "created_at": current_user.created_at,
        },
        "host_profile": {
            "phone_number": host.phone_number, "status": host.status, "bio": host.bio,
            "expertise": host.expertise, "category": host.category, "city": host.city,
            "total_earnings": host.total_earnings,
        } if host else None,
        "bookings": [{
            "id": b.id, "event_id": b.event_id, "status": b.status,
            "payment_status": b.payment_status, "start_time": b.start_time,
            "duration_minutes": b.duration_minutes, "created_at": b.created_at,
        } for b in bookings],
    }

@app.delete("/users/me")
def request_account_deletion(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """DPDPA right of erasure: flags the account; an admin reviews and confirms the actual erasure."""
    if current_user.is_admin:
        raise HTTPException(status_code=400, detail="Admin accounts cannot self-delete")
    current_user.deletion_requested = True
    db.commit()
    return {"detail": "Deletion requested. Our team will erase your data after review."}

@app.delete("/users/me/deletion-request")
def cancel_account_deletion(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    current_user.deletion_requested = False
    db.commit()
    return {"detail": "Deletion request cancelled"}

# ---- ADMIN PANEL ROUTES ----
@app.post("/admin/users/{user_id}/confirm-deletion")
def confirm_account_deletion(user_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    """Admin-confirmed DPDPA erasure: anonymize PII, keep transaction records for legal retention."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.deletion_requested:
        raise HTTPException(status_code=400, detail="User has not requested deletion")
    host = db.query(models.HostProfile).filter(models.HostProfile.user_id == user.id).first()
    if host:
        # Retire listings so they disappear from discovery
        db.query(models.Event).filter(models.Event.host_id == host.id).update({"status": "INACTIVE"})
        host.phone_number = f"deleted-{host.id}"
        host.bio = None
        host.expertise = None
        host.status = "REJECTED"
    # ponytail: anonymize-in-place keeps FK integrity for bookings/transactions;
    # hard-delete rows only if legal says retention isn't required.
    # ponytail: subdomain of our own domain — .invalid TLD fails Pydantic EmailStr on response
    user.email = f"deleted-{user.id}@deleted.getbuddygo.com"
    user.full_name = "Deleted user"
    # Random unusable password (empty string would crash bcrypt.checkpw on login)
    user.hashed_password = auth.get_password_hash(auth.secrets.token_hex(32))
    user.city = None
    user.profile_photo = None
    user.is_active = False
    user.is_host = False
    user.deletion_requested = False
    db.commit()
    return {"detail": "Account erased"}

@app.get("/admin/metrics", response_model=schemas.AdminMetrics)
def get_admin_metrics(db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    total_users = db.query(models.User).count()
    total_hosts = db.query(models.HostProfile).count()
    total_listings = db.query(models.Event).count()
    total_bookings = db.query(models.Booking).count()
    total_revenue = db.query(func.sum(models.Transaction.platform_commission)).scalar() or 0.0
    revenue_by_currency = dict(
        db.query(models.Transaction.currency, func.sum(models.Transaction.platform_commission))
        .group_by(models.Transaction.currency).all()
    )

    return schemas.AdminMetrics(
        total_users=total_users,
        total_hosts=total_hosts,
        total_listings=total_listings,
        total_bookings=total_bookings,
        total_revenue=total_revenue,
        revenue_by_currency=revenue_by_currency,
    )

@app.get("/admin/users", response_model=List[schemas.User])
def get_admin_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.User).offset(skip).limit(limit).all()

@app.get("/admin/hosts")
def get_admin_hosts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    hosts = db.query(models.HostProfile).offset(skip).limit(limit).all()
    return [{
        "id": h.id, "user_id": h.user_id,
        "name": h.user.full_name if h.user else "Unknown",
        "email": h.user.email if h.user else "",
        "phone_number": h.phone_number, "status": h.status,
        "bio": h.bio, "category": h.category, "city": h.city,
        "country": h.user.country if h.user else "IN",
        "currency": currency_for(h.user.country if h.user else "IN"),
        "total_earnings": h.total_earnings,
    } for h in hosts]

@app.post("/admin/hosts/{host_id}/approve")
def approve_host(host_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    profile = db.query(models.HostProfile).filter(models.HostProfile.id == host_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Host application not found")
    profile.status = "APPROVED"
    profile.phone_verified = True
    profile.user.is_host = True
    notify(db, profile.user_id, "You're a host now 🎉",
           "Your host application was approved. Set up your profile and publish your first listing.", "/host/dashboard")
    db.commit()
    return {"id": profile.id, "status": profile.status}

@app.post("/admin/hosts/{host_id}/reject")
def reject_host(host_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    profile = db.query(models.HostProfile).filter(models.HostProfile.id == host_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Host application not found")
    profile.status = "REJECTED"
    profile.user.is_host = False
    notify(db, profile.user_id, "Host application update",
           "Your host application wasn't approved this time. You can update your details and reapply.", "/host/onboarding/apply")
    db.commit()
    return {"id": profile.id, "status": profile.status}

@app.get("/admin/listings", response_model=List[schemas.Event])
def get_admin_listings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.Event).offset(skip).limit(limit).all()

@app.get("/admin/bookings", response_model=List[schemas.Booking])
def get_admin_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.Booking).offset(skip).limit(limit).all()

@app.get("/admin/transactions", response_model=List[schemas.Transaction])
def get_admin_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.Transaction).offset(skip).limit(limit).all()

@app.post("/admin/transactions/{tx_id}/payout")
def toggle_payout_sent(tx_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    """Mark a host payout as sent (or flip it back if marked by mistake)."""
    tx = db.query(models.Transaction).filter(models.Transaction.id == tx_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    tx.payout_status = "PENDING" if tx.payout_status == "PAID" else "PAID"
    db.commit()
    return {"id": tx.id, "payout_status": tx.payout_status}

def _set_rate(db: Session, key: str, value: float):
    s = db.query(models.Setting).filter(models.Setting.key == key).first()
    if s:
        s.value = str(value)
    else:
        db.add(models.Setting(key=key, value=str(value)))

@app.get("/admin/settings")
def get_admin_settings(db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return {"commission_rate": get_commission_rate(db), "payment_fee_rate": get_payment_fee_rate(db)}

@app.put("/admin/settings")
def update_admin_settings(update: schemas.SettingsUpdate, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    if update.commission_rate is not None:
        if not (0 <= update.commission_rate <= 0.9):
            raise HTTPException(status_code=400, detail="Commission rate must be between 0 and 0.9 (0–90%).")
        _set_rate(db, "commission_rate", update.commission_rate)
    if update.payment_fee_rate is not None:
        if not (0 <= update.payment_fee_rate <= 0.5):
            raise HTTPException(status_code=400, detail="Payment fee rate must be between 0 and 0.5 (0–50%).")
        _set_rate(db, "payment_fee_rate", update.payment_fee_rate)
    db.commit()
    return {"commission_rate": get_commission_rate(db), "payment_fee_rate": get_payment_fee_rate(db)}

@app.get("/admin/analytics")
def get_admin_analytics(db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    bookings_by_type = dict(
        db.query(models.Event.event_type, func.count(models.Booking.id))
        .join(models.Booking, models.Booking.event_id == models.Event.id)
        .group_by(models.Event.event_type).all()
    )
    revenue_by_month = dict(
        db.query(func.strftime("%Y-%m", models.Transaction.created_at), func.sum(models.Transaction.platform_commission))
        .group_by(func.strftime("%Y-%m", models.Transaction.created_at)).all()
    ) if "sqlite" in str(engine.url) else dict(
        db.query(func.to_char(models.Transaction.created_at, "YYYY-MM"), func.sum(models.Transaction.platform_commission))
        .group_by(func.to_char(models.Transaction.created_at, "YYYY-MM")).all()
    )
    active_hosts = db.query(models.HostProfile).filter(models.HostProfile.status == "APPROVED").count()
    top = (
        db.query(models.Event.title, func.count(models.Booking.id).label("n"))
        .join(models.Booking, models.Booking.event_id == models.Event.id)
        .group_by(models.Event.id).order_by(func.count(models.Booking.id).desc()).limit(5).all()
    )
    return {
        "bookings_by_type": bookings_by_type,
        "revenue_summary": revenue_by_month,
        "active_hosts": active_hosts,
        "top_listings": [{"title": t, "bookings": n} for t, n in top],
    }
