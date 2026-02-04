import face_recognition
import cv2
import pickle
import time
import subprocess
import pyttsx3
import os
import requests
from datetime import datetime

# === API CONFIG ===
API_BASE = os.getenv("API_BASE", "http://localhost:8000")
INGEST_KEY = os.getenv("INGEST_KEY", "ingest-12345")

AUTHORIZED_USER = "manish"
LOCK_DELAY = 10  # seconds

# === Send events to Node server ===
def send_event(user: str, event: str, confidence: float | None = None):
    try:
        payload = {
            "ts": datetime.utcnow().isoformat(),
            "user": user,
            "event": event,
            "confidence": confidence,
        }
        requests.post(
            f"{API_BASE}/api/events",
            json=payload,
            headers={"X-INGEST-KEY": INGEST_KEY},
            timeout=3,
        )
    except Exception as e:
        print("[EVENT SEND FAILED]", e)

# === Voice alert ===
def speak_alert():
    engine = pyttsx3.init()
    engine.say("Unauthorized activity detected. Locking the system.")
    engine.runAndWait()

# === Load model ===
with open("models/face_model.pkl", "rb") as f:
    model = pickle.load(f)

video = cv2.VideoCapture(0)
no_auth_start = None
last_state = None   # manish | unauthorized_person | no_user

print("[INFO] Monitoring started. Press 'q' to quit.")

while True:
    ret, frame = video.read()
    if not ret:
        break

    small = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)

    face_locations = face_recognition.face_locations(rgb)
    face_encodings = face_recognition.face_encodings(rgb, face_locations)

    current_state = None

    if face_encodings:
        try:
            predicted = model.predict([face_encodings[0]])[0]
        except:
            predicted = "unknown"

        if predicted == AUTHORIZED_USER:
            current_state = "manish"
            no_auth_start = None
            if last_state != "manish":
                send_event("manish", "authorized_user")
        else:
            current_state = "unauthorized_person"
            if no_auth_start is None:
                no_auth_start = time.time()
            if last_state != "unauthorized_person":
                send_event("unauthorized_person", "unauthorized_face")

    else:
        current_state = "no_user"
        if no_auth_start is None:
            no_auth_start = time.time()
        if last_state != "no_user":
            send_event("no_user", "no_face_detected")

    # === Lock condition ===
    if no_auth_start and (time.time() - no_auth_start > LOCK_DELAY):
        print("[SECURITY] Locking system due to unauthorized/no user...")
        speak_alert()
        send_event("system", "screen_locked")
        subprocess.call(["cmd", "/c", "src\\win.bat"])
        break

    # === Draw UI ===
    for (top, right, bottom, left) in face_locations:
        top, right, bottom, left = top*4, right*4, bottom*4, left*4
        color = (0,255,0) if current_state == "manish" else (0,0,255)
        label = "AUTHORIZED" if current_state == "manish" else "UNAUTHORIZED"
        cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
        cv2.putText(frame, label, (left, top-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

    cv2.imshow("Face Monitoring", frame)
    last_state = current_state

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

video.release()
cv2.destroyAllWindows()
