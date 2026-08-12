import React from 'react';
import { getAboutTasteColumns, getPhotos, getSiteSettings } from '../lib/content/publicContent.js';
import PhotographyGallery from './PhotographyGallery';
import './AboutTasteIndex.css';

const plate = (value) => String(value).padStart(2, '0');
const PHOTOGRAPHY = getPhotos();
const getPlaceholderPhoto = (rowIndex, itemIndex) =>
  PHOTOGRAPHY[(rowIndex * 5 + itemIndex) % PHOTOGRAPHY.length];

export default function AboutTasteIndex() {
  const siteSettings = getSiteSettings();
  const columns = getAboutTasteColumns();

  return (
    <div className="ati-wrap">
      <div className="ati-bridge">
        <div className="ati-bridge__copy">
          <p className="spec-label ati-doc">
            <span className="ati-doc-mark" aria-hidden="true" />
            {siteSettings.aboutTasteLabel}
          </p>
          <h2 className="ati-title">{siteSettings.aboutTasteTitle}</h2>
        </div>
      </div>

      <PhotographyGallery embedded headerLabel="01 / Photography" />

      <div className="ati-rows" role="list" aria-label="Movies and music recommendations">
        {columns.map((column, rowIndex) => (
          /* `shape` drives both the card aspect and how many fit a row: film
             posters are 2:3 and pack seven across, sleeves are square and sit
             five across. Defaults to 'square' so a row that omits it keeps the
             old behaviour. */
          <section
            key={column.id}
            className={`ati-row ati-row--${column.shape || 'square'}`}
            role="listitem"
          >
            {/* The plate carries the heading now that the prose title is gone.
                Still an <h3> rather than a <p>: it is the only thing naming this
                row, and demoting it would leave three unnamed regions inside a
                section that still needs an outline. */}
            <header className="ati-row__head">
              <h3 className="spec-label ati-row__plate">
                {plate(column.plate)} / {column.label}
              </h3>
            </header>

            <ol className="ati-row__grid">
              {column.items.map((item, itemIndex) => {
                /* An item that names its own artwork uses it; anything else
                   falls back to the photography placeholder, which is what
                   every card did before sleeve art existed. Keeping the
                   fallback means the music row can fill in one entry at a time
                   rather than needing all five before any of it works. */
                const photo = getPlaceholderPhoto(rowIndex, itemIndex);
                const art = item.cover
                  ? { src: item.cover, width: 600, height: 600, alt: item.coverAlt || '' }
                  : { src: photo.thumb, width: photo.width, height: photo.height, alt: '' };

                return (
                  <li key={`${column.id}-${item.title}`} className="ati-card">
                    <div className="ati-card__media">
                      <img
                        src={art.src}
                        alt={art.alt}
                        loading="lazy"
                        decoding="async"
                        width={art.width}
                        height={art.height}
                        style={{ aspectRatio: `${art.width} / ${art.height}` }}
                      />
                      <span className="ati-card__index" aria-hidden="true">
                        {plate(itemIndex + 1)}
                      </span>
                    </div>

                    <div className="ati-card__body">
                      <span className="ati-card__title">{item.title}</span>
                      <span className="ati-card__meta">{item.meta}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
