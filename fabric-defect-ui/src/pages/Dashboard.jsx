import axios from 'axios'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'

// Real API call to FastAPI backend
const realPredict = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const res = await axios.post('http://localhost:8000/predict', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

// ── Processing stages shown during analysis ────────────────────────────────
const STAGES = [
  { id: 1, label: 'Loading image into model',         duration: 600  },
  { id: 2, label: 'Running backbone feature extraction', duration: 900  },
  { id: 3, label: 'FPN neck — multi-scale fusion',    duration: 700  },
  { id: 4, label: 'Generating segmentation masks',    duration: 800  },
  { id: 5, label: 'Scoring detections',               duration: 500  },
]

// ── Class color map ────────────────────────────────────────────────────────
const CLASS_COLORS = {
  Hole:  '#6366F1',
  Knot:  '#8B5CF6',
  Line:  '#94A3B8',
  Stain: '#10B981',
}

// ── Verdict logic ──────────────────────────────────────────────────────────
const getVerdict = (detections) => detections.length === 0 ? 'PASS' : 'Defected'

// ── Animated scanning line component ──────────────────────────────────────
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-0.5 z-10 pointer-events-none"
      style={{
        background: 'linear-gradient(90deg, transparent, #6366F1, #8B5CF6, transparent)',
        boxShadow: '0 0 12px 2px rgba(99,102,241,0.6)',
      }}
      animate={{ top: ['10%', '90%', '10%'] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// ── Processing stage list ──────────────────────────────────────────────────
function StageList({ currentStage }) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      {STAGES.map((s) => {
        const done    = currentStage > s.id
        const active  = currentStage === s.id
        const pending = currentStage < s.id
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: pending ? 0.3 : 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            {/* Status dot */}
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: done   ? '#10B981' :
                            active ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' :
                            '#1E1E2E',
                border: pending ? '1px solid #1E1E2E' : 'none',
              }}
            >
              {done && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {active && (
                <motion.div
                  className="w-2 h-2 rounded-full bg-white"
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
              )}
            </div>
            {/* Label */}
            <span className={`font-mono text-xs ${
              done    ? 'text-success' :
              active  ? 'text-white'   :
              'text-slate-600'
            }`}>
              {s.label}
            </span>
            {/* Active spinner */}
            {active && (
              <motion.div
                className="ml-auto w-3 h-3 rounded-full border border-t-primary border-r-transparent border-b-transparent border-l-transparent"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
              />
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Detection result card ──────────────────────────────────────────────────
function DetectionCard({ det, index }) {
  const color = CLASS_COLORS[det.class] || '#6366F1'
  const pct   = Math.round(det.confidence * 100)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5 }}
      className="glass-card rounded-xl p-4 flex flex-col gap-3"
    >
      {/* Class name + confidence */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Color dot */}
          <div className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: color }} />
          <span className="font-display font-semibold text-sm"
            style={{ color }}>
            {det.class}
          </span>
        </div>
        <span className="font-mono text-sm font-bold text-white">
          {pct}%
        </span>
      </div>
      {/* Confidence bar */}
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.15 + 0.3 }}
        />
      </div>
      <p className="font-mono text-xs" style={{ color: '#94A3B8' }}>
        Confidence: {det.confidence.toFixed(3)}
      </p>
    </motion.div>
  )
}

// ── Main Dashboard page ────────────────────────────────────────────────────
export default function Dashboard() {
  const [file,         setFile]         = useState(null)
  const [preview,      setPreview]      = useState(null)
  const [status,       setStatus]       = useState('idle')   // idle | processing | done | error
  const [currentStage, setCurrentStage] = useState(0)
  const [result,       setResult]       = useState(null)

  // ── Dropzone setup ───────────────────────────────────────────────────────
  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setStatus('idle')
    setResult(null)
    setCurrentStage(0)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  })

  // ── Run prediction ───────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file) return
    setStatus('processing')
    setCurrentStage(1)
    setResult(null)

    // Advance through stages with realistic timing
    let stage = 1
    for (const s of STAGES) {
      setCurrentStage(s.id)
      await new Promise((r) => setTimeout(r, s.duration))
    }

    try {
      const data = await realPredict(file)
      setResult(data)
      setStatus('done')
    } catch (e) {
      setStatus('error')
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setStatus('idle')
    setResult(null)
    setCurrentStage(0)
  }

  const verdict = result ? getVerdict(result.detections) : null

  return (
    <main className="min-h-screen bg-base pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="font-mono text-xs text-primary uppercase tracking-widest mb-3">
            Fabric Defect Detection · Dashboard
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
            Inspect a{' '}
            <span className="gradient-text">Fabric Sample</span>
          </h1>
          <p className="font-body text-sm" style={{ color: '#94A3B8' }}>
            Upload a fabric image and the YOLOv8m-seg model will detect and
            localize defects in real time.
          </p>
        </motion.div>

        {/* ── Main layout — Upload left, Results right ── */}
        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* ══ LEFT — Upload + Preview ══ */}
          <div className="flex flex-col gap-6">

            {/* Dropzone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div
                {...getRootProps()}
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
                  ${isDragActive
                    ? 'border-primary bg-primary/5'
                    : preview
                    ? 'border-border'
                    : 'border-border hover:border-primary/50 hover:bg-surface'
                  }`}
                style={{ minHeight: '320px' }}
              >
                <input {...getInputProps()} />

                {/* Scan animation overlay when processing */}
                {status === 'processing' && preview && <ScanLine />}

                {/* Dim overlay when processing */}
                {status === 'processing' && (
                  <div className="absolute inset-0 bg-base/60 z-10" />
                )}

                {preview ? (
                  /* Image preview */
                  <img
                    src={preview}
                    alt="Fabric sample"
                    className="w-full h-full object-cover rounded-2xl"
                    style={{ minHeight: '320px', maxHeight: '400px' }}
                  />
                ) : (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center h-full py-16 gap-4">
                    {/* Upload icon */}
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                    >
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
                          stroke="#6366F1" strokeWidth="1.5"
                          strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="font-display font-semibold text-white mb-1">
                        {isDragActive ? 'Drop it here' : 'Drop fabric image here'}
                      </p>
                      <p className="font-body text-xs" style={{ color: '#94A3B8' }}>
                        or click to browse · JPG, PNG, WEBP
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* File info */}
            {file && status !== 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2"
                        stroke="#6366F1" strokeWidth="1.5"/>
                      <path d="M3 9h18" stroke="#6366F1" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-mono text-xs text-white">{file.name}</p>
                    <p className="font-mono text-xs" style={{ color: '#94A3B8' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReset() }}
                  className="font-mono text-xs transition-colors duration-200"
                  style={{ color: '#94A3B8' }}
                  onMouseEnter={e => e.target.style.color = '#EF4444'}
                  onMouseLeave={e => e.target.style.color = '#94A3B8'}
                >
                  Remove
                </button>
              </motion.div>
            )}

            {/* Analyze button */}
            <AnimatePresence>
              {file && status === 'idle' && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={handleAnalyze}
                  className="w-full py-4 rounded-2xl font-display font-bold text-white text-lg relative overflow-hidden group"
                  style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(90deg, transparent, white, transparent)',
                      transform: 'skewX(-20deg)' }}
                  />
                  Detect Defects →
                </motion.button>
              )}
            </AnimatePresence>

            {/* Try another button after done */}
            {status === 'done' && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleReset}
                className="w-full py-3 rounded-2xl font-body font-medium border transition-all duration-300"
                style={{ borderColor: '#1E1E2E', color: '#94A3B8' }}
                whileHover={{ borderColor: '#6366F1', color: '#F8FAFC' }}
              >
                Analyze Another Image
              </motion.button>
            )}
          </div>

          {/* ══ RIGHT — Processing animation OR Results ══ */}
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="wait">

              {/* ── IDLE state — model info card ── */}
              {status === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-2xl p-8 flex flex-col gap-6"
                >
                  <p className="font-mono text-xs text-primary uppercase tracking-widest">
                    Model Ready
                  </p>
                  <div className="flex flex-col gap-4">
                    {[
                      { label: 'Model',      value: 'YOLOv8m-seg'    },
                      { label: 'Classes',    value: 'Hole, Knot, Line, Stain' },
                      { label: 'Input Size', value: '640 × 640 px'   },
                      { label: 'mAP@0.5',   value: '92.7%'           },
                      { label: 'Mask mAP',  value: '91.3%'           },
                      { label: 'Avg. Speed','value': '~43ms / image' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-center border-b pb-3"
                        style={{ borderColor: '#1E1E2E' }}>
                        <span className="font-mono text-xs" style={{ color: '#94A3B8' }}>{label}</span>
                        <span className="font-mono text-xs text-primary font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="font-body text-xs" style={{ color: '#94A3B8' }}>
                    Upload a fabric image on the left and click{' '}
                    <span className="text-primary">Detect Defects</span> to begin analysis.
                  </p>
                </motion.div>
              )}

              {/* ── PROCESSING state ── */}
              {status === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="glass-card rounded-2xl p-8 flex flex-col items-center gap-8"
                  style={{ minHeight: '420px', justifyContent: 'center' }}
                >
                  {/* Pulsing ring animation */}
                  <div className="relative flex items-center justify-center">
                    {/* Outer ring */}
                    <motion.div
                      className="absolute w-24 h-24 rounded-full border-2"
                      style={{ borderColor: 'rgba(99,102,241,0.3)' }}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    />
                    {/* Middle ring */}
                    <motion.div
                      className="absolute w-16 h-16 rounded-full border-2"
                      style={{ borderColor: 'rgba(139,92,246,0.5)' }}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.2, 0.7] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut', delay: 0.3 }}
                    />
                    {/* Center spinning arc */}
                    <motion.div
                      className="w-10 h-10 rounded-full"
                      style={{
                        border: '2px solid transparent',
                        borderTopColor: '#6366F1',
                        borderRightColor: '#8B5CF6',
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                    />
                  </div>

                  {/* Analyzing label */}
                  <div className="text-center">
                    <p className="font-display font-bold text-white text-lg mb-1">
                      Analyzing...
                    </p>
                    <p className="font-mono text-xs" style={{ color: '#94A3B8' }}>
                      YOLOv8m-seg is inspecting your fabric
                    </p>
                  </div>

                  {/* Stage list */}
                  <StageList currentStage={currentStage} />
                </motion.div>
              )}

              {/* ── DONE state — Results ── */}
              {status === 'done' && result && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4"
                >
                  {/* Annotated result image */}
                  {result.image_base64 && (
                    <motion.img
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={`data:image/jpeg;base64,${result.image_base64}`}
                      alt="Detection result"
                      className="w-full rounded-2xl border border-border"
                    />
                  )}

                  {/* Verdict banner */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-2xl p-6 flex items-center justify-between"
                    style={{
                      background: verdict === 'PASS'
                        ? 'rgba(16,185,129,0.08)'
                        : 'rgba(239,68,68,0.08)',
                      border: `1px solid ${verdict === 'PASS' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    }}
                  >
                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest mb-1"
                        style={{ color: verdict === 'PASS' ? '#10B981' : '#EF4444' }}>
                        QC Verdict
                      </p>
                      <p className="font-display text-3xl font-extrabold"
                        style={{ color: verdict === 'PASS' ? '#10B981' : '#EF4444' }}>
                        {verdict}
                      </p>
                      <p className="font-body text-xs mt-1" style={{ color: '#94A3B8' }}>
                        {verdict === 'PASS'
                          ? 'No defects detected — fabric meets quality standard'
                          : `${result.detections.length} defect${result.detections.length > 1 ? 's' : ''} detected`}
                      </p>
                    </div>
                    {/* Big verdict icon */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: verdict === 'PASS'
                          ? 'rgba(16,185,129,0.15)'
                          : 'rgba(239,68,68,0.15)',
                      }}
                    >
                      {verdict === 'PASS' ? (
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                          <path d="M5 13l4 4L19 7"
                            stroke="#10B981" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                            stroke="#EF4444" strokeWidth="1.5"
                            strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                  </motion.div>

                  {/* Inference time + count */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Inference Time', value: `${result.inference_time_ms}ms`, color: '#6366F1' },
                      { label: 'Defects Found',  value: result.detections.length,        color: verdict === 'PASS' ? '#10B981' : '#EF4444' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="glass-card rounded-xl p-4 text-center">
                        <p className="font-mono text-2xl font-bold mb-1" style={{ color }}>{value}</p>
                        <p className="font-mono text-xs" style={{ color: '#94A3B8' }}>{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Detection cards */}
                  {result.detections.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <p className="font-mono text-xs uppercase tracking-widest"
                        style={{ color: '#94A3B8' }}>
                        Detected Defects
                      </p>
                      {result.detections.map((det, i) => (
                        <DetectionCard key={i} det={det} index={i} />
                      ))}
                    </div>
                  )}

                  {/* Model info footer */}
                  <div className="glass-card rounded-xl px-4 py-3 flex items-center justify-between">
                    <span className="font-mono text-xs" style={{ color: '#94A3B8' }}>
                      Model
                    </span>
                    <span className="font-mono text-xs text-primary">
                      YOLOv8m-seg · conf@0.367
                    </span>
                  </div>
                </motion.div>
              )}

              {/* ── ERROR state ── */}
              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card rounded-2xl p-8 text-center flex flex-col gap-4 items-center"
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                      <path d="M18 6L6 18M6 6l12 12"
                        stroke="#EF4444" strokeWidth="1.5"
                        strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="font-display font-bold text-white">Model Error</p>
                  <p className="font-body text-xs" style={{ color: '#94A3B8' }}>
                    Could not connect to the FastAPI backend. Make sure it is running on port 8000.
                  </p>
                  <button onClick={handleReset}
                    className="font-mono text-xs text-primary hover:underline">
                    Try again
                  </button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  )
}