import React from 'react';

const ICONS = {
  dashboard: (
    <>
      <path d="M4 5h7v6H4z" />
      <path d="M13 5h7v4h-7z" />
      <path d="M13 11h7v8h-7z" />
      <path d="M4 13h7v6H4z" />
    </>
  ),
  fileText: (
    <>
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M10 13h6" />
      <path d="M10 17h6" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.8 4.7L19 9.5l-4.2 2.6L16 17l-4-3-4 3 1.2-4.9L5 9.5l5.2-1.8z" />
      <path d="m19 3 .6 1.6L21 5.2l-1.4.7L19 7.5l-.6-1.6L17 5.2l1.4-.6z" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h4l2-3h4l2 3h4v11H4z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  message: (
    <>
      <path d="M5 6h14v10H9l-4 3z" />
      <path d="M9 10h6" />
      <path d="M9 13h4" />
    </>
  ),
  timeline: (
    <>
      <path d="M12 5v14" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M14 6h5" />
      <path d="M5 12h5" />
      <path d="M14 18h5" />
    </>
  ),
  clapperboard: (
    <>
      <path d="M4 8h16v11H4z" />
      <path d="M4 8 7 4h4L8 8" />
      <path d="m11 4 3 4" />
      <path d="m16 4 3 4" />
    </>
  ),
  tv: (
    <>
      <rect x="4" y="6" width="16" height="11" rx="1" />
      <path d="M9 20h6" />
      <path d="M12 17v3" />
    </>
  ),
  music: (
    <>
      <path d="M15 5v9.2a2.8 2.8 0 1 1-2-2.7V7l7-1v7.2a2.8 2.8 0 1 1-2-2.7V5z" />
    </>
  ),
  image: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <circle cx="9" cy="10" r="1.4" />
      <path d="m20 15-4.2-4.2L8 19" />
    </>
  ),
  layout: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M9 5v14" />
      <path d="M9 10h11" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 1.1 1.9-2 3.4-2.2-.6a8.9 8.9 0 0 1-1.6.9l-.4 2.2H9.7l-.4-2.2a8.9 8.9 0 0 1-1.6-.9l-2.2.6-2-3.4L4.6 15a8.7 8.7 0 0 1 0-1.9L3.5 11l2-3.4 2.2.6c.5-.3 1-.6 1.6-.9l.4-2.2h4.6l.4 2.2c.6.3 1.1.6 1.6.9l2.2-.6 2 3.4-1.1 2.1c.1.6.1 1.3 0 1.9Z" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  external: (
    <>
      <path d="M14 5h5v5" />
      <path d="m10 14 9-9" />
      <path d="M19 13v6H5V5h6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 5H5v14h4" />
      <path d="M14 17l5-5-5-5" />
      <path d="M19 12H9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  bell: (
    <>
      <path d="M15 17H5l1.2-1.6A4.6 4.6 0 0 0 7 12.7V11a5 5 0 1 1 10 0v1.7c0 1 .3 1.9.8 2.7L19 17h-4" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  chevronRight: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  panelLeft: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <path d="M9 5v14" />
      <path d="m13 9-3 3 3 3" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2.5" />
      <path d="M12 19.5V22" />
      <path d="m4.9 4.9 1.8 1.8" />
      <path d="m17.3 17.3 1.8 1.8" />
      <path d="M2 12h2.5" />
      <path d="M19.5 12H22" />
      <path d="m4.9 19.1 1.8-1.8" />
      <path d="m17.3 6.7 1.8-1.8" />
    </>
  ),
  moon: <path d="M18 14.2A6.8 6.8 0 1 1 9.8 6 5.6 5.6 0 0 0 18 14.2Z" />,
  check: <path d="m5 12 4 4 10-10" />,
  warning: (
    <>
      <path d="M12 4 21 20H3z" />
      <path d="M12 9v4" />
      <path d="M12 16h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <path d="M12 7h.01" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="3" />,
  edit: (
    <>
      <path d="m4 20 4.5-1 9.1-9.1-3.5-3.5L5 15.5 4 20Z" />
      <path d="m12.8 5.8 3.5 3.5" />
    </>
  ),
  duplicate: (
    <>
      <rect x="8" y="8" width="10" height="10" rx="1" />
      <path d="M6 14H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1" />
    </>
  ),
  archive: (
    <>
      <path d="M4 7h16v3H4z" />
      <path d="M6 10h12v9H6z" />
      <path d="M10 14h4" />
    </>
  ),
  trash: (
    <>
      <path d="M5 7h14" />
      <path d="M8 7V5h8v2" />
      <path d="M7 7l1 12h8l1-12" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" rx="1" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 6v5h-5" />
      <path d="M4 18v-5h5" />
      <path d="M7.5 9A7 7 0 0 1 20 11" />
      <path d="M16.5 15A7 7 0 0 1 4 13" />
    </>
  ),
};

export default function AdminIcon({ name, size = 18, strokeWidth = 1.7, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name] || ICONS.dot}
    </svg>
  );
}
