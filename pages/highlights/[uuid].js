import { useRouter } from 'next/router';
import Head from 'next/head';
import HighlightDetail from '../../components/HighlightDetail';

export default function HighlightDetailPage() {
  const router = useRouter();
  const { uuid } = router.query;

  if (!uuid) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Highlight | Atishay Kasliwal</title>
        <link rel="canonical" href={`https://atishaykasliwal.com/highlights/${uuid}`} />
      </Head>
      <HighlightDetail />
    </>
  );
}

