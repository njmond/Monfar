const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY!;
const NEYNAR_BASE = 'https://api.neynar.com/v2';

export async function validateFrameAction(messageBytesInHex: string) {
  const res = await fetch(`${NEYNAR_BASE}/farcaster/frame/validate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'api-key': NEYNAR_API_KEY,
    },
    body: JSON.stringify({ message_bytes_in_hex: messageBytesInHex }),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Neynar validate failed: ${res.status}`);
  return res.json();
}

export async function fetchUserByFid(fid: number) {
  const res = await fetch(`${NEYNAR_BASE}/farcaster/user?fid=${fid}`, {
    headers: { 'api-key': NEYNAR_API_KEY },
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getUserPfpUrl(fid: number): Promise<string | null> {
  const data = await fetchUserByFid(fid);
  const pfp = (data as any)?.user?.pfp_url || (data as any)?.user?.profile?.pfp_url;
  return pfp || null;
    }
