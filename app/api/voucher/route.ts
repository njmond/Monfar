import { NextRequest, NextResponse } from 'next/server';
import { validateFrameAction, fetchUserByFid } from '@/lib/neynar';
import { uploadJsonToIpfs, uploadImageFromUrlToIpfs } from '@/lib/ipfs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messageBytesInHex = body?.trustedData?.messageBytes || body?.untrustedData?.messageBytes;

    // Dev/testing fallback: tanpa Warpcast, izinkan fid manual (jangan aktifkan di production)
    if (!messageBytesInHex && process.env.NODE_ENV !== 'production') {
      const fid = Number(body?.fid || 0);
      if (!fid) return NextResponse.json({ error: 'No message bytes (use frame) or provide fid for local test' }, { status: 400 });

      const evmAddr = process.env.TEST_EVM_ADDR;
      if (!evmAddr) return NextResponse.json({ error: 'Set TEST_EVM_ADDR for local test' }, { status: 400 });

      const imgRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fid })
      });
      if (!imgRes.ok) return NextResponse.json({ error: 'Image generation failed' }, { status: 502 });
      const { imageUrl } = await imgRes.json();

      const imageCid = await uploadImageFromUrlToIpfs(imageUrl);
      if (!imageCid) return NextResponse.json({ error: 'IPFS image upload failed' }, { status: 502 });

      const metadata = {
        name: process.env.NFT_NAME || 'Monkey Far App',
        description: process.env.NFT_DESCRIPTION || 'Generated from your Farcaster PFP (ape-inspired)',
        image: `ipfs://${imageCid}`,
        attributes: []
      };
      const metadataCid = await uploadJsonToIpfs(metadata);
      if (!metadataCid) return NextResponse.json({ error: 'IPFS metadata upload failed' }, { status: 502 });
      const metadataUri = `ipfs://${metadataCid}`;

      const { ethers } = await import('ethers');
      const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY!;
      const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;
      const wallet = new ethers.Wallet(SIGNER_PRIVATE_KEY);

      const DOMAIN = { name: 'BaseApeVoucher', version: '1', chainId: 8453, verifyingContract: CONTRACT_ADDRESS };
      const types = { Voucher: [
        { name: 'recipient', type: 'address' },
        { name: 'uri', type: 'string' },
        { name: 'nonce', type: 'uint256' },
      ]};

      const voucher = { recipient: evmAddr, uri: metadataUri, nonce: Date.now() };
      const signature = await (wallet as any)._signTypedData(DOMAIN, types, voucher);

      return NextResponse.json({ voucher, signature, mintPrice: process.env.MINT_PRICE_WEI });
    }

    // Production frame flow
    const verification = await validateFrameAction(messageBytesInHex);
    if (!verification?.valid) return NextResponse.json({ error: 'Invalid frame action' }, { status: 401 });

    const interactor = verification?.action?.interactor;
    const fid: number | undefined = interactor?.fid;
    const evmAddr: string | undefined = interactor?.verified_addresses?.eth_addresses?.[0];
    if (!fid || !evmAddr) return NextResponse.json({ error: 'Missing FID or address' }, { status: 400 });

    const user = await fetchUserByFid(fid);
    const isPowerBadge = !!user?.user?.power_badge; // proxy for "Pro"
    const allowlist = (process.env.PRO_FID_ALLOWLIST || '').split(',').map(s=>s.trim()).filter(Boolean);
    if (!(isPowerBadge || allowlist.includes(String(fid)))) {
      return NextResponse.json({ error: 'Mint restricted to Farcaster Pro users' }, { status: 403 });
    }

    const imgRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/generate`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fid })
    });
    if (!imgRes.ok) return NextResponse.json({ error: 'Image generation failed' }, { status: 502 });
    const { imageUrl } = await imgRes.json();

    const imageCid = await uploadImageFromUrlToIpfs(imageUrl);
    if (!imageCid) return NextResponse.json({ error: 'IPFS image upload failed' }, { status: 502 });

    const metadata = {
      name: process.env.NFT_NAME || 'Monkey Far App',
      description: process.env.NFT_DESCRIPTION || 'Generated from your Farcaster PFP (ape-inspired)',
      image: `ipfs://${imageCid}`,
      attributes: []
    };
    const metadataCid = await uploadJsonToIpfs(metadata);
    if (!metadataCid) return NextResponse.json({ error: 'IPFS metadata upload failed' }, { status: 502 });
    const metadataUri = `ipfs://${metadataCid}`;

    const { ethers } = await import('ethers');
    const SIGNER_PRIVATE_KEY = process.env.SIGNER_PRIVATE_KEY!;
    const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;
    const wallet = new ethers.Wallet(SIGNER_PRIVATE_KEY);

    const DOMAIN = { name: 'BaseApeVoucher', version: '1', chainId: 8453, verifyingContract: CONTRACT_ADDRESS };
    const types = { Voucher: [
      { name: 'recipient', type: 'address' },
      { name: 'uri', type: 'string' },
      { name: 'nonce', type: 'uint256' },
    ]};

    const voucher = { recipient: evmAddr, uri: metadataUri, nonce: Date.now() };
    const signature = await (wallet as any)._signTypedData(DOMAIN, types, voucher);

    return NextResponse.json({ voucher, signature, mintPrice: process.env.MINT_PRICE_WEI });
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
                         }
