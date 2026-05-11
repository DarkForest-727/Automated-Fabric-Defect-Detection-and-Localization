# ─────────────────────────────────────────────────────────────────
# evaluate.py — Test Set Evaluation for Fabric Defect Detection
# ─────────────────────────────────────────────────────────────────
# WHAT THIS FILE DOES:
#   1. Loads best.pt (the model saved at peak validation mAP)
#   2. Runs inference on the test set (223 unseen images)
#   3. Computes per-class AP, mAP50, mAP50-95
#   4. Generates visual predictions on sample test images
#   5. Saves a metrics summary you can use in your FYP report
# ─────────────────────────────────────────────────────────────────

import torch
import cv2
import json
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from pathlib import Path
from ultralytics import YOLO
from datetime import datetime


# ═══════════════════════════════════════════════════════════════════
# SECTION 1 — PATHS
# ═══════════════════════════════════════════════════════════════════

BEST_WEIGHTS  = Path("E:/Fabric defect system/runs/fabric_yolov8m_v1/weights/best.pt")
DATASET_ROOT  = Path("E:/Fabric defect system/roboflow_dataset")
FIXED_YAML    = DATASET_ROOT / "data_fixed.yaml"
TEST_IMG_DIR  = DATASET_ROOT / "test" / "images"

# All evaluation outputs go here
EVAL_DIR      = Path("E:/Fabric defect system/evaluation")
EVAL_DIR.mkdir(exist_ok=True)

# Class names must match data.yaml order exactly
CLASS_NAMES   = ["Hole", "Knot", "Line", "Stain"]

# Color per class for visualization (BGR for OpenCV, RGB for matplotlib)
CLASS_COLORS  = {
    "Hole":  (0,   255, 0),    # green
    "Knot":  (255, 0,   0),    # blue
    "Line":  (0,   0,   255),  # red
    "Stain": (0,   255, 255),  # yellow
}


# ═══════════════════════════════════════════════════════════════════
# SECTION 2 — FORMAL TEST SET EVALUATION
# ═══════════════════════════════════════════════════════════════════
# WHY: model.val() with split='test' runs the full COCO-style
# evaluation loop on the test set.
# This computes mAP using the same methodology as the training
# validation, so numbers are directly comparable.
# split='test' tells Ultralytics to use the test path from yaml
# instead of the val path.

def run_formal_evaluation(model: YOLO) -> dict:
    print("\n[STEP 1] Running formal evaluation on test set...")
    print(f"  Using weights : {BEST_WEIGHTS}")
    print(f"  Test images   : {TEST_IMG_DIR}")
    print(f"  Test count    : {len(list(TEST_IMG_DIR.glob('*.jpg')))} images")

    # model.val() runs the full evaluation pipeline:
    # - loads test images in batches
    # - runs inference with best.pt weights
    # - compares predictions against ground truth labels
    # - computes precision, recall, mAP50, mAP50-95 per class
    metrics = model.val(
        data    = str(FIXED_YAML),
        split   = "test",          # use test split, not val
        imgsz   = 640,
        batch   = 8,
        conf    = 0.25,            # standard confidence threshold for evaluation
        iou     = 0.7,
        device  = 0,               # GPU
        plots   = True,            # saves confusion matrix + PR curve
        save_json = True,          # saves COCO-format results.json
        project = str(EVAL_DIR),
        name    = "test_results",
        verbose = True,
    )

    return metrics


# ═══════════════════════════════════════════════════════════════════
# SECTION 3 — EXTRACT AND DISPLAY METRICS
# ═══════════════════════════════════════════════════════════════════
# The metrics object from model.val() contains both aggregate
# and per-class scores. We extract them cleanly for reporting.

def extract_and_print_metrics(metrics) -> dict:
    print("\n[STEP 2] Extracting metrics...")

    # Top-level aggregate metrics
    box_map50    = metrics.box.map50        # detection mAP@0.50
    box_map5095  = metrics.box.map          # detection mAP@0.50:0.95
    seg_map50    = metrics.seg.map50        # segmentation mAP@0.50 ← primary
    seg_map5095  = metrics.seg.map          # segmentation mAP@0.50:0.95

    # Per-class segmentation AP50
    # metrics.seg.ap_class_index gives class indices
    # metrics.seg.ap50 gives AP50 per class in same order
    per_class_ap50 = {}
    if hasattr(metrics.seg, 'ap50') and metrics.seg.ap50 is not None:
        for idx, ap in zip(metrics.seg.ap_class_index, metrics.seg.ap50):
            class_name = CLASS_NAMES[idx]
            per_class_ap50[class_name] = float(ap)

    # Per-class precision and recall
    per_class_p = {}
    per_class_r = {}
    if hasattr(metrics.seg, 'p') and metrics.seg.p is not None:
        for idx, (p, r) in enumerate(zip(metrics.seg.p, metrics.seg.r)):
            if idx < len(CLASS_NAMES):
                per_class_p[CLASS_NAMES[idx]] = float(p)
                per_class_r[CLASS_NAMES[idx]] = float(r)

    results = {
        "timestamp"     : datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "weights"       : str(BEST_WEIGHTS),
        "test_images"   : len(list(TEST_IMG_DIR.glob("*.jpg"))),
        "box_mAP50"     : round(float(box_map50),   4),
        "box_mAP50_95"  : round(float(box_map5095), 4),
        "seg_mAP50"     : round(float(seg_map50),   4),
        "seg_mAP50_95"  : round(float(seg_map5095), 4),
        "per_class_AP50": {k: round(v, 4) for k, v in per_class_ap50.items()},
        "per_class_P"   : {k: round(v, 4) for k, v in per_class_p.items()},
        "per_class_R"   : {k: round(v, 4) for k, v in per_class_r.items()},
    }

    # ── Print the report ──────────────────────────────────────────
    print("\n" + "═"*60)
    print("  TEST SET EVALUATION REPORT")
    print(f"  Model  : YOLOv8m-seg")
    print(f"  Date   : {results['timestamp']}")
    print(f"  Images : {results['test_images']} (never seen during training)")
    print("═"*60)

    print(f"\n  AGGREGATE METRICS:")
    print(f"    Box  mAP50      : {results['box_mAP50']:.4f}")
    print(f"    Seg  mAP50      : {results['seg_mAP50']:.4f}  ← report this")
    print(f"    Seg  mAP50-95   : {results['seg_mAP50_95']:.4f}")

    print(f"\n  PER-CLASS SEGMENTATION AP50:")
    for cls in CLASS_NAMES:
        ap   = per_class_ap50.get(cls, 0)
        p    = per_class_p.get(cls, 0)
        r    = per_class_r.get(cls, 0)
        bar  = "█" * int(ap * 30)
        print(f"    {cls:<8}: AP50={ap:.4f}  P={p:.3f}  R={r:.3f}  {bar}")

    # Check if we hit the target
    if results["seg_mAP50"] >= 0.90:
        print(f"\n  ✅ TARGET ACHIEVED: Seg mAP50 = {results['seg_mAP50']:.4f} ≥ 0.90")
    else:
        print(f"\n  ⚠️  Below target: {results['seg_mAP50']:.4f} < 0.90")
        print(f"     (Validation was 0.9099 — small gap is normal generalization drop)")

    return results


# ═══════════════════════════════════════════════════════════════════
# SECTION 4 — SAVE METRICS TO JSON
# ═══════════════════════════════════════════════════════════════════
# Save results as JSON so you can reference exact numbers
# in your FYP report without re-running evaluation.

def save_metrics(results: dict):
    out_path = EVAL_DIR / "test_metrics.json"
    with open(out_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n[STEP 3] Metrics saved → {out_path}")


# ═══════════════════════════════════════════════════════════════════
# SECTION 5 — VISUAL PREDICTIONS ON TEST SAMPLES
# ═══════════════════════════════════════════════════════════════════
# We run inference on a few test images and draw the predicted
# masks with confidence scores. This goes directly into your
# FYP report as qualitative results.

def visualize_predictions(model: YOLO, n_samples: int = 8):
    print(f"\n[STEP 4] Generating visual predictions on {n_samples} test samples...")

    # Collect test images
    test_images = (list(TEST_IMG_DIR.glob("*.jpg")) +
                   list(TEST_IMG_DIR.glob("*.png")))

    # Fixed seed for reproducibility — same images every run
    np.random.seed(42)
    samples = np.random.choice(test_images,
                                min(n_samples, len(test_images)),
                                replace=False)

    fig, axes = plt.subplots(2, 4, figsize=(20, 10))
    axes = axes.flatten()
    fig.suptitle("YOLOv8m-seg — Test Set Predictions", fontsize=16, fontweight="bold")

    for i, (ax, img_path) in enumerate(zip(axes, samples)):

        # Run inference on single image
        # verbose=False suppresses per-image print output
        results = model.predict(
            source  = str(img_path),
            conf    = 0.25,    # only show predictions above 25% confidence
            iou     = 0.7,
            device  = 0,
            verbose = False,
        )

        result = results[0]

        # Read original image for drawing
        img = cv2.imread(str(img_path))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        h, w = img.shape[:2]
        overlay = img.copy()

        detection_count = 0

        # Draw each predicted mask
        if result.masks is not None:
            for mask, box, cls_id, conf in zip(
                result.masks.xy,       # polygon points in pixel coords
                result.boxes.xyxy,     # bounding boxes
                result.boxes.cls,      # class indices
                result.boxes.conf      # confidence scores
            ):
                cls_id  = int(cls_id)
                conf    = float(conf)
                name    = CLASS_NAMES[cls_id]
                color   = CLASS_COLORS[name]

                # Draw filled polygon mask
                pts = np.array(mask, dtype=np.int32)
                if len(pts) > 0:
                    cv2.fillPoly(overlay, [pts], color)
                    cv2.polylines(img, [pts],
                                  isClosed=True, color=color, thickness=2)

                # Draw confidence label near bounding box
                x1, y1 = int(box[0]), int(box[1])
                label   = f"{name} {conf:.2f}"
                cv2.putText(img, label, (x1, max(y1-5, 15)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.55, color, 2)

                detection_count += 1

        # Blend mask overlay with original image
        img = cv2.addWeighted(img, 0.65, overlay, 0.35, 0)

        ax.imshow(img)
        ax.set_title(f"{img_path.name[:30]}\n{detection_count} defect(s) found",
                     fontsize=7)
        ax.axis("off")

    # Hide unused subplots if samples < 8
    for j in range(len(samples), len(axes)):
        axes[j].axis("off")

    # Add legend
    legend_patches = [
        mpatches.Patch(color=np.array(c)/255, label=name)
        for name, c in CLASS_COLORS.items()
    ]
    fig.legend(handles=legend_patches, loc="lower center",
               ncol=4, fontsize=12, title="Defect Classes")

    plt.tight_layout(rect=[0, 0.05, 1, 1])
    out_path = EVAL_DIR / "test_predictions.png"
    plt.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [SAVED] {out_path}")


# ═══════════════════════════════════════════════════════════════════
# SECTION 6 — PER CLASS AP BAR CHART
# ═══════════════════════════════════════════════════════════════════
# A clean bar chart of per-class AP50 for your FYP report.

def plot_per_class_ap(results: dict):
    print("\n[STEP 5] Generating per-class AP chart...")

    per_class = results["per_class_AP50"]
    classes   = list(per_class.keys())
    values    = list(per_class.values())
    colors    = ["#2ecc71", "#3498db", "#e74c3c", "#f39c12"]

    fig, ax = plt.subplots(figsize=(8, 5))

    bars = ax.bar(classes, values, color=colors, width=0.5, edgecolor="white")

    # Value labels on top of each bar
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width()/2,
                bar.get_height() + 0.005,
                f"{val:.4f}", ha="center", va="bottom",
                fontsize=11, fontweight="bold")

    # Target line at 0.90
    ax.axhline(y=0.90, color="red", linestyle="--",
               linewidth=1.5, label="Target (0.90)")

    # Overall mAP line
    overall = results["seg_mAP50"]
    ax.axhline(y=overall, color="blue", linestyle="-.",
               linewidth=1.5, label=f"Overall mAP50 ({overall:.4f})")

    ax.set_ylim(0.7, 1.02)
    ax.set_ylabel("AP50 (Segmentation)", fontsize=12)
    ax.set_title("Per-Class Segmentation AP50 — Test Set\nYOLOv8m-seg Fabric Defect Detection",
                 fontsize=13, fontweight="bold")
    ax.legend(fontsize=10)
    ax.grid(axis="y", alpha=0.3)
    ax.set_facecolor("#f8f9fa")

    plt.tight_layout()
    out_path = EVAL_DIR / "per_class_ap50.png"
    plt.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  [SAVED] {out_path}")


# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":

    print("=" * 60)
    print("  FABRIC DEFECT DETECTION — Test Set Evaluation")
    print("=" * 60)

    # Verify weights exist before doing anything
    if not BEST_WEIGHTS.exists():
        print(f"[ERROR] best.pt not found at {BEST_WEIGHTS}")
        print("        Check the path and try again")
        raise SystemExit(1)

    # Load the best model
    print(f"\n  Loading model from {BEST_WEIGHTS}")
    model = YOLO(str(BEST_WEIGHTS))

    # Step 1: Formal evaluation
    metrics = run_formal_evaluation(model)

    # Step 2: Extract and print metrics
    results = extract_and_print_metrics(metrics)

    # Step 3: Save to JSON
    save_metrics(results)

    # Step 4: Visual predictions
    visualize_predictions(model, n_samples=8)

    # Step 5: Per-class chart
    plot_per_class_ap(results)

    print("\n" + "=" * 60)
    print("  EVALUATION COMPLETE")
    print("=" * 60)
    print(f"  All outputs saved to: {EVAL_DIR}")
    print(f"\n  Files generated:")
    print(f"    test_metrics.json       ← exact numbers for FYP report")
    print(f"    test_predictions.png    ← visual results for FYP report")
    print(f"    per_class_ap50.png      ← bar chart for FYP report")
    print(f"    test_results/           ← confusion matrix, PR curve")