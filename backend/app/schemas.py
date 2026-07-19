from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=100)
    country: str = Field(default="IN", pattern="^[A-Z]{2}$")  # any ISO country — hosts can be anywhere
    city: Optional[str] = None
    profile_photo: Optional[str] = Field(default=None, max_length=700_000)  # base64 data-URL, ~500KB image

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

class User(UserBase):
    id: int
    is_active: bool
    deletion_requested: bool = False
    is_host: bool
    is_admin: bool
    host_status: Optional[str] = None  # None / PENDING / APPROVED / REJECTED
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    city: Optional[str] = Field(default=None, max_length=100)
    profile_photo: Optional[str] = Field(default=None, max_length=700_000)

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

class HostProfileUpdate(BaseModel):
    bio: Optional[str] = Field(default=None, max_length=2000)
    expertise: Optional[str] = Field(default=None, max_length=200)
    category: Optional[str] = Field(default=None, max_length=100)
    city: Optional[str] = Field(default=None, max_length=100)
    instagram: Optional[str] = Field(default=None, max_length=200)
    linkedin: Optional[str] = Field(default=None, max_length=200)
    website: Optional[str] = Field(default=None, max_length=200)

class HostApply(BaseModel):
    phone_number: str = Field(min_length=5, max_length=20)
    bio: Optional[str] = Field(default=None, max_length=2000)
    expertise: Optional[str] = Field(default=None, max_length=200)
    category: Optional[str] = Field(default=None, max_length=100)
    city: Optional[str] = Field(default=None, max_length=100)

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
    listing_kind: str = Field(default="EVENT", pattern="^(EVENT|SERVICE)$")
    title: str = Field(min_length=1, max_length=200)
    description: str
    price: float = Field(ge=0)  # hourly rate
    event_type: str
    mode: str
    category: Optional[str] = None
    city: Optional[str] = None
    cover_image: Optional[str] = Field(default=None, max_length=700_000)  # base64 data-URL, ~500KB image
    start_time: Optional[datetime] = None  # required for EVENT, ignored for SERVICE
    duration_minutes: int = Field(default=60, gt=0)
    max_participants: int = Field(default=1, gt=0)
    status: str = "ACTIVE"
    traveller_friendly: bool = False
    community_id: Optional[int] = None  # community-only listing, hidden from public catalog

class EventCreate(EventBase):
    # Address / meeting link — private, only shown to confirmed guests
    location_details: Optional[str] = None

# Public event: no location_details (revealed only after booking)
class Event(EventBase):
    id: int
    host_id: int
    country: str = "IN"
    currency: str = "INR"
    created_at: Optional[datetime] = None  # drives the 1-hour edit window in the host UI

    class Config:
        from_attributes = True

class BookingBase(BaseModel):
    event_id: int

class BookingCreate(BookingBase):
    # SERVICE bookings only: the guest picks when and for how long
    start_time: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(default=None, ge=30, le=480)

class Booking(BookingBase):
    id: int
    user_id: int
    status: str
    payment_status: str
    start_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    created_at: datetime
    # Present only in the create-booking response when Stripe is configured
    checkout_url: Optional[str] = None

    class Config:
        from_attributes = True

class Transaction(BaseModel):
    id: int
    booking_id: int
    gross_amount: float
    platform_commission: float
    host_payout: float
    currency: str = "INR"
    payout_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class Notification(BaseModel):
    id: int
    title: str
    body: Optional[str] = None
    link: Optional[str] = None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CommunityCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, max_length=2000)
    city: Optional[str] = Field(default=None, max_length=100)
    cover_image: Optional[str] = Field(default=None, max_length=700_000)

class CommunityJoin(BaseModel):
    invite_code: str = Field(min_length=1, max_length=32)

class SubgroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    interest: Optional[str] = Field(default=None, max_length=50)

class SettingsUpdate(BaseModel):
    # Fractions, e.g. 0.15 = 15%. Both optional so either can be updated alone.
    commission_rate: Optional[float] = None  # 0..0.9
    payment_fee_rate: Optional[float] = None  # 0..0.5

class AdminMetrics(BaseModel):
    total_users: int
    total_hosts: int
    total_listings: int
    total_bookings: int
    total_revenue: float  # naive sum across currencies; use revenue_by_currency for the truth
    revenue_by_currency: dict = {}
