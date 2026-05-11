import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'

// ── Animation variants ─────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: 'easeOut', delay },
  }),
}

// ── Chapter navigation items ───────────────────────────────────────────────
const CHAPTERS = [
  { id: 'problem',      label: '01 Problem'      },
  { id: 'dataset',      label: '02 Dataset'       },
  { id: 'architecture', label: '03 Architecture'  },
  { id: 'training',     label: '04 Training'      },
  { id: 'results',      label: '05 Results'       },
  { id: 'challenges',   label: '06 Challenges'    },
]

// ── Metric card ────────────────────────────────────────────────────────────
function MetricCard({ value, label, sub, color = 'primary' }) {
  const colors = {
    primary: 'text-primary border-primary/30',
    success: 'text-success border-success/30',
    violet:  'text-secondary border-secondary/30',
  }
  return (
    <div className={`glass-card rounded-2xl p-6 border flex flex-col gap-2 ${colors[color]}`}>
      <span className="font-mono text-3xl font-bold">{value}</span>
      <span className="font-display text-sm font-semibold text-text-primary">{label}</span>
      {sub && <span className="font-body text-xs text-text-muted">{sub}</span>}
    </div>
  )
}

// ── Stat row item ──────────────────────────────────────────────────────────
function StatRow({ label, value, max = 1, color = '#6366F1' }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between font-mono text-xs">
        <span className="text-text-muted">{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          viewport={{ once: true }}
        />
      </div>
    </div>
  )
}

// ── Section wrapper ────────────────────────────────────────────────────────
function Chapter({ id, tag, title, accent, children }) {
  return (
    <section id={id} className="min-h-screen py-28 px-6 max-w-5xl mx-auto">
      <motion.p
        variants={fadeUp} custom={0} initial="hidden"
        whileInView="visible" viewport={{ once: true }}
        className="font-mono text-xs text-primary uppercase tracking-widest mb-3"
      >
        {tag}
      </motion.p>
      <motion.h2
        variants={fadeUp} custom={0.1} initial="hidden"
        whileInView="visible" viewport={{ once: true }}
        className="font-display text-4xl md:text-5xl font-bold mb-16 max-w-3xl leading-tight"
      >
        {title}
      </motion.h2>
      {children}
    </section>
  )
}

// ── YOLOv8-seg architecture SVG diagram ───────────────────────────────────
function ArchDiagram() {
  const blocks = [
    { label: 'Input\n640×640', color: '#1E1E2E', border: '#6366F1', x: 20  },
    { label: 'Backbone\nC2f + SPPF', color: '#1a1a2e', border: '#8B5CF6', x: 140 },
    { label: 'Neck\nFPN+PAN', color: '#1a1a2e', border: '#6366F1', x: 270 },
    { label: 'Detect\nHead', color: '#1a1a2e', border: '#10B981', x: 400 },
    { label: 'Segment\nHead', color: '#1a1a2e', border: '#10B981', x: 530 },
  ]
  return (
    <div className="overflow-x-auto py-4">
      <svg viewBox="0 0 700 120" className="w-full max-w-2xl mx-auto" xmlns="http://www.w3.org/2000/svg">
        {/* Connecting arrows */}
        {[140, 270, 400, 530].map((x, i) => (
          <g key={i}>
            <line x1={x - 15} y1={60} x2={x + 5} y2={60}
              stroke="#6366F1" strokeWidth="1.5" markerEnd="url(#arrow)" />
          </g>
        ))}
        {/* Segment branch arrow from detect */}
        <line x1={455} y1={60} x2={530} y2={60}
          stroke="#10B981" strokeWidth="1.5" />
        {/* Arrow marker */}
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6"
            refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#6366F1" />
          </marker>
        </defs>
        {/* Blocks */}
        {blocks.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={20} width={105} height={80} rx={8}
              fill={b.color} stroke={b.border} strokeWidth="1.5" />
            {b.label.split('\n').map((line, j) => (
              <text key={j} x={b.x + 52} y={j === 0 ? 56 : 74}
                textAnchor="middle" fill={j === 0 ? '#F8FAFC' : '#94A3B8'}
                fontSize={j === 0 ? '11' : '9'}
                fontFamily="JetBrains Mono, monospace"
                fontWeight={j === 0 ? '600' : '400'}
              >
                {line}
              </text>
            ))}
          </g>
        ))}
        {/* Labels below */}
        {['Input', 'Feature Extract', 'Multi-scale', 'BBox', 'Mask'].map((l, i) => (
          <text key={i} x={72 + i * 130} y={115}
            textAnchor="middle" fill="#94A3B8" fontSize="8"
            fontFamily="JetBrains Mono, monospace"
          >
            {l}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ── Main Journey page ──────────────────────────────────────────────────────
export default function Journey() {
  const [activeChapter, setActiveChapter] = useState('problem')

  // Scroll chapter into view on nav click
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setActiveChapter(id)
  }

  return (
    <div className="min-h-screen bg-base">

      {/* ── Sticky left chapter nav ── */}
      <aside className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-4">
        {CHAPTERS.map((c) => (
          <button
            key={c.id}
            onClick={() => scrollTo(c.id)}
            className={`text-left font-mono text-xs transition-all duration-300 ${
              activeChapter === c.id
                ? 'text-primary translate-x-2'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {c.label}
          </button>
        ))}
      </aside>

      {/* ── Page hero ── */}
      <section className="pt-32 pb-16 px-6 max-w-5xl mx-auto">
        <motion.p
          variants={fadeUp} custom={0} initial="hidden" animate="visible"
          className="font-mono text-xs text-primary uppercase tracking-widest mb-4"
        >
          Development Journey
        </motion.p>
        <motion.h1
          variants={fadeUp} custom={0.1} initial="hidden" animate="visible"
          className="font-display text-5xl md:text-7xl font-extrabold leading-tight mb-6"
        >
          From idea to{' '}
          <span className="gradient-text">92.7% mAP</span>
        </motion.h1>
        <motion.p
          variants={fadeUp} custom={0.2} initial="hidden" animate="visible"
          className="font-body text-lg text-text-muted max-w-2xl"
        >
          A complete walkthrough of how I built an industrial-grade fabric defect
          detection system — every decision, every setback, and every breakthrough.
        </motion.p>
      </section>

      {/* ════════════════════════════════════════════
          CHAPTER 01 — PROBLEM STATEMENT
      ════════════════════════════════════════════ */}
      <Chapter
        id="problem"
        tag="Chapter 01 · Problem Statement"
        title="Why fabric defect detection needed a better solution"
      >
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            variants={fadeUp} custom={0} initial="hidden"
            whileInView="visible" viewport={{ once: true }}
            className="glass-card rounded-2xl p-8"
          >
            <h3 className="font-display text-xl font-bold mb-4 text-text-primary">
              The Industrial Problem
            </h3>
            <p className="font-body text-sm text-text-muted leading-relaxed">
              Textile manufacturing is a billion-dollar industry where fabric quality
              directly impacts revenue and brand reputation. Traditional quality control
              relies on human visual inspection — a process that is slow, inconsistent,
              and expensive at scale. A single defective fabric roll that escapes
              inspection can result in product recalls, customer complaints, and
              significant financial losses.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp} custom={0.1} initial="hidden"
            whileInView="visible" viewport={{ once: true }}
            className="glass-card rounded-2xl p-8"
          >
            <h3 className="font-display text-xl font-bold mb-4 text-text-primary">
              Why Deep Learning?
            </h3>
            <p className="font-body text-sm text-text-muted leading-relaxed">
              Classical computer vision (Sobel edges, Gabor filters, thresholding)
              fails on real-world fabric because defects vary dramatically in size,
              texture, and appearance. A deep learning model trained on diverse examples
              learns the semantic concept of "defect" rather than brittle pixel rules —
              making it far more robust and generalizable to unseen samples.
            </p>
          </motion.div>
        </div>

        {/* Why segmentation over detection */}
        <motion.div
          variants={fadeUp} custom={0.2} initial="hidden"
          whileInView="visible" viewport={{ once: true }}
          className="glass-card rounded-3xl p-10 border border-primary/20"
        >
          <span className="font-mono text-xs text-primary uppercase tracking-widest mb-4 block">
            Key Design Decision
          </span>
          <h3 className="font-display text-2xl font-bold mb-6">
            Why segmentation, not just detection?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Bounding Box Limitation',
                body: 'A bounding box around a stain tells you "there is a defect here" but includes large amounts of clean fabric in the box — imprecise for downstream decisions.',
              },
              {
                title: 'Pixel-level Masks',
                body: 'Instance segmentation produces exact pixel masks of each defect. This enables precise defect area calculation, severity scoring, and more actionable QC decisions.',
              },
              {
                title: 'Industrial Value',
                body: 'Knowing the exact location and shape of a defect enables smart cutting optimization — defective zones can be avoided, minimizing material waste.',
              },
            ].map(({ title, body }, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <div>
                  <h4 className="font-display font-semibold text-sm text-text-primary mb-1">{title}</h4>
                  <p className="font-body text-xs text-text-muted leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </Chapter>

      {/* ════════════════════════════════════════════
          CHAPTER 02 — DATASET
      ════════════════════════════════════════════ */}
      <Chapter
        id="dataset"
        tag="Chapter 02 · Dataset"
        title="Building a dataset that could teach a model to see defects"
      >
        {/* Dataset split cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { value: '2,500+', label: 'Total Images',   sub: 'Across all splits',       color: 'primary' },
            { value: '1,750',  label: 'Training Set',   sub: '70% of total',            color: 'primary' },
            { value: '500',    label: 'Validation Set', sub: '20% of total',            color: 'violet'  },
            { value: '250',    label: 'Test Set',       sub: '10% — held out',          color: 'success' },
          ].map((m, i) => (
            <motion.div
              key={i}
              variants={fadeUp} custom={i * 0.1} initial="hidden"
              whileInView="visible" viewport={{ once: true }}
            >
              <MetricCard {...m} />
            </motion.div>
          ))}
        </div>

        {/* Class distribution */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            variants={fadeUp} custom={0} initial="hidden"
            whileInView="visible" viewport={{ once: true }}
            className="glass-card rounded-2xl p-8"
          >
            <h3 className="font-display text-lg font-bold mb-6 text-text-primary">
              Class Distribution
            </h3>
            <div className="flex flex-col gap-4">
              <StatRow label="Stain"  value={0.294} color="#6366F1" />
              <StatRow label="Hole"   value={0.282} color="#8B5CF6" />
              <StatRow label="Knot"   value={0.220} color="#10B981" />
              <StatRow label="Line"   value={0.204} color="#94A3B8" />
            </div>
            <p className="font-body text-xs text-text-muted mt-6 leading-relaxed">
              Total: 2,552 annotated instances across 4 defect classes. The dataset
              is reasonably balanced, with Stain and Hole being slightly more prevalent —
              reflective of real-world textile manufacturing defect rates.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp} custom={0.1} initial="hidden"
            whileInView="visible" viewport={{ once: true }}
            className="glass-card rounded-2xl p-8"
          >
            <h3 className="font-display text-lg font-bold mb-6 text-text-primary">
              Data Pipeline
            </h3>
            <div className="flex flex-col gap-4">
              {[
                { step: '01', title: 'Source',      desc: 'Roboflow Universe — fabric-jptqu dataset v3, publicly available and community-verified.' },
                { step: '02', title: 'Format',      desc: 'YOLOv8 segmentation format with polygon masks per instance, converted to YAML config.' },
                { step: '03', title: 'Augmentation',desc: 'Mosaic (1.0), copy-paste (0.3), horizontal flip (0.5), vertical flip (0.3), mixup (0.05).' },
                { step: '04', title: 'Validation',  desc: 'Zero corrupt images, zero background-only images — clean cache confirmed before training.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 items-start">
                  <span className="font-mono text-xs text-primary border border-primary/30 rounded px-2 py-1 flex-shrink-0">
                    {step}
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold text-text-primary">{title}</p>
                    <p className="font-body text-xs text-text-muted leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Defect class descriptions */}
        <motion.div
          variants={fadeUp} custom={0.2} initial="hidden"
          whileInView="visible" viewport={{ once: true }}
          className="glass-card rounded-2xl p-8"
        >
          <h3 className="font-display text-lg font-bold mb-6 text-text-primary">
            The 4 Defect Classes
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { name: 'Hole',  count: '719 instances', desc: 'Physical punctures or tears in fabric. Highest confidence class — visually distinct, high contrast against background.' },
              { name: 'Knot',  count: '561 instances', desc: 'Thread knots or bunching on fabric surface. Moderate challenge — small size and similar texture to fabric weave.' },
              { name: 'Line',  count: '522 instances', desc: 'Linear thread pulls or weaving errors. Most challenging class — thin, elongated, variable in orientation.' },
              { name: 'Stain', count: '750 instances', desc: 'Chemical or oil contamination marks. Variable size and shape — stains range from small droplets to large patches.' },
            ].map(({ name, count, desc }, i) => (
              <div key={name} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                >
                  <span className="font-mono text-xs font-bold text-white">{name[0]}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-semibold text-sm text-text-primary">{name}</span>
                    <span className="font-mono text-xs text-text-muted">{count}</span>
                  </div>
                  <p className="font-body text-xs text-text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </Chapter>

      {/* ════════════════════════════════════════════
          CHAPTER 03 — ARCHITECTURE
      ════════════════════════════════════════════ */}
      <Chapter
        id="architecture"
        tag="Chapter 03 · Model Architecture"
        title="Why YOLOv8m-seg was the right choice"
      >
        {/* Architecture diagram */}
        <motion.div
          variants={fadeUp} custom={0} initial="hidden"
          whileInView="visible" viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 mb-8"
        >
          <h3 className="font-display text-lg font-bold mb-6 text-text-primary">
            YOLOv8m-seg Pipeline
          </h3>
          <ArchDiagram />
          <p className="font-body text-xs text-text-muted mt-4 text-center">
            192 layers · 27.2M parameters · 104.7 GFLOPs · 640×640 input
          </p>
        </motion.div>

        {/* Why YOLOv8m */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: 'Why YOLO over two-stage detectors?',
              body: 'Two-stage models (Mask R-CNN) separate detection and segmentation into two passes. YOLO performs both in a single forward pass, making it 3-5× faster — critical for real-time industrial inspection where throughput matters.',
            },
            {
              title: 'Why the medium (m) variant?',
              body: 'YOLOv8 comes in nano, small, medium, large, xlarge. The medium variant (27.2M params) hits the sweet spot — it has enough capacity to learn complex fabric textures without exceeding the 4GB VRAM budget of the RTX 3050 Laptop GPU.',
            },
            {
              title: 'Why not train from scratch?',
              body: 'Transfer learning from COCO pretrained weights allows the backbone to start with rich low-level features (edges, textures, shapes). Only 6/537 layers were not transferred — dramatically reducing training time and data requirements.',
            },
          ].map(({ title, body }, i) => (
            <motion.div
              key={i}
              variants={fadeUp} custom={i * 0.1} initial="hidden"
              whileInView="visible" viewport={{ once: true }}
              className="glass-card rounded-2xl p-6"
            >
              <h4 className="font-display font-semibold text-sm text-primary mb-3">{title}</h4>
              <p className="font-body text-xs text-text-muted leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>

        {/* Model specs table */}
        <motion.div
          variants={fadeUp} custom={0.3} initial="hidden"
          whileInView="visible" viewport={{ once: true }}
          className="glass-card rounded-2xl p-8"
        >
          <h3 className="font-display text-lg font-bold mb-6 text-text-primary">
            Model Specifications
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Parameters', value: '27.2M'   },
              { label: 'GFLOPs',     value: '104.7'   },
              { label: 'Layers',     value: '192'      },
              { label: 'Input Size', value: '640×640'  },
              { label: 'Optimizer',  value: 'AdamW'    },
              { label: 'LR',         value: '0.001'    },
              { label: 'Batch Size', value: '8'        },
              { label: 'Precision',  value: 'AMP FP16' },
            ].map(({ label, value }) => (
              <div key={label} className="border border-border rounded-xl p-4">
                <p className="font-mono text-xs text-slate-400 mb-1">{label}</p>
                <p className="font-mono text-base font-semibold text-indigo-400">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </Chapter>

      {/* ════════════════════════════════════════════
          CHAPTER 04 — TRAINING
      ════════════════════════════════════════════ */}
      <Chapter
        id="training"
        tag="Chapter 04 · Training Process"
        title="150 epochs of learning — watching the model improve"
      >
        {/* Training config */}
        <motion.div
          variants={fadeUp} custom={0} initial="hidden"
          whileInView="visible" viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 mb-8"
        >
          <h3 className="font-display text-lg font-bold mb-6 text-text-primary">
            Training Configuration
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              {[
                { k: 'Model',       v: 'yolov8m-seg.pt (COCO pretrained)' },
                { k: 'Epochs',      v: '150 (early stop patience: 25)'    },
                { k: 'Batch Size',  v: '8 images per step'                },
                { k: 'Image Size',  v: '640 × 640 pixels'                 },
                { k: 'Optimizer',   v: 'AdamW (lr=0.001, wd=0.0005)'      },
                { k: 'Hardware',    v: 'RTX 3050 Laptop GPU — 4GB VRAM'   },
              ].map(({ k, v }) => (
                <div key={k} className="flex gap-3 items-start">
                  <span className="font-mono text-xs text-primary w-24 flex-shrink-0">{k}</span>
                  <span className="font-body text-xs text-text-muted">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {[
                { k: 'Mosaic',      v: '1.0 — combines 4 images per sample'   },
                { k: 'Copy-Paste',  v: '0.3 — synthesizes new defect positions'},
                { k: 'Flip LR/UD',  v: '0.5 / 0.3 — orientation invariance'   },
                { k: 'Mixup',       v: '0.05 — subtle blending augmentation'   },
                { k: 'AMP',         v: 'Mixed precision — saves ~30% VRAM'     },
                { k: 'Workers',     v: '4 dataloader workers'                  },
              ].map(({ k, v }) => (
                <div key={k} className="flex gap-3 items-start">
                  <span className="font-mono text-xs text-secondary w-24 flex-shrink-0">{k}</span>
                  <span className="font-body text-xs text-text-muted">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Training progression */}
        <motion.div
          variants={fadeUp} custom={0.1} initial="hidden"
          whileInView="visible" viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 mb-8"
        >
          <h3 className="font-display text-lg font-bold mb-6 text-text-primary">
            How the Model Learned — Epoch Milestones
          </h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="flex flex-col gap-6 pl-12">
              {[
                { epoch: 'Epoch 1',   mAP: '26.0%', note: 'Model starts from random predictions — first pass through all 1,750 training images.' },
                { epoch: 'Epoch 5',   mAP: '34.6%', note: 'Backbone features begin to activate on defect patterns. Loss curves show clear descent.' },
                { epoch: 'Epoch 12',  mAP: '69.3%', note: 'Rapid improvement phase. Mosaic augmentation helping generalise across image positions.' },
                { epoch: 'Epoch 30',  mAP: '82.1%', note: 'Model confidently distinguishes Hole class (near 97%). Line class still hardest to segment.' },
                { epoch: 'Epoch 75',  mAP: '88.6%', note: 'Plateau begins. Fine-grained improvements in Knot and Stain segmentation masks.' },
                { epoch: 'Epoch 150', mAP: '92.7%', note: 'Training complete. All losses converged smoothly — no overfitting observed on validation set.' },
              ].map(({ epoch, mAP, note }, i) => (
                <div key={i} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-8 top-1 w-3 h-3 rounded-full border-2 border-primary bg-base" />
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <span className="font-mono text-xs text-primary">{epoch}</span>
                      <span className="font-mono text-xs text-success ml-2">{mAP}</span>
                    </div>
                    <p className="font-body text-xs text-text-muted leading-relaxed">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Loss explanation */}
        <motion.div
          variants={fadeUp} custom={0.2} initial="hidden"
          whileInView="visible" viewport={{ once: true }}
          className="glass-card rounded-2xl p-8"
        >
          <h3 className="font-display text-lg font-bold mb-4 text-text-primary">
            Understanding the Loss Functions
          </h3>
          <p className="font-body text-sm text-text-muted leading-relaxed mb-6">
            YOLOv8-seg optimises four simultaneous loss components, each teaching the model
            a different aspect of fabric defect detection:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { name: 'Box Loss',  desc: 'Penalises errors in bounding box location and size. Decreased from 1.57 → 0.69 over 150 epochs.' },
              { name: 'Seg Loss',  desc: 'Penalises errors in pixel mask quality. Critical for our goal — decreased from 2.80 → 1.50.' },
              { name: 'Cls Loss',  desc: 'Penalises wrong defect class predictions (Hole vs Stain etc). Decreased from 2.24 → 0.35.' },
              { name: 'DFL Loss',  desc: 'Distribution Focal Loss — improves bounding box precision. Decreased from 1.51 → 1.04.' },
            ].map(({ name, desc }) => (
              <div key={name} className="border border-border rounded-xl p-4">
                <p className="font-mono text-xs text-primary mb-1">{name}</p>
                <p className="font-body text-xs text-text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </Chapter>

      {/* ════════════════════════════════════════════
          CHAPTER 05 — RESULTS
      ════════════════════════════════════════════ */}
      <Chapter
        id="results"
        tag="Chapter 05 · Results"
        title="Goal achieved — and then some"
      >
        {/* Top metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { value: '92.7%', label: 'Box mAP@0.5',    sub: 'Detection accuracy',      color: 'success' },
            { value: '91.3%', label: 'Mask mAP@0.5',   sub: 'Segmentation accuracy',   color: 'success' },
            { value: '89.4%', label: 'Precision',       sub: 'All classes',             color: 'primary' },
            { value: '86.7%', label: 'Recall',          sub: 'All classes',             color: 'primary' },
          ].map((m, i) => (
            <motion.div
              key={i}
              variants={fadeUp} custom={i * 0.1} initial="hidden"
              whileInView="visible" viewport={{ once: true }}
            >
              <MetricCard {...m} />
            </motion.div>
          ))}
        </div>

        {/* Per-class results */}
        <motion.div
          variants={fadeUp} custom={0} initial="hidden"
          whileInView="visible" viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 mb-8"
        >
          <h3 className="font-display text-lg font-bold mb-6 text-text-primary">
            Per-Class AP@0.5 (Precision-Recall Curve)
          </h3>
          <div className="flex flex-col gap-5">
            <StatRow label="Hole  — 97.9%" value={0.979} color="#6366F1" />
            <StatRow label="Stain — 92.6%" value={0.926} color="#8B5CF6" />
            <StatRow label="Knot  — 90.3%" value={0.903} color="#10B981" />
            <StatRow label="Line  — 89.7%" value={0.897} color="#94A3B8" />
          </div>
          <p className="font-body text-xs text-text-muted mt-6 leading-relaxed">
            Hole achieves near-perfect detection at 97.9% — the high contrast of punctures against
            fabric makes them visually unambiguous. Line defects at 89.7% are the hardest — thin,
            elongated shapes with orientation variation present the greatest segmentation challenge.
          </p>
        </motion.div>

        {/* Confusion matrix insight */}
        <motion.div
          variants={fadeUp} custom={0.1} initial="hidden"
          whileInView="visible" viewport={{ once: true }}
          className="glass-card rounded-2xl p-8 mb-8"
        >
          <h3 className="font-display text-lg font-bold mb-4 text-text-primary">
            Confusion Matrix Insights
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <p className="font-body text-sm text-text-muted leading-relaxed mb-4">
                The normalised confusion matrix reveals the model's classification behaviour
                across all 4 defect classes:
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { cls: 'Hole',  pct: '96%', note: 'Highest — visually distinct' },
                  { cls: 'Line',  pct: '91%', note: 'Good — some FP with background' },
                  { cls: 'Stain', pct: '89%', note: 'Good — some confused with Knot' },
                  { cls: 'Knot',  pct: '88%', note: 'Hardest — small, texture-similar' },
                ].map(({ cls, pct, note }) => (
                  <div key={cls} className="flex items-center gap-3">
                    <span className="font-mono text-xs text-primary w-10">{cls}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                        initial={{ width: 0 }}
                        whileInView={{ width: pct }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        viewport={{ once: true }}
                      />
                    </div>
                    <span className="font-mono text-xs text-success w-10">{pct}</span>
                    <span className="font-body text-xs text-text-muted">{note}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-display font-semibold text-sm text-text-primary">
                Key observations
              </h4>
              {[
                'Hole class achieves 0.96 diagonal — near-perfect classification with only 0.02 false positive rate',
                'Knot shows 0.24 false positive rate from background — small knots visually similar to fabric texture nodes',
                'Line has 0.40 false positive rate from background — thin lines occasionally predicted where none exist',
                'Cross-class confusion is minimal — Stain and Knot do not confuse each other significantly',
              ].map((obs, i) => (
                <div key={i} className="flex gap-2">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <p className="font-body text-xs text-text-muted leading-relaxed">{obs}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Goal achieved callout */}
        <motion.div
          variants={fadeUp} custom={0.2} initial="hidden"
          whileInView="visible" viewport={{ once: true }}
          className="rounded-3xl p-10 text-center border border-success/30"
          style={{ background: 'rgba(16, 185, 129, 0.05)' }}
        >
          <span className="font-mono text-xs text-success uppercase tracking-widest block mb-3">
            Project Goal Status
          </span>
          <h3 className="font-display text-3xl font-bold text-text-primary mb-3">
            Target: mAP ≥ 90% ·{' '}
            <span className="text-success">Achieved: 92.7%</span>
          </h3>
          <p className="font-body text-sm text-text-muted max-w-xl mx-auto">
            Both box detection (92.7%) and mask segmentation (91.3%) exceed the industrial-grade
            target of 90% mAP@0.5, validating the system's readiness for real-world deployment.
          </p>
        </motion.div>
      </Chapter>

      {/* ════════════════════════════════════════════
          CHAPTER 06 — CHALLENGES & LEARNINGS
      ════════════════════════════════════════════ */}
      <Chapter
        id="challenges"
        tag="Chapter 06 · Challenges & Learnings"
        title="What went wrong, and what I learned from it"
      >
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {[
            {
              tag: 'Challenge 01',
              title: 'VRAM Constraints on a 4GB GPU',
              body: 'Training YOLOv8m with batch size 16 caused CUDA out-of-memory errors immediately. I had to drop to batch size 8 and enable AMP (Automatic Mixed Precision) to fit the model. This reduced VRAM usage by ~30% while maintaining accuracy — a lesson in pragmatic resource management.',
              color: 'danger',
            },
            {
              tag: 'Challenge 02',
              title: 'Line Class Generalisation',
              body: 'The Line defect class consistently underperformed early in training. The reason: linear defects vary wildly in angle, length, and thickness. The copy-paste augmentation (0.3) was key to improvement — synthesising new line positions across images helped the model build rotation-invariant features.',
              color: 'primary',
            },
            {
              tag: 'Challenge 03',
              title: 'Annotation Quality and Polygon Masks',
              body: 'Polygon mask quality in the Roboflow dataset varied across images. Some masks were coarsely drawn, which introduced noise in the segmentation loss. This is reflected in the lower mAP50-95 metric (67.3%) compared to mAP50 (92.7%) — IoU strictness reveals mask precision limitations.',
              color: 'violet',
            },
            {
              tag: 'Challenge 04',
              title: 'Background False Positives',
              body: 'The model initially predicted defects in clean fabric regions — particularly for Knot and Line classes. The confusion matrix shows 12% and 9% background false positive rates respectively. Careful tuning of the confidence threshold (0.367 optimal from F1 curve) balanced this tradeoff.',
              color: 'primary',
            },
          ].map(({ tag, title, body, color }, i) => (
            <motion.div
              key={i}
              variants={fadeUp} custom={i * 0.1} initial="hidden"
              whileInView="visible" viewport={{ once: true }}
              className="glass-card rounded-2xl p-8"
            >
              <span className={`font-mono text-xs uppercase tracking-widest block mb-3 ${
                color === 'danger' ? 'text-danger' :
                color === 'violet' ? 'text-secondary' : 'text-primary'
              }`}>
                {tag}
              </span>
              <h4 className="font-display font-bold text-base" style={{ color: '#F8FAFC' }}>{title}</h4>
              <p className="font-body text-xs text-text-muted leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>

        {/* Learnings */}
        <motion.div
          variants={fadeUp} custom={0.3} initial="hidden"
          whileInView="visible" viewport={{ once: true }}
          className="glass-card rounded-3xl p-10"
        >
          <h3 className="font-display text-xl font-bold mb-8 text-text-primary">
            Key Learnings
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Data quality > data quantity',
                body: '2,500 well-annotated images outperform 10,000 noisy ones. Time spent verifying labels is never wasted.',
              },
              {
                num: '02',
                title: 'Augmentation is domain-specific',
                body: 'Mosaic and copy-paste were critical for fabric defects because defects appear at any position and scale in real images.',
              },
              {
                num: '03',
                title: 'Hardware constraints drive architecture',
                body: 'Real projects rarely have infinite compute. Choosing YOLOv8m over larger variants was a deliberate, reasoned engineering decision.',
              },
              {
                num: '04',
                title: 'mAP50 vs mAP50-95 tell different stories',
                body: 'High mAP50 proves the model finds defects. Lower mAP50-95 reveals that mask polygon quality is the next frontier to improve.',
              },
              {
                num: '05',
                title: 'Transfer learning is almost always the answer',
                body: 'COCO pretrained weights gave a head start that would have taken hundreds of additional epochs to replicate from scratch.',
              },
              {
                num: '06',
                title: 'End-to-end thinking matters',
                body: 'Building the FastAPI backend and React dashboard forced clarity on what the model actually needs to output — confidence, class, mask coordinates.',
              },
            ].map(({ num, title, body }) => (
              <div key={num} className="flex flex-col gap-2">
                <span className="font-mono text-xs text-primary">{num}</span>
                <h4 className="font-display font-semibold text-sm text-text-primary">{title}</h4>
                <p className="font-body text-xs text-text-muted leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          variants={fadeUp} custom={0.4} initial="hidden"
          whileInView="visible" viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="font-body text-text-muted mb-6">
            Ready to see the model in action?
          </p>
          <a
            href="/dashboard"
            className="inline-block font-body font-medium px-10 py-4 rounded-full text-white"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            Open the Dashboard →
          </a>
        </motion.div>
      </Chapter>

      {/* Footer */}
      <footer className="border-t border-border py-10 text-center">
        <p className="font-mono text-xs text-text-muted">
          © 2026 Naeem Ur Rehman Naikwadi · KLE College of Engineering & Technology
        </p>
      </footer>

    </div>
  )
}