import React, { useState, useEffect } from 'react';

const images = [
  '/final-product/new_york_pplapel_pin-removebg-preview.png',
  '/final-product/Chicago_lapel_opin-removebg-preview.png',
  '/final-product/Chicago_lapepl_pion-removebg-preview.png',
  '/final-product/fomc_market_predictions_1min.png',
  '/final-product/lirr.png',
  '/final-product/mlirr.png',
  '/final-product/WS.png',
  '/final-product/SBY.png',
  '/final-product/WF.png',
  '/final-product/ny1.png',
];

function FinalProductGrid() {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth <= 1024;
  const columns = isMobile || isTablet ? 5 : 10;
  const gap = isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem';
  const padding = isMobile ? '2rem 1rem' : '3rem 2rem';
  const tilePadding = isMobile ? '0.5rem' : '1rem';

  return (
    <div className="story-timeline" style={{ background: 'transparent', borderRadius: '16px', padding }} translate="no">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap,
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        translate="no"
      >
        {images.map((src, idx) => (
          <div
            key={idx}
            style={{
              width: '100%',
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              borderRadius: '12px',
              overflow: 'hidden',
              padding: tilePadding,
            }}
            translate="no"
          >
            <img
              src={src}
              alt={`Project ${idx + 1}`}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
              }}
              translate="no"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default FinalProductGrid;
