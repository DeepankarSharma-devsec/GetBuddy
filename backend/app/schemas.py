from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    city: Optional[str] = None
    profile_photo: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    is_host: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    is_admin: bool

class TokenData(BaseModel):
    email: Optional[str] = None

class HostProfileCreate(BaseModel):
    phone_number: str
    bio: Optional[str] = None
    expertise: Optional[str] = None
    category: Optional[str] = None
    city: Optional[str] = None

class VerifyPhoneRequest(BaseModel):
    phone_number: str
    code: str

class ReviewBase(BaseModel):
    star_rating: int
    review_text: str
    event_id: int
    host_id: int

class ReviewCreate(ReviewBase):
    pass

class Review(ReviewBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EventBase(BaseModel):
    title: str
    description: str
    price: float
    event_type: str
    mode: str
    category: Optional[str] = None
    cover_image: Optional[str] = None
    location_details: Optional[str] = None
    start_time: datetime
    duration_minutes: int = 60
    max_participants: int = 1
    status: str = "ACTIVE"

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    host_id: int

    class Config:
        from_attributes = True

class BookingBase(BaseModel):
    event_id: int

class BookingCreate(BookingBase):
    pass

class Booking(BookingBase):
    id: int
    user_id: int
    status: str
    payment_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class Transaction(BaseModel):
    id: int
    booking_id: int
    gross_amount: float
    platform_commission: float
    host_payout: float
    payout_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class AdminMetrics(BaseModel):
    total_users: int
    total_hosts: int
    total_listings: int
    total_bookings: int
    total_revenue: float
