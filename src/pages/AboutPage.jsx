import React from 'react';
import Seo from '../seo/Seo';
import AboutBook from '../components/AboutBook';
import AboutTasteIndex from '../components/AboutTasteIndex';
import AboutConnect from '../components/AboutConnect';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="about-page">
      <Seo path="/about" />

      <section className="about-page__section about-page__section--library" aria-label="Reference library">
        <AboutBook
          title="The references behind how I build."
        />
      </section>

      <section className="about-page__section about-page__section--taste" aria-label="Taste index">
        <AboutTasteIndex />
      </section>

      <section className="about-page__section about-page__section--connect" aria-label="Working profile">
        <AboutConnect />
      </section>
    </div>
  );
}
