import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

// ── Animation variants reused across sections ──────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut', delay },
  }),
}

// ── Stat ticker data ───────────────────────────────────────────────────────
const STATS = [
  { value: '92.3%', label: 'mAP Score'         },
  { value: '4',     label: 'Defect Classes'     },
  { value: '<500ms', label: 'Inference Time'     },
  { value: '4,200', label: 'Training Images'    },
  { value: '99.1%', label: 'GPU Utilisation'    },
  { value: 'YOLOv8',label: 'Architecture'       },
]

// ── Animated counter for stat numbers ─────────────────────────────────────
function StatItem({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1 px-10 border-r border-border last:border-none">
      <span className="font-mono text-2xl font-semibold gradient-text">
        {value}
      </span>
      <span className="font-body text-xs text-text-muted uppercase tracking-widest">
        {label}
      </span>
    </div>
  )
}

// ── Card used for About sections (Me, College, Company) ───────────────────
function AboutCard({ tag, title, subtitle, body, delay }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className="glass-card rounded-2xl p-8 flex flex-col gap-4 hover:border-primary/40 transition-colors duration-300"
    >
      {/* Tag pill */}
      <span className="self-start font-mono text-xs text-primary border border-primary/30 rounded-full px-3 py-1">
        {tag}
      </span>
      <h3 className="font-display text-xl font-bold text-text-primary">
        {title}
      </h3>
      {subtitle && (
        <p className="font-mono text-xs text-text-muted">{subtitle}</p>
      )}
      <p className="font-body text-sm text-text-muted leading-relaxed">
        {body}
      </p>
    </motion.div>
  )
}

// ── Main Landing page ──────────────────────────────────────────────────────
export default function Landing() {
  return (
    <main className="min-h-screen bg-base overflow-hidden">

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6">

        {/* Background grid pattern */}
        <div
          className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none"
        />

        {/* Glowing orb behind hero text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Badge */}
        <motion.div
          variants={fadeUp} custom={0} initial="hidden" animate="visible"
          className="mb-6 self-center font-mono text-xs text-primary border border-primary/30 rounded-full px-4 py-2"
        >
          Internship Project — BE Computer Science & Engineering
        </motion.div>

        {/* Main headline */}
        <motion.h1
          variants={fadeUp} custom={0.1} initial="hidden" animate="visible"
          className="font-display text-5xl md:text-7xl font-extrabold leading-tight max-w-5xl"
        >
          Automated Fabric{' '}
          <span className="gradient-text">Defect Detection</span>{' '}
          & Localization
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={fadeUp} custom={0.2} initial="hidden" animate="visible"
          className="mt-6 font-body text-lg md:text-xl text-text-muted max-w-2xl"
        >
          Precision Fabric Inspection, Powered by AI — using YOLOv8-seg
          for  real-time segmentation and defect localization at industrial scale.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          variants={fadeUp} custom={0.3} initial="hidden" animate="visible"
          className="mt-10 flex gap-4 flex-wrap justify-center"
        >
          <a
            href="/dashboard"
            className="font-body font-medium px-8 py-3 rounded-full text-white"
            style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
          >
            Try the Model →
          </a>
          <a
            href="/journey"
            className="font-body font-medium px-8 py-3 rounded-full text-text-muted border border-border hover:border-primary/40 hover:text-text-primary transition-all duration-300"
          >
            View Journey
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute bottom-10 flex flex-col items-center gap-2 text-text-muted"
        >
          <span className="font-mono text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-10 bg-gradient-to-b from-primary to-transparent"
          />
        </motion.div>
      </section>

      {/* ── STAT TICKER ── */}
      <motion.section
        variants={fadeUp} custom={0} initial="hidden" whileInView="visible"
        viewport={{ once: true }}
        className="py-12 border-y border-border glass-card"
      >
        <div className="flex flex-wrap justify-center">
          {STATS.map((s) => (
            <StatItem key={s.label} {...s} />
          ))}
        </div>
      </motion.section>

      {/* ── ABOUT SECTION ── */}
      <section className="max-w-6xl mx-auto px-6 py-28">

        {/* Section label */}
        <motion.p
          variants={fadeUp} custom={0} initial="hidden" whileInView="visible"
          viewport={{ once: true }}
          className="font-mono text-xs text-primary uppercase tracking-widest mb-4"
        >
          About the Project
        </motion.p>

        <motion.h2
          variants={fadeUp} custom={0.1} initial="hidden" whileInView="visible"
          viewport={{ once: true }}
          className="font-display text-4xl md:text-5xl font-bold mb-16 max-w-2xl"
        >
          Built {' '}
          <span className="gradient-text">for the industry.</span>
        </motion.h2>

        {/* Bento grid — 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1 — Me */}
          <AboutCard
            tag="The Developer"
            title="Naeem Ur Rehman Naikwadi"
            subtitle="BE — Computer Science & Engineering"
            body="A final-year engineering student passionate about computer vision and deep learning. This project is the culmination of four years of engineering education, combining academic rigor with real-world industrial applicability."
            delay={0}
          />

          {/* Card 2 — College */}
          <AboutCard
            tag="Institution"
            title="KLE College of Engineering & Technology"
            subtitle="Chikodi, Karnataka · info@klecet.edu.in"
            body="Committed to transforming young minds into globally competent engineering professionals with social responsibility. KLECET provided the academic foundation and research environment for this project."
            delay={0.1}
          />

          {/* Card 3 — Company */}
          <AboutCard
            tag="Internship Partner"
            title="SuprMentr Technologies Pvt Ltd"
            subtitle="Ed-Tech · Bengaluru · Est. July 2023"
            body="An active Bengaluru-based career-tech startup specialising in mentorship, upskilling, and internships for engineering students. Official partner of Nasscom Future Skills, recognised by the Government of India."
            delay={0.2}
          />

        </div>
      </section>

      {/* ── PROJECT HIGHLIGHT SECTION ── */}
      <section className="max-w-6xl mx-auto px-6 pb-28">

        <div className="glass-card rounded-3xl p-12 md:p-16 relative overflow-hidden">

          {/* Decorative gradient blob */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)' }}
          />

          <motion.p
            variants={fadeUp} custom={0} initial="hidden" whileInView="visible"
            viewport={{ once: true }}
            className="font-mono text-xs text-primary uppercase tracking-widest mb-4"
          >
            What this system does
          </motion.p>

          <motion.h2
            variants={fadeUp} custom={0.1} initial="hidden" whileInView="visible"
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl font-bold mb-8 max-w-2xl"
          >
            Real-time defect segmentation —{' '}
            <span className="gradient-text">not just detection.</span>
          </motion.h2>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {[
              {
                title: 'Instance Segmentation',
                desc: 'YOLOv8-seg produces pixel-level masks for each defect, not just bounding boxes — giving precise localization data.',
              },
              {
                title: '4 Defect Classes',
                desc: 'Trained to identify holes, stains, tears, thread pulls, weaving errors, and more across diverse fabric types.',
              },
              {
                title: 'Industrial-Grade mAP',
                desc: 'Achieves ≥90% mAP through careful dataset curation, augmentation, and hyperparameter tuning.',
              },
              {
                title: 'FastAPI Backend',
                desc: 'Lightweight REST API serves predictions in under 50ms, ready for integration into any production pipeline.',
              },
            ].map(({ title, desc }, i) => (
              <motion.div
                key={title}
                variants={fadeUp} custom={i * 0.1}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="flex gap-4 items-start"
              >
                {/* Dot accent */}
                <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                <div>
                  <h4 className="font-display font-semibold text-text-primary mb-1">
                    {title}
                  </h4>
                  <p className="font-body text-sm text-text-muted leading-relaxed">
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-10 text-center">
        <p className="font-mono text-xs text-text-muted">
          © 2026 Naeem Ur Rehman Naikwadi · KLE College of Engineering & Technology ·{' '}
          <a href="mailto:naeemnaikwadi955@gmail.com" className="text-primary hover:underline">
            naeemnaikwadi955@gmail.com
          </a>
        </p>
      </footer>

    </main>
  )
}