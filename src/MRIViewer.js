import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import './MRIViewer.css';

// ── Config ─────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.REACT_APP_MRI_CDN || '';

const MODALITIES = ['T1', 'T2', 'FLAIR', 'DWI', 'ADC', 'OVERLAY'];

const METADATA = {
  totalSlices: 31,
  tumorRange: { start: 11, end: 20, center: 15 },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getImageUrl(modality, slice) {
  const padded = String(slice).padStart(3, '0');
  return `${BASE_URL}/${modality.toLowerCase()}/${padded}.jpg`;
}

function preloadSlices(centerSlice, total, radius = 5) {
  for (let s = Math.max(0, centerSlice - radius); s <= Math.min(total - 1, centerSlice + radius); s++) {
    MODALITIES.forEach((mod) => {
      const img = new window.Image();
      img.src = getImageUrl(mod, s);
    });
  }
}

// ── Panel ──────────────────────────────────────────────────────────────────────

const Panel = memo(function Panel({ modality, slice }) {
  return (
    <div className="mriv-panel">
      <img
        src={getImageUrl(modality, slice)}
        alt={`${modality} slice ${slice}`}
        className="mriv-panel-img"
        draggable={false}
      />
      <span className="mriv-panel-label">{modality}</span>
    </div>
  );
});

// ── Timeline ───────────────────────────────────────────────────────────────────

const Timeline = memo(function Timeline({ currentSlice, totalSlices, tumorRange, onSeek }) {
  const trackRef = useRef(null);
  const [hoverSlice, setHoverSlice] = useState(null);

  const sliceFromEvent = useCallback((e) => {
    if (!trackRef.current) return null;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return Math.round(pct * (totalSlices - 1));
  }, [totalSlices]);

  const handleClick = useCallback((e) => {
    const s = sliceFromEvent(e);
    if (s !== null) onSeek(s);
  }, [sliceFromEvent, onSeek]);

  const handleMouseMove = useCallback((e) => {
    const s = sliceFromEvent(e);
    setHoverSlice(s);
  }, [sliceFromEvent]);

  const markerPct    = (currentSlice / (totalSlices - 1)) * 100;
  const tumorL       = (tumorRange.start / (totalSlices - 1)) * 100;
  const tumorW       = ((tumorRange.end - tumorRange.start) / (totalSlices - 1)) * 100;
  const hoverPct     = hoverSlice !== null ? (hoverSlice / (totalSlices - 1)) * 100 : null;

  return (
    <div
      className="mriv-timeline"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverSlice(null)}
    >
      {/* hover preview label */}
      {hoverSlice !== null && (
        <div className="mriv-timeline-hover" style={{ left: `${hoverPct}%` }}>
          {hoverSlice}
        </div>
      )}

      <div className="mriv-timeline-track" ref={trackRef}>
        {/* tumor region */}
        <div
          className="mriv-timeline-tumor"
          style={{ left: `${tumorL}%`, width: `${tumorW}%` }}
        />
        {/* current marker */}
        <div
          className="mriv-timeline-marker"
          style={{ left: `${markerPct}%` }}
        />
      </div>
    </div>
  );
});

// ── Main viewer ────────────────────────────────────────────────────────────────

export default function MRIViewer() {
  const [currentSlice, setCurrentSlice] = useState(METADATA.tumorRange.center);
  const lastScrollAt = useRef(0);
  const { totalSlices, tumorRange } = METADATA;

  const isInTumor = currentSlice >= tumorRange.start && currentSlice <= tumorRange.end;

  const changeSlice = useCallback((delta) => {
    setCurrentSlice((prev) => Math.max(0, Math.min(totalSlices - 1, prev + delta)));
  }, [totalSlices]);

  // Wheel — throttled to 30 ms
  useEffect(() => {
    const onWheel = (e) => {
      const now = Date.now();
      if (now - lastScrollAt.current < 30) return;
      lastScrollAt.current = now;
      e.preventDefault();
      changeSlice(e.deltaY > 0 ? 1 : -1);
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, [changeSlice]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); changeSlice(1); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); changeSlice(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [changeSlice]);

  // Preload ±5 slices
  useEffect(() => {
    preloadSlices(currentSlice, totalSlices);
  }, [currentSlice, totalSlices]);


  return (
    <div className="mriv-root">
      {/* 6-panel grid */}
      <div className="mriv-grid">
        {MODALITIES.map((mod) => (
          <Panel key={mod} modality={mod} slice={currentSlice} />
        ))}
      </div>

      {/* Floating slice indicator */}
      <div className="mriv-indicator">
        <span className="mriv-indicator-slice">{currentSlice}</span>
        <span className="mriv-indicator-sep"> / {totalSlices - 1}</span>
        {isInTumor && <span className="mriv-indicator-tumor"> · Tumor</span>}
      </div>

      {/* Keyboard hint */}
      <div className="mriv-hint">↑ ↓ scroll to navigate</div>

      {/* Timeline */}
      <Timeline
        currentSlice={currentSlice}
        totalSlices={totalSlices}
        tumorRange={tumorRange}
        onSeek={setCurrentSlice}
      />
    </div>
  );
}
