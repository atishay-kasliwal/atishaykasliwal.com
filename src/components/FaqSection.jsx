import React, { useState } from 'react';
import { FAQ } from '../data/faq.js';
import './FaqSection.css';

const plate = (i) => String(i + 1).padStart(2, '0');

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex((cur) => (cur === i ? null : i));

  return (
    <section className="fq-wrap" aria-labelledby="faq-title">
      <div className="fq-card">
        <header className="fq-intro">
          <p className="spec-label fq-doc">
            <span className="fq-doc-mark" aria-hidden="true" />
            /faq.doc
          </p>
          <h2 id="faq-title" className="fq-title">
            Common Questions
          </h2>
        </header>

        <ul className="fq-list">
          {FAQ.map((item, i) => {
            const open = openIndex === i;
            const panelId = `fq-panel-${i}`;
            return (
              <li key={item.q} className="fq-item">
                <button
                  type="button"
                  className="fq-question"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => toggle(i)}
                >
                  <span className="fq-num mono">{plate(i)}</span>
                  <span className="fq-question-text">{item.q}</span>
                  <span className="fq-toggle" aria-hidden="true">{open ? '−' : '+'}</span>
                </button>
                <div className="fq-answer" id={panelId} role="region" hidden={!open}>
                  <p>{item.a}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
