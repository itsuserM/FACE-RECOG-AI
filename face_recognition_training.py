import face_recognition
import os
import cv2
import pickle
from sklearn.neighbors import KNeighborsClassifier

dataset_path = "dataset"
model_save_path = "face_model.pkl"

X = []
y = []

# Create model directory
os.makedirs("models", exist_ok=True)

# Loop through dataset
for person_name in os.listdir(dataset_path):
    person_dir = os.path.join(dataset_path, person_name)
    if not os.path.isdir(person_dir):
        continue

    print(f"[INFO] Processing: {person_name}")

    for image_name in os.listdir(person_dir):
        image_path = os.path.join(person_dir, image_name)
        image = cv2.imread(image_path)

        if image is None:
            print(f"[WARNING] Cannot read: {image_path}, skipping.")
            continue

        image = cv2.resize(image, (500, 500))
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        face_locations = face_recognition.face_locations(rgb_image, number_of_times_to_upsample=0)
        if len(face_locations) != 1:
            print(f"[WARNING] Found {len(face_locations)} faces in {image_path}, skipping.")
            continue

        encoding = face_recognition.face_encodings(rgb_image, face_locations)[0]
        X.append(encoding)
        y.append(person_name)

# Train and save model
if len(X) > 0:
    knn = KNeighborsClassifier(n_neighbors=1)
    knn.fit(X, y)
    with open(model_save_path, "wb") as f:
        pickle.dump(knn, f)
    print(f"[INFO] Model trained and saved to {model_save_path}")
    print(f"[INFO] Training data: {len(X)} images, Classes: {set(y)}")
else:
    print("[ERROR] No valid training data found.")
