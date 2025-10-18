import cv2
import pandas as pd
import numpy as np
from ultralytics import YOLO
from tracker.centroidtracker import CentroidTracker
from tracker.trackableobject import TrackableObject
from imutils.video import FPS
import dlib
import logging
import time

# Setup logger
logging.basicConfig(level=logging.INFO, format="[INFO] %(message)s")
logger = logging.getLogger(__name__)

model = YOLO('yolov8x.pt')
test_video = 'Input/input2.mp4'
cap = cv2.VideoCapture(test_video)

with open("coco.txt", "r") as f:
    class_list = f.read().splitlines()

# Variables globales pour dessiner la ligne libre
drawing = True
line_points = []

def on_mouse(event, x, y, flags, param):
    global drawing, line_points
    if drawing:
        if event == cv2.EVENT_LBUTTONDOWN:
            line_points.append((x, y))

cv2.namedWindow("People Count")
cv2.setMouseCallback("People Count", on_mouse)

def get_person_coordinates(frame):
    results = model.predict(frame, verbose=False)
    a = results[0].boxes.data.detach().cpu()
    px = pd.DataFrame(a).astype("float")

    list_corr = []
    for _, row in px.iterrows():
        x1, y1, x2, y2, _, class_id = row
        if class_list[int(class_id)] == 'person':
            list_corr.append([x1, y1, x2, y2])
    return list_corr

def orientation(a, b, c):
    val = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1])
    if val == 0:
        return 0
    return 1 if val > 0 else 2

def on_segment(a, b, c):
    if min(a[0], c[0]) <= b[0] <= max(a[0], c[0]) and min(a[1], c[1]) <= b[1] <= max(a[1], c[1]):
        return True
    return False

def segments_intersect(p1, q1, p2, q2):
    o1 = orientation(p1, q1, p2)
    o2 = orientation(p1, q1, q2)
    o3 = orientation(p2, q2, p1)
    o4 = orientation(p2, q2, q1)

    if o1 != o2 and o3 != o4:
        return True
    if o1 == 0 and on_segment(p1, p2, q1):
        return True
    if o2 == 0 and on_segment(p1, q2, q1):
        return True
    if o3 == 0 and on_segment(p2, p1, q2):
        return True
    if o4 == 0 and on_segment(p2, q1, q2):
        return True
    return False

def check_line_crossing(prev_point, curr_point, line_points):
    for i in range(len(line_points) - 1):
        p1 = line_points[i]
        p2 = line_points[i + 1]
        if segments_intersect(prev_point, curr_point, p1, p2):
            return True
    return False

def people_counter():
    global drawing, line_points
    count = 0
    ct = CentroidTracker(maxDisappeared=40, maxDistance=40)
    trackers = []
    trackableObjects = {}

    totalFrames = 0
    totalUp = 0
    totalDown = 0

    # Taille plus grande: 1280x720
    output_width, output_height = 1280, 720
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter('Final_output.mp4', fourcc, 30, (output_width, output_height), True)

    fps = FPS().start()
    start_time = time.time()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        count += 1
        if count % 3 != 0:
            continue

        # Redimensionner à la taille plus grande
        frame = cv2.resize(frame, (output_width, output_height))
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb_frame = np.ascontiguousarray(rgb_frame, dtype=np.uint8)

        per_corr = get_person_coordinates(frame)
        rects = []

        if totalFrames % 30 == 0:
            trackers = []
            for bbox in per_corr:
                x1, y1, x2, y2 = bbox
                rect = dlib.rectangle(int(x1), int(y1), int(x2), int(y2))
                tracker = dlib.correlation_tracker()
                tracker.start_track(rgb_frame, rect)
                trackers.append(tracker)
                rects.append((int(x1), int(y1), int(x2), int(y2)))
        else:
            for tracker in trackers:
                tracker.update(rgb_frame)
                pos = tracker.get_position()
                rects.append((
                    int(pos.left()), int(pos.top()),
                    int(pos.right()), int(pos.bottom())
                ))

        # Dessiner la ligne avec épaisseur plus grande (5 px)
        if len(line_points) > 1:
            for i in range(len(line_points) - 1):
                cv2.line(frame, line_points[i], line_points[i + 1], (0, 0, 255), 5)
        elif len(line_points) == 1:
            cv2.circle(frame, line_points[0], 7, (0, 0, 255), -1)

        if drawing:
            cv2.putText(frame, "Dessinez la ligne avec clics gauche. Appuyez sur 'c' pour valider.",
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.imshow("People Count", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('c') and len(line_points) > 1:
                drawing = False
            elif key == 27:
                break
            continue

        objects = ct.update(rects)

        for (objectID, centroid) in objects.items():
            to = trackableObjects.get(objectID)

            if to is None:
                to = TrackableObject(objectID, centroid)
                to.counted = False
                to.centroids = [centroid]
            else:
                prev_centroid = to.centroids[-1]
                to.centroids.append(centroid)

                if not to.counted:
                    crossed = check_line_crossing(prev_centroid, centroid, line_points)
                    if crossed:
                        if centroid[1] < prev_centroid[1]:
                            totalUp += 1
                        else:
                            totalDown += 1
                        to.counted = True

            trackableObjects[objectID] = to

            text = f"ID {objectID}"
            cv2.putText(frame, text, (centroid[0] - 10, centroid[1] - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.75, (255, 255, 255), 2)
            cv2.circle(frame, (centroid[0], centroid[1]), 6, (255, 255, 255), -1)

        info_status = [
            ("Enter", totalUp),
            ("Exit", totalDown),
        ]

        for i, (k, v) in enumerate(info_status):
            text = f"{k}: {v}"
            cv2.putText(frame, text, (10, output_height - 30 - i * 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 3)

        writer.write(frame)
        cv2.imshow("People Count", frame)

        key = cv2.waitKey(1) & 0xFF
        if key == 27:
            break

        totalFrames += 1
        fps.update()

        if time.time() - start_time > 28800:
            break

    cap.release()
    writer.release()
    cv2.destroyAllWindows()

    fps.stop()
    logger.info(f"Elapsed time: {fps.elapsed():.2f}")
    logger.info(f"Approx. FPS: {fps.fps():.2f}")

if __name__ == "__main__":
    people_counter()
