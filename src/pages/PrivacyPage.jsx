import React from 'react';
import Seo from '../seo/Seo';
import { webPageSchema } from '../seo/schema.js';
import { resolveMeta } from '../seo/routes.js';
import { Container, Section, PageHeader } from '../components/ui';
import { EMAIL } from '../data/site.js';
import './PrivacyPage.css';

const UPDATED = '2026-08-04';

/**
 * /privacy — describes what the site actually does, which is: Google Analytics
 * and nothing else. Written to match the real implementation rather than as
 * boilerplate, since a policy that describes non-existent data flows is both
 * useless and misleading.
 */
export default function PrivacyPage() {
  const meta = resolveMeta('/privacy');

  return (
    <>
      <Seo path="/privacy" schema={[webPageSchema(meta)]} />

      <PageHeader
        eyebrow="Privacy"
        title="What this site collects."
        lede="Short version: analytics, nothing else. No accounts, no tracking pixels beyond Google Analytics, nothing sold."
        breadcrumbs={meta.breadcrumbs}
      />

      <Section>
        <Container width="prose">
          <div className="legal">
            <p className="legal-updated mono">Last updated {UPDATED}</p>

            <h2>Analytics</h2>
            <p>
              This site uses Google Analytics to count visits and see which pages people
              read. That involves cookies set by Google and the collection of an
              approximate location, referring page, device type, and browser. Analytics
              scripts load only after the page is interactive, or on your first
              interaction — whichever comes first.
            </p>
            <p>
              You can block this entirely with any content blocker, or by enabling Do Not
              Track. Nothing on the site breaks if you do.
            </p>

            <h2>What is not collected</h2>
            <ul>
              <li>No accounts, logins, or passwords.</li>
              <li>No contact form — email reaches me directly and is not stored here.</li>
              <li>No advertising or remarketing pixels.</li>
              <li>No sale or sharing of data with third parties.</li>
            </ul>

            <h2>Third-party embeds</h2>
            <p>
              Some pages embed external services: Cal.com for scheduling and Google Fonts
              for typography. When those load, the provider can see your IP address and
              browser, subject to their own policies. Interactive demos that run machine
              learning models do so entirely in your browser — nothing you load into them
              is uploaded anywhere.
            </p>

            <h2>Hosting</h2>
            <p>
              The site is served as static files from Cloudflare Pages. Cloudflare keeps
              standard server logs, including IP addresses, for security and abuse
              prevention.
            </p>

            <h2>Your data</h2>
            <p>
              If you emailed me, I have that email. Ask and I will delete it. For anything
              else, there is nothing personal stored to request or remove.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about any of this: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
