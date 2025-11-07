export const metadata = {
  title: "Monkey Far App",
  openGraph: {
    title: "Monkey Far App — Mint on Base",
    description: "Farcaster Pro only • 2500 supply • Pay mint fee only",
    images: [`${process.env.NEXT_PUBLIC_BASE_URL}/og.png`]
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:button:1": "Mint",
    "fc:frame:post_url": `${process.env.NEXT_PUBLIC_BASE_URL}/api/voucher`
  }
};

export default function Page() {
  return (
    <main style={{ fontFamily: 'ui-sans-serif', padding: 24 }}>
      <h1>Monkey Far App</h1>
      <p>Farcaster Pro only • 2500 supply • Mint on Base mainnet.</p>
      <p>Post URL ini di Warpcast untuk menampilkan Frame.</p>
    </main>
  );
  }
