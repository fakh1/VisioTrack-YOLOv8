import cv2
import numpy as np
import argparse
import json
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort

# === Arguments ===
parser = argparse.ArgumentParser()
parser.add_argument('--input', type=str, required=True)
parser.add_argument('--output', type=str, required=True)
parser.add_argument('--stats', type=str, required=True)  # NEW
args = parser.parse_args()

input_video = args.input
output_video = args.output
stats_file = args.stats

# === Setup ===
model = YOLO('yolov8x.pt')
deepsort = DeepSort(max_age=30, n_init=3)

cap = cv2.VideoCapture(input_video)

# === Drawing Line Variables ===
drawing = True
line_points = []

def on_mouse(event, x, y, flags, param):
    global drawing, line_points
    if drawing and event == cv2.EVENT_LBUTTONDOWN:
        line_points.append((x, y))

cv2.namedWindow("People Count")
cv2.setMouseCallback("People Count", on_mouse)

# === Geometry Utils ===
def orientation(a, b, c):
    val = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1])
    if val == 0: return 0
    return 1 if val > 0 else 2

def on_segment(a, b, c):
    return (min(a[0], c[0]) <= b[0] <= max(a[0], c[0]) and
            min(a[1], c[1]) <= b[1] <= max(a[1], c[1]))

def segments_intersect(p1, q1, p2, q2):
    o1 = orientation(p1, q1, p2)
    o2 = orientation(p1, q1, q2)
    o3 = orientation(p2, q2, p1)
    o4 = orientation(p2, q2, q1)
    return (o1 != o2 and o3 != o4) or \
           (o1 == 0 and on_segment(p1, p2, q1)) or \
           (o2 == 0 and on_segment(p1, q2, q1)) or \
           (o3 == 0 and on_segment(p2, p1, q2)) or \
           (o4 == 0 and on_segment(p2, q1, q2))

def check_line_crossing(prev, curr, line_points):
    for i in range(len(line_points) - 1):
        if segments_intersect(prev, curr, line_points[i], line_points[i+1]):
            return True
    return False

# === Main Loop ===
def people_counter():
    global drawing, line_points
    totalUp, totalDown = 0, 0
    memory = {}
    output_width, output_height = 1280, 720
    writer = None

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.resize(frame, (output_width, output_height))
        results = model.predict(frame, verbose=False)[0]
        detections = []

        for *xyxy, conf, cls in results.boxes.data.cpu().numpy():
            if int(cls) == 0 and conf > 0.4:  # class 0 = person
                x1, y1, x2, y2 = map(int, xyxy)
                detections.append(([x1, y1, x2 - x1, y2 - y1], conf, 'person'))

        tracks = deepsort.update_tracks(detections, frame=frame)

        # Draw line
        if len(line_points) > 1:
            for i in range(len(line_points) - 1):
                cv2.line(frame, line_points[i], line_points[i + 1], (0, 0, 255), 5)
        elif len(line_points) == 1:
            cv2.circle(frame, line_points[0], 7, (0, 0, 255), -1)

        # Waiting for user to draw the line
        if drawing:
            cv2.putText(frame, "Draw line and press 'c' to confirm", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            cv2.imshow("People Count", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('c') and len(line_points) > 1:
                drawing = False
            elif key == 27:
                break
            continue

        for track in tracks:
            if not track.is_confirmed():
                continue
            track_id = track.track_id
            x1, y1, x2, y2 = map(int, track.to_ltrb())
            cx, cy = x1 + (x2 - x1) // 2, y1 + (y2 - y1) // 2

            if track_id not in memory:
                memory[track_id] = []
            memory[track_id].append((cx, cy))

            if len(memory[track_id]) >= 2:
                prev = memory[track_id][-2]
                curr = memory[track_id][-1]
                if check_line_crossing(prev, curr, line_points):
                    if curr[1] < prev[1]:
                        totalUp += 1
                    else:
                        totalDown += 1
                    memory[track_id] = []  # reset after counting

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
            cv2.putText(frame, f"ID {track_id}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)
            cv2.circle(frame, (cx, cy), 4, (255,255,255), -1)

        # Show stats
        cv2.putText(frame, f"Enter: {totalUp}", (10, output_height - 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,0), 3)
        cv2.putText(frame, f"Exit: {totalDown}", (10, output_height - 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,0), 3)

        if writer is None:
            writer = cv2.VideoWriter(output_video,
                                     cv2.VideoWriter_fourcc(*'mp4v'),
                                     30, (output_width, output_height))
        writer.write(frame)

        cv2.imshow("People Count", frame)
        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    if writer:
        writer.release()
    cv2.destroyAllWindows()

    # Enregistrer les résultats
    
    with open(stats_file, "w") as f:
        json.dump({"Enter": totalUp, "Exit": totalDown}, f)


if __name__ == "__main__":
    people_counter()
