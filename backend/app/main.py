import os
import stripe
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func

from . import models, schemas, auth
from .database import engine, get_db

# Schema is managed by Alembic migrations — run `alembic upgrade head` on deploy.
# (Serverless has no startup hook to migrate; don't create tables at import time.)

app = FastAPI(title="GetBuddy API")

# Supported countries and their local currency — listings are priced in the host's currency
COUNTRIES = {"IN": "INR", "US": "USD", "GB": "GBP", "JP": "JPY", "KR": "KRW"}

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
ZERO_DECIMAL_CURRENCIES = {"JPY", "KRW"}  # Stripe amounts for these are not in cents

# Platform commission is admin-tunable (settings table); this is the fallback.
DEFAULT_COMMISSION_RATE = 0.15

def get_commission_rate(db: Session) -> float:
    s = db.query(models.Setting).filter(models.Setting.key == "commission_rate").first()
    try:
        return float(s.value) if s else DEFAULT_COMMISSION_RATE
    except (TypeError, ValueError):
        return DEFAULT_COMMISSION_RATE

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

def _checkout_url_for(booking: "models.Booking", event: "models.Event") -> str:
    """Create a Stripe Checkout session for a booking. Amount is always computed
    server-side from the listing's rate x duration, in the listing's currency."""
    _assert_stripe_usable()
    stripe.api_key = STRIPE_SECRET_KEY
    minutes = booking.duration_minutes or event.duration_minutes or 60
    gross = round(event.price * minutes / 60)
    currency = (event.currency or "INR").upper()
    unit_amount = int(gross if currency in ZERO_DECIMAL_CURRENCIES else gross * 100)
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{
                "price_data": {
                    "currency": currency.lower(),
                    "product_data": {"name": event.title},
                    "unit_amount": unit_amount,
                },
                "quantity": 1,
            }],
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
        "currency": COUNTRIES.get(current_user.country or "IN", "INR"),
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
            "guest_email": user.email if user else "Unknown Email"
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
    # Listing lives in the host's country and is priced in its currency
    data["country"] = current_user.country or "IN"
    data["currency"] = COUNTRIES.get(data["country"], "INR")
    db_event = models.Event(**data, host_id=current_user.host_profile.id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.get("/events", response_model=List[schemas.Event])
def list_events(kind: Optional[str] = None, country: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # Public catalog: only live listings, no private location details (see schema)
    q = db.query(models.Event).filter(models.Event.status == "ACTIVE")
    if kind in ("EVENT", "SERVICE"):
        q = q.filter(models.Event.listing_kind == kind)
    if country in COUNTRIES:
        q = q.filter(models.Event.country == country)
    return q.offset(skip).limit(limit).all()

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
        db_booking.checkout_url = _checkout_url_for(db_booking, event)  # transient, not stored
        return db_booking

    # ponytail: mock payment path for local dev without Stripe keys
    db_booking = models.Booking(user_id=current_user.id, event_id=event.id, status="CONFIRMED", payment_status="PAID")
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    _settle_booking(db, db_booking, event)

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
    return {"checkout_url": _checkout_url_for(booking, booking.event)}

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
            db.commit()
    return {"received": True}

# ---- USERS ----
@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

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

# ---- ADMIN PANEL ROUTES ----
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
        "currency": COUNTRIES.get(h.user.country if h.user else "IN", "INR"),
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
    db.commit()
    return {"id": profile.id, "status": profile.status}

@app.post("/admin/hosts/{host_id}/reject")
def reject_host(host_id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    profile = db.query(models.HostProfile).filter(models.HostProfile.id == host_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Host application not found")
    profile.status = "REJECTED"
    profile.user.is_host = False
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

@app.get("/admin/settings")
def get_admin_settings(db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return {"commission_rate": get_commission_rate(db)}

@app.put("/admin/settings")
def update_admin_settings(update: schemas.SettingsUpdate, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    rate = update.commission_rate
    if not (0 <= rate <= 0.9):
        raise HTTPException(status_code=400, detail="Commission rate must be between 0 and 0.9 (0–90%).")
    s = db.query(models.Setting).filter(models.Setting.key == "commission_rate").first()
    if s:
        s.value = str(rate)
    else:
        db.add(models.Setting(key="commission_rate", value=str(rate)))
    db.commit()
    return {"commission_rate": rate}

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
