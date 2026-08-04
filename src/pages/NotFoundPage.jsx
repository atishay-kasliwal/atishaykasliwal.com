import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '../seo/Seo';
import { Container, Section, Button, ArrowIcon } from '../components/ui';
import { NAV_LINKS } from '../seo/routes.js';
import './NotFoundPage.css';

/**
 * 404.
 *
 * Prerendered to build/404.html, which is what Cloudflare Pages serves for
 * unmatched paths. It carries noindex (set in the route registry) so the error
 * page itself never enters the index, but it still offers real navigation —
 * a dead end here is a lost visitor who arrived from a stale link.
 */
export default function NotFoundPage() {
  return (
    <>
      <Seo path="/404" />

      <Section className="nf">
        <Container>
          <p className="eyebrow">Error 404</p>
          <h1 className="nf-title">This page does not exist.</h1>
          <p className="lede nf-lede">
            The link may be out of date, or I may have moved something. Here is everything
            that does exist.
          </p>

          <div className="nf-actions">
            <Button to="/" icon={<ArrowIcon />}>
              Back to home
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.dispatchEvent(new CustomEvent('ak:open-palette'))}
            >
              Search the site (⌘K)
            </Button>
          </div>

          <nav className="nf-links" aria-label="Site sections">
            <ul>
              {NAV_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path}>
                    {link.label}
                    <ArrowIcon />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </Section>
    </>
  );
}
