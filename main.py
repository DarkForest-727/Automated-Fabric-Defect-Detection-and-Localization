import io
import time
import base64
import cv2
import numpy as np
from PIL import Image
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

# ── App setup ──────────────────────────────────────────────────────────────
app = FastAPI(title="Fabric Defect Detection API")

# Allow requests from the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load model once at startup ─────────────────────────────────────────────
MODEL_PATH = r"E:\Fabric defect system\runs\fabric_yolov8m_v1\weights\best.pt"
model = YOLO(MODEL_PATH)

# Defect class colors (BGR for OpenCV)
CLASS_COLORS = {
    "Hole":  (99,  102, 241),   # indigo
    "Knot":  (139, 92,  246),   # violet
    "Line":  (148, 163, 184),   # slate
    "Stain": (16,  185, 129),   # green
}

# ── Health check ───────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model": "yolov8m-seg", "classes": model.names}

# ── Predict endpoint ───────────────────────────────────────────────────────
@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    # Read uploaded image bytes → numpy array
    contents = await file.read()
    np_arr   = np.frombuffer(contents, np.uint8)
    img_bgr  = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    # Run inference and measure time
    start   = time.time()
    results = model(img_bgr, conf=0.367, iou=0.5, verbose=False)
    elapsed = round((time.time() - start) * 1000)   # ms

    result     = results[0]
    detections = []

    # ── Draw masks and boxes on a copy of the image ────────────────────────
    annotated = img_bgr.copy()

    if result.masks is not None:
        masks  = result.masks.data.cpu().numpy()    # (N, H, W)
        boxes  = result.boxes
        h, w   = img_bgr.shape[:2]

        for i, mask in enumerate(masks):
            cls_id     = int(boxes.cls[i].item())
            cls_name   = model.names[cls_id]
            confidence = float(boxes.conf[i].item())
            bbox       = boxes.xyxy[i].cpu().numpy().tolist()

            color_bgr  = CLASS_COLORS.get(cls_name, (99, 102, 241))

            # Resize mask to image size and apply colored overlay
            mask_resized = cv2.resize(
                mask, (w, h), interpolation=cv2.INTER_NEAREST
            )
            mask_bool = mask_resized > 0.5

            # Semi-transparent colored mask overlay
            overlay        = annotated.copy()
            overlay[mask_bool] = color_bgr
            annotated      = cv2.addWeighted(overlay, 0.4, annotated, 0.6, 0)

            # Draw mask contour
            contours, _    = cv2.findContours(
                mask_resized.astype(np.uint8),
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE,
            )
            cv2.drawContours(annotated, contours, -1, color_bgr, 2)

            # Draw label
            x1, y1 = int(bbox[0]), int(bbox[1])
            label  = f"{cls_name} {confidence:.2f}"
            (tw, th), _ = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1
            )
            cv2.rectangle(
                annotated,
                (x1, y1 - th - 8), (x1 + tw + 6, y1),
                color_bgr, -1
            )
            cv2.putText(
                annotated, label,
                (x1 + 3, y1 - 5),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                (255, 255, 255), 1, cv2.LINE_AA
            )

            detections.append({
                "class":      cls_name,
                "confidence": round(confidence, 3),
                "bbox":       [round(v) for v in bbox],
            })

    # ── Encode annotated image to base64 ───────────────────────────────────
    _, buffer    = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 90])
    img_base64   = base64.b64encode(buffer).decode("utf-8")

    return {
        "inference_time_ms": elapsed,
        "image_base64":      img_base64,        # annotated image
        "detections":        detections,
        "verdict":           "Defected" if detections else "PASS",
    }