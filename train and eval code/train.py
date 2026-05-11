# ─────────────────────────────────────────────────────────────────
# train.py — YOLOv8m-seg Training for Fabric Defect Detection
# ─────────────────────────────────────────────────────────────────
# WHAT THIS FILE DOES:
#   1. Fixes the data.yaml paths (Roboflow uses relative paths,
#      Ultralytics needs absolute paths to find images/labels)
#   2. Verifies GPU is available and prints memory info
#   3. Defines all training hyperparameters with explanations
#   4. Runs training with YOLOv8m-seg (pretrained on COCO)
#   5. Prints final metrics when training completes
# ─────────────────────────────────────────────────────────────────

import torch
import yaml
import sys
from pathlib import Path
from ultralytics import YOLO


# ═══════════════════════════════════════════════════════════════════
# SECTION 1 — PROJECT PATHS
# ═══════════════════════════════════════════════════════════════════
# All paths are defined here in one place.
# If you move your dataset, only change DATASET_ROOT.

DATASET_ROOT = Path("E:/Fabric defect system/roboflow_dataset")
YAML_PATH    = DATASET_ROOT / "data.yaml"         # original from Roboflow
FIXED_YAML   = DATASET_ROOT / "data_fixed.yaml"   # we create this with absolute paths

# Training outputs go here: weights, plots, metrics CSV
PROJECT_DIR  = Path("E:/Fabric defect system/runs")
RUN_NAME     = "fabric_yolov8m_v1"


# ═══════════════════════════════════════════════════════════════════
# SECTION 2 — FIX data.yaml PATHS
# ═══════════════════════════════════════════════════════════════════
# WHY: Roboflow exports data.yaml with relative paths like:
#      train: ../train/images
#      val:   ../valid/images
#
# Ultralytics resolves these relative to where data.yaml sits.
# This causes "path not found" errors on Windows because the
# path ends up as roboflow_dataset/../train/images which can
# fail depending on how Python resolves it.
#
# FIX: We write a new yaml with full absolute paths.
# We never touch the original data.yaml.

def fix_yaml_paths():
    print("\n[STEP 1] Fixing data.yaml paths...")

    # Read original Roboflow yaml
    with open(YAML_PATH, "r") as f:
        data = yaml.safe_load(f)

    # Replace relative paths with absolute paths
    # Roboflow uses 'valid' as folder name but 'val' as yaml key
    data["train"] = str(DATASET_ROOT / "train" / "images")
    data["val"]   = str(DATASET_ROOT / "valid" / "images")
    data["test"]  = str(DATASET_ROOT / "test"  / "images")

    # Write the fixed yaml — this is what we pass to YOLO
    with open(FIXED_YAML, "w") as f:
        yaml.dump(data, f, default_flow_style=False)

    print(f"  train → {data['train']}")
    print(f"  val   → {data['val']}")
    print(f"  test  → {data['test']}")
    print(f"  classes ({data['nc']}) → {data['names']}")
    print(f"  [OK] Saved to {FIXED_YAML}")

    return data


# ═══════════════════════════════════════════════════════════════════
# SECTION 3 — GPU CHECK
# ═══════════════════════════════════════════════════════════════════
# WHY: If CUDA is not available and we don't catch it here,
# training will silently run on CPU — taking days instead of hours.
# We fail fast with a clear message instead.

def check_gpu():
    print("\n[STEP 2] Checking GPU...")

    if not torch.cuda.is_available():
        print("  [ERROR] CUDA not available!")
        print("  Make sure you installed: pip install torch --index-url https://download.pytorch.org/whl/cu121")
        sys.exit(1)

    # Get GPU memory info
    gpu_name   = torch.cuda.get_device_name(0)
    total_vram = torch.cuda.get_device_properties(0).total_memory / 1024**3  # bytes → GB
    free_vram  = (torch.cuda.get_device_properties(0).total_memory
                  - torch.cuda.memory_allocated(0)) / 1024**3

    print(f"  GPU        : {gpu_name}")
    print(f"  VRAM Total : {total_vram:.1f} GB")
    print(f"  VRAM Free  : {free_vram:.1f} GB")

    # Warn if another app is eating VRAM (like your browser)
    if free_vram < 3.5:
        print(f"  [WARN] Only {free_vram:.1f}GB free — close browser/other apps before training")
        print(f"         Training needs ~3.8GB for batch=8, imgsz=640")
    else:
        print(f"  [OK] Sufficient VRAM for training config")

    return gpu_name


# ═══════════════════════════════════════════════════════════════════
# SECTION 4 — HYPERPARAMETERS
# ═══════════════════════════════════════════════════════════════════
# Each parameter is explained in context of fabric defect detection.
# These are not random defaults — each one is chosen for your
# specific dataset size, class types, and GPU constraint.

def get_hyperparameters():
    return {

        # ── DATASET ─────────────────────────────────────────────
        "data": str(FIXED_YAML),

        # ── MODEL SIZE ──────────────────────────────────────────
        # yolov8 comes in: n(nano) s(small) m(medium) l(large) x(extra)
        # We use MEDIUM because:
        #   - nano/small: not enough capacity to hit 90% mAP on 4 defect classes
        #   - large/extra: needs 8GB+ VRAM, will OOM on your RTX 3050 4GB
        #   - medium: fits in 4GB with batch=8, strong enough for our goal
        # .pt = pretrained on COCO (transfer learning, not from scratch)
        "model": "yolov8m-seg.pt",

        # ── IMAGE SIZE ───────────────────────────────────────────
        # Images are resized to 640x640 before feeding into the model.
        # Why 640: standard YOLOv8 input size, fits in 4GB VRAM.
        # Why not 1024: would need ~7GB VRAM → OOM crash on your card.
        # Impact on fabric: knots are small but 640 is enough to detect them.
        # If after training knot AP is low, we revisit with tiling strategy.
        "imgsz": 640,

        # ── BATCH SIZE ───────────────────────────────────────────
        # Number of images processed together in one forward pass.
        # batch=8 uses ~3.8GB VRAM on your RTX 3050 4GB.
        # batch=16 would use ~6GB → OOM crash.
        # Larger batch = more stable gradients but more VRAM.
        # AMP (below) helps squeeze batch=8 safely into 4GB.
        "batch": 8,

        # ── TRAINING DURATION ────────────────────────────────────
        # epochs: maximum number of full passes through the training set.
        # 150 epochs × 1750 images = 218,750 training steps total.
        # We use early stopping so it may finish before 150 if converged.
        "epochs": 150,

        # patience: stop training if validation mAP doesn't improve
        # for this many consecutive epochs.
        # 25 gives the model enough room to escape local plateaus
        # but won't waste hours if it's already peaked.
        "patience": 25,

        # ── OPTIMIZER ────────────────────────────────────────────
        # AdamW vs SGD:
        # AdamW adapts learning rate per parameter — better for
        # fine-tuning pretrained models (our case).
        # SGD requires more tuning but can generalize better from scratch.
        # Since we start from COCO weights, AdamW converges faster.
        "optimizer": "AdamW",

        # lr0: starting learning rate.
        # 0.001 is standard for AdamW fine-tuning.
        # Too high (0.01) → overshoots, damages pretrained weights.
        # Too low (0.0001) → very slow convergence, may not reach 90% mAP.
        "lr0": 0.001,

        # lrf: learning rate final multiplier.
        # Final lr = lr0 × lrf = 0.001 × 0.01 = 0.00001
        # LR decays via cosine schedule from lr0 to this final value.
        # Why cosine decay: smoothly reduces LR as training progresses,
        # allowing fine-grained weight updates in later epochs.
        "lrf": 0.01,

        "momentum": 0.937,       # AdamW momentum (standard value)
        "weight_decay": 0.0005,  # L2 regularization — prevents overfitting
                                 # on our relatively small 2.4k image dataset

        # ── WARMUP ───────────────────────────────────────────────
        # For the first 3 epochs, LR starts very low and ramps up to lr0.
        # WHY: At epoch 1, model weights are COCO-pretrained.
        # High LR immediately = large gradient updates = destroys
        # the useful features already learned from COCO.
        # Warmup protects pretrained weights in early training.
        "warmup_epochs": 3,
        "warmup_momentum": 0.8,
        "warmup_bias_lr": 0.1,

        # ── AUGMENTATION — FABRIC SPECIFIC ───────────────────────
        # Augmentation creates artificial variations of training images
        # so the model generalizes to real-world factory conditions.

        # FLIPS — fabric has no meaningful up/down/left/right orientation
        # A hole is a hole regardless of camera angle.
        "fliplr": 0.5,    # 50% chance of horizontal flip each image
        "flipud": 0.3,    # 30% chance of vertical flip

        # COLOR/LIGHTING — factory lighting varies shift by shift,
        # different fabric colors (denim vs white fabric in your dataset)
        "hsv_h": 0.015,   # hue: small shift (fabric color matters for classification)
        "hsv_s": 0.5,     # saturation: handles washed/unwashed, wet/dry fabric
        "hsv_v": 0.4,     # brightness: handles shadows, overexposure from industrial lights

        # GEOMETRIC — slight variations simulate camera mount differences
        "degrees": 10.0,    # rotation up to ±10° (fixed overhead cameras have slight tilt)
        "translate": 0.1,   # shift image up to 10% in x/y
        "scale": 0.3,       # zoom in/out up to 30% — careful not to make knots invisible
        "shear": 2.0,       # mild shear transform
        "perspective": 0.0, # OFF — industrial cameras are fixed, no perspective distortion

        # MOSAIC — takes 4 training images and combines them into 1.
        # WHY: model sees defects in different contexts/sizes each time.
        # Especially useful for small knots appearing in varied positions.
        # 1.0 = apply mosaic to 100% of training batches.
        "mosaic": 1.0,

        # COPY-PASTE — cuts defect instances from one image and
        # pastes them onto another image.
        # WHY: synthetically increases defect variety, especially useful
        # for Line (737 instances, fewest in dataset) and Knot (794).
        # 0.3 = apply to 30% of images.
        "copy_paste": 0.3,

        # MIXUP — blends two images together at pixel level.
        # Kept very low (0.05) because heavy mixup confuses
        # segmentation mask boundaries — harmful for our task.
        "mixup": 0.05,

        # ── LOSS WEIGHTS ─────────────────────────────────────────
        # YOLOv8-seg has 4 loss components. These weights control
        # how much each one contributes to the total training loss.

        # box: bounding box regression loss
        # Keeps the detection box tight around defects.
        "box": 7.5,

        # cls: classification loss
        # Distinguishes Hole vs Line vs Stain vs Knot.
        # Kept low because our classes are well balanced.
        "cls": 0.5,

        # dfl: distribution focal loss
        # Improves localization precision of the bounding box edges.
        "dfl": 1.5,

        # ── OUTPUT & LOGGING ─────────────────────────────────────
        "project": str(PROJECT_DIR),  # where to save runs
        "name": RUN_NAME,             # subfolder name for this run
        "exist_ok": False,            # crash if run name exists — prevents
                                      # accidentally overwriting a good run
        "save": True,                 # save checkpoints
        "save_period": 10,            # save checkpoint every 10 epochs
                                      # so you can resume if training crashes
        "plots": True,                # generate: confusion matrix, PR curve,
                                      # training loss curves — essential for
                                      # your FYP report

        # ── HARDWARE ─────────────────────────────────────────────
        "device": 0,       # use GPU 0 (your RTX 3050)
        "workers": 4,      # CPU threads for data loading
                           # 4 is safe for i5 12th gen (don't go above 8)

        # AMP: Automatic Mixed Precision
        # Automatically uses float16 instead of float32 where safe.
        # Effect: cuts VRAM usage by ~30%, speeds up training ~20%.
        # This is what makes batch=8 fit inside your 4GB VRAM.
        # Ultralytics handles the precision switching — no code change needed.
        "amp": True,

        # ── VALIDATION SETTINGS ──────────────────────────────────
        "val": True,      # run validation after every epoch

        # conf: confidence threshold during validation.
        # Set very low (0.001) so we don't miss any detections.
        # This gives us the full precision-recall curve to compute mAP.
        # (At inference time in FastAPI we'll use a higher threshold ~0.25)
        "conf": 0.001,

        # iou: IoU threshold for Non-Maximum Suppression (NMS).
        # When two predicted masks overlap by more than 0.7,
        # the lower-confidence one is suppressed.
        # 0.7 is strict — good for fabric where one defect shouldn't
        # generate multiple overlapping mask predictions.
        "iou": 0.7,
    }


# ═══════════════════════════════════════════════════════════════════
# SECTION 5 — MAIN
# ═══════════════════════════════════════════════════════════════════

if __name__ == "__main__":

    print("=" * 60)
    print("  FABRIC DEFECT DETECTION — YOLOv8m-seg Training")
    print("=" * 60)

    # Step 1: Fix yaml
    yaml_data = fix_yaml_paths()

    # Step 2: Check GPU
    gpu_name = check_gpu()

    # Step 3: Get hyperparameters
    params = get_hyperparameters()

    # Step 4: Print full config summary before starting
    print("\n[STEP 3] Training Configuration:")
    print(f"  Model       : {params['model']}")
    print(f"  Image size  : {params['imgsz']}x{params['imgsz']}")
    print(f"  Batch size  : {params['batch']}")
    print(f"  Epochs      : {params['epochs']} (early stop after {params['patience']} no-improve)")
    print(f"  Optimizer   : {params['optimizer']}  lr={params['lr0']}")
    print(f"  AMP         : {params['amp']}  (mixed precision, saves ~30% VRAM)")
    print(f"  Augmentation: mosaic={params['mosaic']} copy_paste={params['copy_paste']}")
    print(f"  Output      : {PROJECT_DIR / RUN_NAME}")
    print(f"  GPU         : {gpu_name}")
    print(f"  Classes     : {yaml_data['names']}")

    # Safety gate — gives you a chance to cancel before hours of training
    print("\n" + "─" * 60)
    input("  Press ENTER to start training  (Ctrl+C to cancel)...")
    print("─" * 60 + "\n")

    # Step 5: Load the pretrained model
    # If yolov8m-seg.pt is not cached locally, Ultralytics downloads it (~50MB)
    model = YOLO(params.pop("model"))

    # Step 6: Start training
    # .train() runs the full training loop:
    #   - Loads images in batches from train/images
    #   - Applies augmentation on the fly
    #   - Forward pass → compute loss → backward pass → update weights
    #   - After each epoch: validates on valid/images, logs mAP
    #   - Saves best.pt whenever validation mAP improves
    #   - Stops early if mAP doesn't improve for `patience` epochs
    results = model.train(**params)

    # ─────────────────────────────────────────────
    # Step 7: Print final metrics
    # ─────────────────────────────────────────────
    # results.results_dict contains metrics from the FINAL epoch.
    # best.pt is saved from the BEST epoch (may differ from final).
    # Always evaluate best.pt, not the final epoch weights.

    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE")
    print("=" * 60)

    metrics = results.results_dict

    # mAP50(B) = detection mAP at IoU=0.50
    # mAP50(M) = segmentation mAP at IoU=0.50  ← our primary metric
    # mAP50-95(M) = segmentation mAP averaged over IoU 0.50:0.95 ← strict metric
    print(f"  Box mAP50      : {metrics.get('metrics/mAP50(B)', 0):.4f}")
    print(f"  Seg mAP50      : {metrics.get('metrics/mAP50(M)', 0):.4f}  ← primary target (≥0.90)")
    print(f"  Seg mAP50-95   : {metrics.get('metrics/mAP50-95(M)', 0):.4f}")

    best_weights = PROJECT_DIR / RUN_NAME / "weights" / "best.pt"
    print(f"\n  Best weights → {best_weights}")
    print(f"  All plots    → {PROJECT_DIR / RUN_NAME}")
    print("\n  Next step: run evaluate.py on test set using best.pt")