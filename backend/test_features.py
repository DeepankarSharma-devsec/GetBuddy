"""Smoke tests for the July 2026 feature pack.
Run: python -m pytest test_features.py -q   (or just: python test_features.py)
"""
import os
os.environ["DATABASE_URL"] = "sqlite:///./test_features.db"

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.database import Base, engine, SessionLocal
from app import models
from app.main import app

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
client = TestClient(app)


def register_and_login(email, name="Test User"):
    client.post("/register", json={"email": email, "password": "password123", "full_name": name, "country": "IN"})
    r = client.post("/login", data={"username": email, "password": "password123"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def make_host(email, name="Host User"):
    h = register_and_login(email, name)
    client.post("/host/apply", json={"phone_number": f"9{abs(hash(email)) % 10**9:09d}"}, headers=h)
    db = SessionLocal()
    profile = db.query(models.HostProfile).join(models.User).filter(models.User.email == email).first()
    profile.status = "APPROVED"
    profile.user.is_host = True
    db.commit()
    db.close()
    return h


def test_country_not_restricted():
    r = client.post("/register", json={"email": "br@example.com", "password": "password123",
                                       "full_name": "Ana", "country": "BR"})
    assert r.status_code == 200, r.text


def test_edit_window():
    h = make_host("edit-host@example.com")
    r = client.post("/events", json={"listing_kind": "SERVICE", "title": "Movie buddy", "description": "d",
                                     "price": 100, "event_type": "1:1 Session", "mode": "Online"}, headers=h)
    assert r.status_code == 200, r.text
    eid = r.json()["id"]

    # Inside the window: edit succeeds
    r = client.put(f"/events/{eid}", json={"listing_kind": "SERVICE", "title": "Movie buddy v2", "description": "d",
                                           "price": 150, "event_type": "1:1 Session", "mode": "Online"}, headers=h)
    assert r.status_code == 200 and r.json()["title"] == "Movie buddy v2"

    # Age the listing past 1 hour: edit is refused
    db = SessionLocal()
    ev = db.get(models.Event, eid)
    ev.created_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(hours=2)
    db.commit(); db.close()
    r = client.put(f"/events/{eid}", json={"listing_kind": "SERVICE", "title": "too late", "description": "d",
                                           "price": 150, "event_type": "1:1 Session", "mode": "Online"}, headers=h)
    assert r.status_code == 403


def test_notification_on_accept():
    h = make_host("notif-host@example.com")
    guest = register_and_login("notif-guest@example.com", "Guest G")
    eid = client.post("/events", json={"listing_kind": "SERVICE", "title": "Gym buddy", "description": "d",
                                       "price": 100, "event_type": "1:1 Session", "mode": "Online"}, headers=h).json()["id"]
    b = client.post("/bookings", json={"event_id": eid, "start_time": "2026-08-01T10:00:00",
                                       "duration_minutes": 60}, headers=guest)
    assert b.status_code == 200, b.text
    # Host got a "new request" notification
    assert any("request" in n["title"].lower() for n in client.get("/users/me/notifications", headers=h).json())
    # Guest gets an "accepted" notification after the host accepts
    bid = b.json()["id"]
    assert client.post(f"/host/me/bookings/{bid}/accept", headers=h).status_code == 200
    notes = client.get("/users/me/notifications", headers=guest).json()
    assert any("accepted" in n["title"].lower() for n in notes)
    # Mark-read works
    client.post("/users/me/notifications/read", headers=guest)
    assert all(n["read"] for n in client.get("/users/me/notifications", headers=guest).json())


def test_community_join_and_private_listing():
    h = make_host("comm-host@example.com")
    member = register_and_login("comm-member@example.com", "Member M")
    c = client.post("/communities", json={"name": "Sunrise Apartments"}, headers=h).json()
    code = c["invite_code"]
    assert code

    # Wrong code fails, right code joins
    assert client.post("/communities/join", json={"invite_code": "nope1234"}, headers=member).status_code == 404
    assert client.post("/communities/join", json={"invite_code": code}, headers=member).status_code == 200

    # Community-only listing stays off the public catalog but shows in the community
    eid = client.post("/events", json={"listing_kind": "EVENT", "title": "Society potluck", "description": "d",
                                       "price": 0, "event_type": "Group Session", "mode": "Offline",
                                       "start_time": "2026-08-01T18:00:00", "city": "Bengaluru",
                                       "community_id": c["id"]}, headers=h).json()["id"]
    assert eid not in [e["id"] for e in client.get("/events").json()]
    detail = client.get(f"/communities/{c['id']}", headers=member).json()
    assert eid in [e["id"] for e in detail["events"]]

    # Non-members are locked out; only owner can add sub-groups
    outsider = register_and_login("outsider@example.com")
    assert client.get(f"/communities/{c['id']}", headers=outsider).status_code == 403
    assert client.post(f"/communities/{c['id']}/subgroups", json={"name": "Food", "interest": "food"}, headers=member).status_code == 403
    assert client.post(f"/communities/{c['id']}/subgroups", json={"name": "Food", "interest": "food"}, headers=h).status_code == 200


def test_oversized_photo_rejected():
    h = make_host("photo-host@example.com")
    huge = "data:image/jpeg;base64," + "A" * 800_000
    r = client.post("/events", json={"listing_kind": "SERVICE", "title": "x", "description": "d", "price": 10,
                                     "event_type": "1:1 Session", "mode": "Online", "cover_image": huge}, headers=h)
    assert r.status_code == 422


def test_public_host_profile_and_filters():
    h = make_host("public-host@example.com", "Priya Host")
    client.put("/host/me/profile", json={"bio": "I host suppers.", "instagram": "@priya"}, headers=h)
    eid = client.post("/events", json={"listing_kind": "EVENT", "title": "Trek at dawn", "description": "d",
                                       "price": 500, "event_type": "Group Session", "mode": "Offline",
                                       "start_time": "2026-08-02T06:00:00", "city": "Bengaluru",
                                       "traveller_friendly": True}, headers=h).json()
    p = client.get(f"/hosts/{eid['host_id']}/public").json()
    assert p["name"] == "Priya Host" and p["instagram"] == "@priya"
    assert any(l["id"] == eid["id"] for l in p["listings"])
    # City + traveller filters are server-side now
    assert any(e["id"] == eid["id"] for e in client.get("/events?city=bengaluru&traveller=true").json())
    assert all(e["city"] != "Bengaluru" or e["traveller_friendly"] for e in client.get("/events?traveller=true").json())


if __name__ == "__main__":
    for fn in [test_country_not_restricted, test_edit_window, test_notification_on_accept,
               test_community_join_and_private_listing, test_oversized_photo_rejected,
               test_public_host_profile_and_filters]:
        fn()
        print(f"ok  {fn.__name__}")
    print("all checks passed")
