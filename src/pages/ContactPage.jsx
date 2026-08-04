import React from 'react';
import Seo from '../seo/Seo';
import { contactPageSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Section, PageHeader, Button, DownloadIcon, ExternalIcon } from '../components/ui';
import {
  EMAIL,
  LOCATION,
  AVAILABILITY,
  PROFILES,
  SOCIAL_LINKS,
  RESUME_PDF,
  FULL_NAME,
} from '../data/site.js';
import './ContactPage.css';

/**
 * /contact — every route to reach a human, ranked by how fast it works.
 *
 * No contact form. A form on a personal site adds a delivery dependency, a spam
 * surface, and a step, in exchange for nothing the recruiter wants — they are
 * going to email from their ATS anyway. A prominent mailto and a booking link
 * convert better.
 */
export default function ContactPage() {
  const meta = resolveMeta('/contact');

  const channels = [
    {
      label: 'Email',
      value: EMAIL,
      href: `mailto:${EMAIL}`,
      note: 'Best for anything substantive. I reply within a day.',
      primary: true,
    },
    {
      label: 'Book a call',
      value: 'cal.com/atishay-kasliwal',
      href: PROFILES.cal,
      note: '30 minutes, no agenda required.',
      external: true,
    },
    {
      label: 'LinkedIn',
      value: 'in/atishay-kasliwal',
      href: PROFILES.linkedin,
      note: 'Connections and recruiter outreach.',
      external: true,
    },
    {
      label: 'GitHub',
      value: '@atishay-kasliwal',
      href: PROFILES.github,
      note: 'Code, and the fastest way to judge whether I can do the job.',
      external: true,
    },
  ];

  return (
    <>
      <Seo path="/contact" schema={[contactPageSchema(meta)]} />

      <PageHeader
        eyebrow="Contact"
        title="Let's talk."
        lede={`I read everything that arrives. If you are hiring, the fastest path is email with the role attached — I will tell you honestly whether it is a fit.`}
        breadcrumbs={meta.breadcrumbs}
      >
        <Button href={`mailto:${EMAIL}`}>Email {FULL_NAME.split(' ')[0]}</Button>
        <Button href={RESUME_PDF} download variant="ghost" icon={<DownloadIcon />}>
          Download résumé
        </Button>
      </PageHeader>

      <Section>
        <Container>
          <div className="contact-layout">
            <div className="contact-channels">
              <h2 className="section-title">Channels</h2>
              <ul className="channel-list">
                {channels.map((c) => (
                  <li key={c.label} className={`channel card${c.primary ? ' is-primary' : ''}`}>
                    <div className="channel-main">
                      <span className="channel-label mono">{c.label}</span>
                      <a
                        className="channel-value card-link"
                        href={c.href}
                        {...(c.external
                          ? { target: '_blank', rel: 'noopener noreferrer' }
                          : {})}
                      >
                        {c.value}
                        {c.external && <ExternalIcon />}
                      </a>
                      <p className="channel-note">{c.note}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="contact-aside" aria-label="Availability and location">
              <div className="availability card">
                <h2 className="availability-title">
                  <span className="status-dot" aria-hidden="true" />
                  {AVAILABILITY.open ? 'Available' : 'Not currently looking'}
                </h2>
                <p className="availability-label">{AVAILABILITY.label}</p>
                <p className="availability-detail">{AVAILABILITY.detail}</p>

                <dl className="availability-facts">
                  <div>
                    <dt>Based in</dt>
                    <dd>{LOCATION.display}</dd>
                  </div>
                  <div>
                    <dt>Time zone</dt>
                    <dd>Eastern (ET)</dd>
                  </div>
                  <div>
                    <dt>Relocation</dt>
                    <dd>Open</dd>
                  </div>
                </dl>
              </div>

              <div className="contact-socials">
                <h2 className="contact-socials-title mono">Elsewhere</h2>
                <ul>
                  {SOCIAL_LINKS.map((s) => (
                    <li key={s.key}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer me">
                        <span>{s.label}</span>
                        <span className="contact-social-handle">{s.handle}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
