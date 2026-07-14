import sys
import os
import bcrypt
from datetime import datetime

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import User, HostProfile, Event

def seed():
    print("Rebuilding database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    pw = bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # 1. Admin
    db.add(User(email="admin@getbuddy.com", hashed_password=pw, full_name="Platform Admin", is_admin=True, country="IN"))
    db.commit()

    # 2. Approved hosts — one per country, prices in local currency
    hosts_data = [
        # (email, name, country, city, category, bio)
        ("arjun.r@example.com",  "Arjun Rao",     "IN", "Bengaluru",   "food",      "Home cook hosting slow South Indian suppers in my Indiranagar garden."),
        ("amelia.w@example.com", "Amelia Wong",   "US", "New York",    "lifestyle", "Professional mixologist taking curated drink experiences to your living room."),
        ("david.m@example.com",  "David Miller",  "GB", "London",      "music",     "Guitar instructor and jam-night regular around Camden."),
        ("sarah.j@example.com",  "Sarah Jenkins", "JP", "Tokyo",       "business",  "Startup coach for founders navigating the Tokyo ecosystem."),
        ("minji.p@example.com",  "Min-ji Park",   "KR", "Seoul",       "hangout",   "Seoul native who knows every good noodle bar and noraebang in Hongdae."),
    ]
    profiles = {}
    for email, name, country, city, category, bio in hosts_data:
        u = User(email=email, hashed_password=pw, full_name=name, country=country, city=city, is_host=True)
        db.add(u)
        db.commit()
        p = HostProfile(user_id=u.id, phone_number=f"9{u.id:09d}", phone_verified=True, status="APPROVED",
                        bio=bio, category=category, city=city)
        db.add(p)
        db.commit()
        profiles[country] = p

    # A pending applicant awaiting admin review
    u4 = User(email="priya.k@example.com", hashed_password=pw, full_name="Priya Kapoor", country="IN", city="Bengaluru")
    db.add(u4)
    db.commit()
    db.add(HostProfile(user_id=u4.id, phone_number="9998887777", phone_verified=False, status="PENDING",
                       bio="Home baker running weekend sourdough workshops.", category="food", city="Bengaluru"))
    db.commit()

    CUR = {"IN": "INR", "US": "USD", "GB": "GBP", "JP": "JPY", "KR": "KRW"}
    def listing(country, **kw):
        return Event(host_id=profiles[country].id, country=country, currency=CUR[country], status="ACTIVE", **kw)

    # 3. Events — fixed date & duration, priced per hour in local currency
    events = [
        listing("IN", title="South Indian Supper, Plated Slow",
                description="Four slow courses in my garden — appam, avial, ghee-roast, payasam. We chat, we eat, we don't rush.",
                price=400.0, event_type="Group Session", mode="Offline", category="food",
                duration_minutes=120, max_participants=8,
                start_time=datetime.fromisoformat("2026-08-08T19:30:00"),
                location_details="12, 5th Cross, Indiranagar, Bengaluru"),
        listing("US", title="Cocktail Masterclass: Tequila Variations",
                description="Deconstruct 3 classic cocktails and pick up professional bartending tricks in a small group.",
                price=40.0, event_type="Group Session", mode="Offline", category="lifestyle",
                duration_minutes=120, max_participants=8,
                start_time=datetime.fromisoformat("2026-08-14T19:00:00"),
                location_details="Williamsburg Studio, Brooklyn NY"),
        listing("GB", title="Neo-Soul Guitar Circle",
                description="Small-group session on R&B voicings and groove. Bring your guitar, leave with three new tunes.",
                price=25.0, event_type="Group Session", mode="Offline", category="music",
                duration_minutes=90, max_participants=10,
                start_time=datetime.fromisoformat("2026-08-12T18:30:00"),
                location_details="Camden Music Rooms, London NW1"),
        listing("JP", title="Founder Office Hours (English/日本語)",
                description="Confidential 1:1 on fundraising, hiring, and staying sane while scaling in Japan.",
                price=8000.0, event_type="1:1 Session", mode="Online", category="business",
                duration_minutes=60, max_participants=1,
                start_time=datetime.fromisoformat("2026-08-05T09:00:00"),
                location_details="https://zoom.us/j/founder-hours"),
        listing("KR", title="Hongdae Night-Market Food Walk",
                description="Street eats, arcade stops, and a noraebang finale. Come hungry.",
                price=30000.0, event_type="Offline Event", mode="Offline", category="food",
                duration_minutes=180, max_participants=6,
                start_time=datetime.fromisoformat("2026-08-15T18:00:00"),
                location_details="Hongik Univ. Station Exit 9, Seoul"),
    ]
    for e in events:
        db.add(e)
    db.commit()

    # 4. Buddy services — per hour, guest picks the slot
    services = [
        listing("IN", listing_kind="SERVICE", title="Movie Partner: first-day-first-show",
                description="Kannada, Hindi, Hollywood — I'm in. Snacks strategy and post-credits debates included.",
                price=250.0, event_type="1:1 Session", mode="Offline", category="movie", city="Bengaluru",
                location_details="Usually PVR Forum or Garuda Mall — exact spot after booking."),
        listing("US", listing_kind="SERVICE", title="Shopping Buddy: honest second opinions",
                description="Wardrobe refresh, gift hunting, or sneaker drops — I'll carry bags and tell you the truth in the trial room.",
                price=20.0, event_type="1:1 Session", mode="Offline", category="shopping", city="New York",
                location_details="Meet at the SoHo block — exact corner after booking."),
        listing("GB", listing_kind="SERVICE", title="Gig Buddy: live music companion",
                description="From Camden dive bars to arena shows — never queue alone again.",
                price=18.0, event_type="1:1 Session", mode="Offline", category="hangout", city="London",
                location_details="Meet at the venue entrance — confirmed after booking."),
        listing("JP", listing_kind="SERVICE", title="Hangout & Deep Talk: coffee-style video calls",
                description="A judgment-free hour to vent, brainstorm your week, or practice English/Japanese. Camera optional.",
                price=3000.0, event_type="1:1 Session", mode="Online", category="hangout", city="Online Only",
                location_details="https://meet.google.com/buddy-call — active once accepted."),
        listing("KR", listing_kind="SERVICE", title="Seoul Fitness Buddy: Han River runs",
                description="Morning runs along the Han, stretching, and a smoothie after. All paces welcome.",
                price=25000.0, event_type="1:1 Session", mode="Offline", category="fitness", city="Seoul",
                location_details="Yeouido Hangang Park entrance — pin shared after booking."),
    ]
    for s in services:
        db.add(s)
    db.commit()

    print(f"Seeding complete: {len(hosts_data)} hosts across 5 countries, {len(events)} events, {len(services)} services, 1 pending applicant.")
    db.close()

if __name__ == "__main__":
    seed()
