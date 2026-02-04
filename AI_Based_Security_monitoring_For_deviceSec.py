import cv2
import face_recognition
import numpy as np
import pickle
import time
import subprocess
import os

# === CONFIGURATION ===
MODEL_PATH = "face_model.pkl"
LOCK_SCRIPT = "src/win.bat"
AUTHORIZED_USER = "manish"
CONFIDENCE_THRESHOLD = 0.6
LOCK_DELAY = 10  # seconds

# === Load model ===
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

def extract_embedding(frame):
    """Extract face encoding using face_recognition library"""
    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    rgb_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
    
    face_locations = face_recognition.face_locations(rgb_frame)
    if len(face_locations) > 0:
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
        if len(face_encodings) > 0:
            return face_encodings[0]
    return None

cap = cv2.VideoCapture(0)
no_auth_start = None

print("[INFO] Monitoring started. Press 'q' to quit.")

while True:
    ret, frame = cap.read()
    if not ret:
        break

    embedding = extract_embedding(frame)
    state = None
    confidence = 0.0

    if embedding is not None:
        try:
            # Get prediction and confidence
            predicted = model.predict([embedding])[0]
            distances, indices = model.kneighbors([embedding], n_neighbors=1)
            confidence = 1 - (distances[0][0] / 2)  # Normalize distance to confidence
            
            if predicted == AUTHORIZED_USER and confidence >= CONFIDENCE_THRESHOLD:
                state = "AUTHORIZED ✓"
                no_auth_start = None
            else:
                state = f"UNAUTHORIZED - {predicted}"
                if no_auth_start is None:
                    no_auth_start = time.time()
                    print(f"[WARNING] Unauthorized person detected: {predicted}")
        except Exception as e:
            print(f"[ERROR] Prediction failed: {e}")
            state = "ERROR"
            if no_auth_start is None:
                no_auth_start = time.time()
    else:
        state = "NO FACE"
        if no_auth_start is None:
            no_auth_start = time.time()

    # === Lock system ===
    if no_auth_start and (time.time() - no_auth_start > LOCK_DELAY):
        print("[SECURITY] Unauthorized or no user detected. Locking device.")
        subprocess.call([LOCK_SCRIPT])
        break

    # === Display ===
    if state == "AUTHORIZED ✓":
        color = (0, 255, 0)
        label = f"{state} ({confidence:.2f})"
    elif state == "NO FACE":
        color = (128, 128, 128)
        label = state
    else:
        color = (0, 0, 255)
        label = f"{state} ({confidence:.2f})"
    
    cv2.putText(frame, label, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)
    cv2.putText(frame, f"Time: {max(0, LOCK_DELAY - int(time.time() - no_auth_start) if no_auth_start else LOCK_DELAY)}s", 
                (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    cv2.imshow("AI Security Monitoring", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
