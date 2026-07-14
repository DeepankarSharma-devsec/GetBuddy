from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from .database import Base

class EventType(str, enum.Enum):
    ONE_ON_ONE = "1:1 Session"
    GROUP = "Group Session"
    EVENT_ONLINE = "Online Event"
    EVENT_OFFLINE = "Offline Event"

class EventMode(str, enum.Enum):
    ONLINE = "Online"
    OFFLINE = "Offline"

class ListingStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_host = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    country = Column(String, default="IN")  # IN, US, GB, JP, KR
    city = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    host_profile = relationship("HostProfile", back_populates="user", uselist=False)
    bookings = relationship("Booking", back_populates="user")
    reviews_given = relationship("Review", back_populates="user")

    @property
    def host_status(self):
        # None until the user applies; PENDING/APPROVED/REJECTED afterwards
        return self.host_profile.status if self.host_profile else None

class HostProfile(Base):
    __tablename__ = "host_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    phone_number = Column(String, unique=True)
    phone_verified = Column(Boolean, default=False)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    bio = Column(Text, nullable=True)
    expertise = Column(String, nullable=True)
    category = Column(String, nullable=True)
    city = Column(String, nullable=True)
    total_earnings = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="host_profile")
    events = relationship("Event", back_populates="host")
    reviews_received = relationship("Review", back_populates="host")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    # EVENT: host fixes start_time/duration, guests take seats.
    # SERVICE: an ongoing per-hour offering (buddy); the guest picks time & hours on booking.
    listing_kind = Column(String, default="EVENT")  # EVENT, SERVICE
    title = Column(String, index=True)
    description = Column(Text)
    price = Column(Float)
    event_type = Column(String) # from EventType
    mode = Column(String) # from EventMode
    category = Column(String, nullable=True)
    city = Column(String, nullable=True)  # discovery filter, mainly for services
    # Set from the host's country at creation — prices are in the host's local currency
    country = Column(String, default="IN")
    currency = Column(String, default="INR")
    cover_image = Column(String, nullable=True)
    location_details = Column(String, nullable=True)
    start_time = Column(DateTime, nullable=True)  # null for services
    duration_minutes = Column(Integer, default=60)
    max_participants = Column(Integer, default=1)
    status = Column(String, default=ListingStatus.ACTIVE)
    
    host_id = Column(Integer, ForeignKey("host_profiles.id"))
    host = relationship("HostProfile", back_populates="events")
    bookings = relationship("Booking", back_populates="event")
    reviews = relationship("Review", back_populates="event")

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    status = Column(String, default="PENDING") # REQUESTED, CONFIRMED, DECLINED, CANCELLED, COMPLETED
    payment_status = Column(String, default="PENDING") # PENDING, PAID, REFUNDED
    # Guest-chosen slot — only set for SERVICE bookings (events use the listing's schedule)
    start_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="bookings")
    event = relationship("Event", back_populates="bookings")
    transaction = relationship("Transaction", back_populates="booking", uselist=False)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"))
    gross_amount = Column(Float)
    platform_commission = Column(Float)
    host_payout = Column(Float)
    currency = Column(String, default="INR")
    payout_status = Column(String, default="PENDING") # PENDING, PAID
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    booking = relationship("Booking", back_populates="transaction")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    host_id = Column(Integer, ForeignKey("host_profiles.id"))
    event_id = Column(Integer, ForeignKey("events.id"))
    star_rating = Column(Integer)
    review_text = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="reviews_given")
    host = relationship("HostProfile", back_populates="reviews_received")
    event = relationship("Event", back_populates="reviews")

class Setting(Base):
    # Simple key/value store for admin-tunable config (e.g. commission_rate).
    __tablename__ = "settings"

    key = Column(String, primary_key=True)
    value = Column(String)
