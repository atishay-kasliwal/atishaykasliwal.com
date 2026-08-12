import React, { useRef } from 'react';
import LightGallery from 'lightgallery/react';
import lgZoom from 'lightgallery/plugins/zoom';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';
import { getPhotos } from '../lib/content/publicContent.js';
import './PhotographyGallery.css';

const plate = (n) => String(n).padStart(2, '0');

export default function PhotographyGallery({
  embedded = false,
  headerLabel = '/photography.doc',
}) {
  const lgRef = useRef(null);
  const topPhotos = getPhotos().slice(0, 5);

  return (
    <section
      className={`pg-wrap${embedded ? ' pg-wrap--embedded' : ''}`}
      aria-labelledby="photography-title"
    >
      <div className="pg-row">
        {/* The plate IS the heading now that the serif title is gone. It stays a
            real <h2> carrying the id rather than becoming a <p>: the section is
            labelled by it via aria-labelledby, and dropping the heading outright
            would leave this region unnamed and punch a hole in the outline. */}
        <header className="pg-intro">
          <h2 id="photography-title" className="spec-label pg-doc">
            <span className="pg-doc-mark" aria-hidden="true" />
            {headerLabel}
          </h2>
        </header>

        <LightGallery
          onInit={(detail) => {
            lgRef.current = detail.instance;
          }}
          speed={400}
          plugins={[lgZoom, lgThumbnail]}
          elementClassNames="pg-grid"
          selector="a"
        >
          {topPhotos.map((p) => (
            <a
              key={p.id}
              href={p.src}
              className="pg-card"
              data-lg-size={`${p.width}-${p.height}`}
              data-sub-html={`<span class="pg-caption">Plate ${plate(p.plate)}</span>`}
              aria-label={`Open plate ${plate(p.plate)}`}
            >
              <div className="pg-card__media">
                <img
                  src={p.thumb}
                  alt=""
                  width={p.width}
                  height={p.height}
                  style={{ aspectRatio: `${p.width} / ${p.height}` }}
                  loading="lazy"
                  decoding="async"
                />
                <span className="pg-card__index" aria-hidden="true">
                  {plate(p.plate)}
                </span>
              </div>

              <div className="pg-card__body">
                <span className="pg-card__title">Plate {plate(p.plate)}</span>
              </div>
            </a>
          ))}
        </LightGallery>
      </div>
    </section>
  );
}
