import Projects from '../../components/Projects';
import Head from 'next/head';

export default function HighlightsPage() {
  return (
    <>
      <Head>
        <title>Highlights | Atishay Kasliwal</title>
        <meta name="description" content="Portfolio of highlights by Atishay Kasliwal - AI/ML, Data Science, Software Engineering, and Full-Stack Development" />
        <link rel="canonical" href="https://atishaykasliwal.com/highlights" />
      </Head>
      <Projects />
    </>
  );
}

