// IPFS helper via Web3.Storage (prioritas) atau Pinata (fallback)

export async function uploadJsonToIpfs(obj: any): Promise<string | null> {
  const w3 = process.env.WEB3STORAGE_TOKEN;
  if (w3) {
    const res = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${w3}` },
      body: new Blob([JSON.stringify(obj)], { type: 'application/json' }) as any,
    });
    if (!res.ok) return null;
    const out = await res.json();
    return out?.cid || null;
  }
  const pinata = process.env.PINATA_JWT;
  if (pinata) {
    const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${pinata}`,
      },
      body: JSON.stringify({ pinataContent: obj }),
    });
    if (!res.ok) return null;
    const out = await res.json();
    return out?.IpfsHash || null;
  }
  return null;
}

export async function uploadImageFromUrlToIpfs(url: string): Promise<string | null> {
  const img = await fetch(url);
  if (!img.ok) return null;
  const blob = await img.blob();
  const file = new File([blob], 'image.png', { type: blob.type || 'image/png' });

  const w3 = process.env.WEB3STORAGE_TOKEN;
  if (w3) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('https://api.web3.storage/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${w3}` },
      body: fd as any,
    });
    if (!res.ok) return null;
    const out = await res.json();
    return out?.cid || null;
  }
  const pinata = process.env.PINATA_JWT;
  if (pinata) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: { Authorization: `Bearer ${pinata}` },
      body: fd as any,
    });
    if (!res.ok) return null;
    const out = await res.json();
    return out?.IpfsHash || null;
  }
  return null;
    }
