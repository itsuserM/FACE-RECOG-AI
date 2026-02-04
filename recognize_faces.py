import face_recognition
import cv2
import pickle

# Load trained model
with open("models/face_model.pkl", "rb") as f:
    model = pickle.load(f)

# Initialize video capture
video = cv2.VideoCapture(0)

while True:
    ret, frame = video.read()
    if not ret:
        break

    # Resize frame for faster processing (optional)
    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
    rgb_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

    # Detect faces
    face_locations = face_recognition.face_locations(rgb_frame)
    try:
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
    except Exception as e:
        print("Encoding failed:", e)
        face_encodings = []

    for (top, right, bottom, left), encoding in zip(face_locations, face_encodings):
        name = "Unknown"

        try:
            # Predict identity
            name = model.predict([encoding])[0]
        except Exception as e:
            print("Prediction failed:", e)

        # Rescale coordinates to original frame size
        top *= 4
        right *= 4
        bottom *= 4
        left *= 4

        # Draw a box and name
        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
        cv2.putText(frame, name, (left, top - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)

    # Show the frame
    cv2.imshow("Face Recognition", frame)

    # Exit on 'q'
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Cleanup
video.release()
cv2.destroyAllWindows()
