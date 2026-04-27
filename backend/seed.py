import sys
import os
import bcrypt
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import User, HostProfile, Event, Booking

def seed():
    print("Rebuilding database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    
    print("Generating dummy credentials...")
    pw = bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # 1. Create Admin
    admin = User(email="admin@getbuddy.com", hashed_password=pw, full_name="Platform Admin", is_admin=True)
    db.add(admin)
    db.commit()

    # 2. Create Realistic Hosts based on Stitch Mockups
    u1 = User(email="amelia.w@getbuddy.local", hashed_password=pw, full_name="Amelia Wong", city="New York", is_host=True)
    u2 = User(email="david.m@getbuddy.local", hashed_password=pw, full_name="David Miller", city="Los Angeles", is_host=True)
    u3 = User(email="sarah.j@getbuddy.local", hashed_password=pw, full_name="Sarah Jenkins", city="Online Only", is_host=True)
    
    db.add(u1)
    db.add(u2)
    db.add(u3)
    db.commit()

    h1 = HostProfile(user_id=u1.id, phone_number="1234567890", phone_verified=True, bio="Professional mixologist taking curated drink experiences to your living room.", category="Lifestyle", city="New York")
    h2 = HostProfile(user_id=u2.id, phone_number="0987654321", phone_verified=True, bio="Technical guitar instructor focusing on neo-soul paradigms.", category="Music", city="Los Angeles")
    h3 = HostProfile(user_id=u3.id, phone_number="1112223333", phone_verified=True, bio="Life Coach specializing in executive mentorship and startup growth.", category="Business", city="Online Only")
    
    db.add(h1)
    db.add(h2)
    db.add(h3)
    db.commit()

    # 3. Create Events
    events = [
        Event(
            host_id=h1.id,
            title="Cocktail Masterclass: Tequila Variations",
            description="Join me for a 2-hour offline group session where we deconstruct 3 classic cocktails and impart professional bartending tricks.",
            price=150.0,
            event_type="Group Session",
            mode="Offline",
            start_time=datetime.fromisoformat("2026-05-15T19:00:00+00:00"),
            status="ACTIVE",
            location_details="Williamsburg Studio, Brooklyn NY"
        ),
        Event(
            host_id=h1.id,
            title="1:1 Mixology Basics",
            description="A personalized virtual hour discussing essential tools of the trade.",
            price=60.0,
            event_type="1:1 Session",
            mode="Online",
            start_time=datetime.fromisoformat("2026-05-18T14:00:00+00:00"),
            status="ACTIVE",
            location_details="https://zoom.us/j/827182"
        ),
        Event(
            host_id=h2.id,
            title="Neo-Soul Chord Progressions",
            description="Advanced group class diving into R&B voicings. Bring your guitar.",
            price=45.0,
            event_type="Group Session",
            mode="Online",
            start_time=datetime.fromisoformat("2026-05-20T10:00:00+00:00"),
            status="ACTIVE",
            location_details="https://meet.google.com/abc-xyz"
        ),
        Event(
            host_id=h3.id,
            title="Startup Founder Therapy",
            description="Strictly confidential 1:1 session discussing burnout, delegation, and scaling.",
            price=300.0,
            event_type="1:1 Session",
            mode="Online",
            start_time=datetime.fromisoformat("2026-06-01T09:00:00+00:00"),
            status="ACTIVE",
            location_details="https://zoom.us/j/private-link"
        )
    ]
    
    for e in events:
        db.add(e)
    db.commit()
    
    print("Seeding Complete. 4 premium curations injected into the database.")
    db.close()

if __name__ == "__main__":
    seed()
