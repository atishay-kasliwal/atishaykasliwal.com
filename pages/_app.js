import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
// CSS moved to public folder for direct serving - loaded via _document.js
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Disable automatic scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Scroll to top on route changes
    const handleRouteChange = () => {
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }
        if (document.body) {
          document.body.scrollTop = 0;
        }
      }, 0);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  // Hide Header/Footer for art page (it has its own header)
  const isArtPage = router.pathname === '/art';

  return (
    <>
      <Head>
        <html lang="en" translate="no" />
        <meta name="google" content="notranslate" />
        <meta name="google-translate-customization" content="no" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>
      {!isArtPage && <Header />}
      <Component {...pageProps} />
      {!isArtPage && <Footer />}
    </>
  );
}

