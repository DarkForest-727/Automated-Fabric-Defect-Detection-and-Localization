# 🧵 Automated Fabric Defect Detection & Localization
### *Precision Fabric Inspection, Powered by AI*

> **Final Year Internship Project** — BE Computer Science, KLE College of Engineering & Technology, Chikodi  
> **Author:** Naeem Ur Rehman Naikwadi ([@DarkForest-727](https://github.com/DarkForest-727))

---

## 📌 Problem Statement

Manual fabric inspection in textile manufacturing is slow, inconsistent, and error-prone. A single inspector can miss defects under fatigue, causing quality failures downstream. This project replaces manual inspection with a deep learning pipeline that **detects and localizes fabric defects in real time** using instance segmentation — giving manufacturers pixel-level defect maps, not just bounding boxes.

---

## 🎯 Results

| Metric | Value |
|---|---|
| **Model** | YOLOv8m-seg (pretrained on COCO) |
| **Test mAP50** | **0.9164** ✅ (Target: ≥ 0.90) |
| **Dataset Size** | 2,473 images, 4 defect classes |
| **Training** | 150 epochs, AdamW, RTX 3050 |

### Per-Class AP50

| Class | AP50 |
|---|---|
| Hole | 0.9502 |
| Stain | 0.9256 |
| Line | 0.9187 |
| Knot | 0.8712 |

---

## 🧩 Defect Classes

| Class | Description |
|---|---|
| **Hole** | Physical rupture or puncture in the fabric |
| **Stain** | Contamination or discoloration on fabric surface |
| **Line** | Horizontal or vertical thread irregularities |
| **Knot** | Excess thread accumulation / weaving error |

---

## 🏗️ System Architecture

```
Input Image
     │
     ▼
┌─────────────────────┐
│  FastAPI Backend     │  ← POST /predict
│  (YOLOv8m-seg)      │
│  best.pt inference  │
└─────────┬───────────┘
          │ JSON response (masks + labels + confidence)
          ▼
┌─────────────────────┐
│   React Frontend    │
│   Vite + Tailwind   │
│   Framer Motion     │
│  Dashboard / Upload │
└─────────────────────┘
```

---

## 📁 Project Structure

```
fabric-defect-system/
│
├── train.py                 # YOLOv8 training script
├── evaluate.py              # Evaluation on test set
├── data_fixed.yaml          # Dataset config (update paths before use)
├── requirements.txt         # Python dependencies
│
├── evaluation/              # mAP plots, confusion matrix, per-class results
│   ├── confusion_matrix.png
│   ├── results.png
│   └── metrics.json
│
├── backend/                 # FastAPI inference server (Phase 4)
│   └── main.py
│
└── frontend/                # React + Vite dashboard (Phase 5)
    └── src/
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.11 (3.14 is **not** compatible with PyTorch)
- CUDA 12.1 + compatible GPU (RTX 3050 4GB minimum tested)
- Node.js 18+ (for frontend)

### 1. Clone the repo
```bash
git clone https://github.com/DarkForest-727/Automated-Fabric-Defect-Detection-and-Localization.git
cd fabric-defect-system
```

### 2. Create virtual environment
```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up the dataset
Download the dataset from Roboflow (link below) and place it at the project root as `roboflow_dataset/`.

Then update `data_fixed.yaml` with absolute paths to your local dataset:
```yaml
train: C:/your/path/roboflow_dataset/train/images
val:   C:/your/path/roboflow_dataset/valid/images
test:  C:/your/path/roboflow_dataset/test/images
```

### 5. Train (optional — weights available in Releases)
```bash
python train.py
```

### 6. Evaluate
```bash
python evaluate.py
```

---

## 📦 Dataset

- **Source:** [Roboflow — Fabric Defect Dataset](#) *(https://universe.roboflow.com/fabric-cugp4/fabric-jptqu/dataset/3)*
- **Total Images:** 2,473
- **Split:** 70% train / 20% val / 10% test
- **Format:** YOLO segmentation polygon format
- **Classes:** Hole, Knot, Line, Stain

---

## 🤖 Model

- **Architecture:** YOLOv8m-seg (Ultralytics)
- **Pretrained on:** COCO
- **Task:** Instance Segmentation
- **Download weights (best.pt):** [Download from Google Drive](https://drive.google.com/file/d/1wPtMBZK3zqtP8kZwzRnnKCmxB30gp9Xa/view?usp=sharing)

### Training Config
```yaml
imgsz: 640
batch: 8
epochs: 150
patience: 25
optimizer: AdamW
lr0: 0.001
amp: true
mosaic: 1.0
copy_paste: 0.3
flipud: 0.3
```

---

## 🗺️ Roadmap

- [x] Phase 1 — Dataset preparation & verification
- [x] Phase 2 — Model training (YOLOv8m-seg)
- [x] Phase 3 — Evaluation (mAP50 = 0.9164 ✅)
- [ ] Phase 4 — FastAPI inference backend
- [ ] Phase 5 — React + Vite + Tailwind + Framer Motion frontend

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Model | YOLOv8m-seg (Ultralytics) |
| Deep Learning | PyTorch 2.5.1 + CUDA 12.1 |
| Backend | FastAPI |
| Frontend | React + Vite + Tailwind CSS + Framer Motion |
| Dataset | Roboflow |

---

## 📄 License

This project is for academic purposes as part of a Internship Project at Suprmentr Technologies Pvt Ltd. 
College: KLE College of Engineering & Technology, Chikodi.

---

