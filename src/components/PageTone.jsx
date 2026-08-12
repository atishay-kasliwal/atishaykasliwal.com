import React from 'react';
import './PageTone.css';

export default function PageTone({ variant = 'document' }) {
  return (
    <div className={`page-tone page-tone--${variant}`} aria-hidden="true">
      <div className="page-tone__mesh" />
      <div className="page-tone__glow page-tone__glow--primary" />
      <div className="page-tone__glow page-tone__glow--secondary" />
      <div className="page-tone__beam" />
      <div className="page-tone__noise" />
    </div>
  );
}
