from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func

from . import models, schemas, auth
from .database import engine, Base, get_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GetBuddy API - Extended")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(email=user.email, full_name=user.full_name, hashed_password=hashed_password)
    
    # Very unsafe dummy role assignment for MVP testing: first user is admin
    if db.query(models.User).count() == 0:
        db_user.is_admin = True

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
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
@app.post("/host/request-verification")
def request_phone_verification(phone_number: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return {"message": "OTP sent.", "mock_code": "123456"}

@app.post("/host/verify-phone", response_model=schemas.User)
def verify_phone(req: schemas.VerifyPhoneRequest, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if req.code != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    profile = current_user.host_profile
    if not profile:
        profile = models.HostProfile(user_id=current_user.id, phone_number=req.phone_number, phone_verified=True)
        db.add(profile)
    else:
        profile.phone_number = req.phone_number
        profile.phone_verified = True
    
    current_user.is_host = True
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
        enhanced.append({
            "id": b.id,
            "status": b.status,
            "payment_status": b.payment_status,
            "created_at": b.created_at,
            "event_title": event_dict[b.event_id].title,
            "start_time": event_dict[b.event_id].start_time,
            "guest_name": user.full_name if user else "Unknown Guest",
            "guest_email": user.email if user else "Unknown Email"
        })
    return enhanced

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
            "payout_status": tx.payout_status,
            "event_title": event_dict[b.event_id].title
        })
    return enhanced

@app.post("/events", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_host)):
    db_event = models.Event(**event.model_dump(), host_id=current_user.host_profile.id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.get("/events", response_model=List[schemas.Event])
def list_events(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    events = db.query(models.Event).offset(skip).limit(limit).all()
    return events

# ---- BOOKINGS & PAYMENTS ----
@app.post("/bookings", response_model=schemas.Booking)
def book_event(booking: schemas.BookingCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == booking.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    existing_booking = db.query(models.Booking).filter(models.Booking.user_id == current_user.id, models.Booking.event_id == event.id).first()
    if existing_booking:
        raise HTTPException(status_code=400, detail="You have already registered for this event.")
        
    db_booking = models.Booking(user_id=current_user.id, event_id=event.id, status="CONFIRMED", payment_status="PAID")
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)

    # Mock payment transaction & earning logic
    platform_commission_rate = 0.15
    commission = event.price * platform_commission_rate
    payout = event.price - commission

    tx = models.Transaction(
        booking_id=db_booking.id,
        gross_amount=event.price,
        platform_commission=commission,
        host_payout=payout,
        payout_status="PENDING"
    )
    db.add(tx)
    
    host_profile = db.query(models.HostProfile).filter(models.HostProfile.id == event.host_id).first()
    host_profile.total_earnings += payout

    db.commit()
    return db_booking

# ---- USERS ----
@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.get("/users/me/bookings", response_model=List[schemas.Booking])
def get_my_bookings(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return db.query(models.Booking).filter(models.Booking.user_id == current_user.id).all()

# ---- ADMIN PANEL ROUTES ----
@app.get("/admin/metrics", response_model=schemas.AdminMetrics)
def get_admin_metrics(db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    total_users = db.query(models.User).count()
    total_hosts = db.query(models.HostProfile).count()
    total_listings = db.query(models.Event).count()
    total_bookings = db.query(models.Booking).count()
    total_revenue = db.query(func.sum(models.Transaction.platform_commission)).scalar() or 0.0

    return schemas.AdminMetrics(
        total_users=total_users,
        total_hosts=total_hosts,
        total_listings=total_listings,
        total_bookings=total_bookings,
        total_revenue=total_revenue
    )

@app.get("/admin/users", response_model=List[schemas.User])
def get_admin_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.User).offset(skip).limit(limit).all()

@app.get("/admin/hosts")
def get_admin_hosts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    hosts = db.query(models.HostProfile).offset(skip).limit(limit).all()
    # Serialize manually for quick MVP integration
    return [{"id": h.id, "user_id": h.user_id, "phone_number": h.phone_number, "phone_verified": h.phone_verified, "category": h.category, "total_earnings": h.total_earnings} for h in hosts]

@app.get("/admin/listings", response_model=List[schemas.Event])
def get_admin_listings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.Event).offset(skip).limit(limit).all()

@app.get("/admin/bookings", response_model=List[schemas.Booking])
def get_admin_bookings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.Booking).offset(skip).limit(limit).all()

@app.get("/admin/transactions", response_model=List[schemas.Transaction])
def get_admin_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return db.query(models.Transaction).offset(skip).limit(limit).all()

# For MVP Analytics, we just return static mock data representing business trends
@app.get("/admin/analytics")
def get_admin_analytics(db: Session = Depends(get_db), current_admin: models.User = Depends(auth.get_current_admin)):
    return {
        "bookings_by_type": {"1:1 Session": 45, "Group Session": 12, "Online Event": 65, "Offline Event": 10},
        "revenue_summary": {"Jan": 400.0, "Feb": 650.0, "Mar": 890.0},
        "active_hosts": 15,
        "top_listings": [{"title": "Guitar Masterclass", "bookings": 24}, {"title": "Coffee Meetup", "bookings": 18}]
    }
