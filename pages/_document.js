import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" translate="no" className="notranslate">
      <Head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-5QZR9SWX');
            `,
          }}
        />
        {/* End Google Tag Manager */}
        
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-RX5HTCRR3X"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-RX5HTCRR3X');
            `,
          }}
        />
        
        {/* Prevent Google Translate */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (window.google && window.google.translate) {
                  window.google.translate.TranslateElement = function() {};
                  if (window.google.translate.TranslateElement.prototype) {
                    window.google.translate.TranslateElement.prototype = {};
                  }
                }
              })();
            `,
          }}
        />
      </Head>
      <body translate="no">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5QZR9SWX"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        
        {/* SEO-visible H1 for name relevance */}
        <h1
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
          }}
          translate="no"
        >
          Atishay Kasliwal — Full-Stack Engineer & Data Scientist
        </h1>
        
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

