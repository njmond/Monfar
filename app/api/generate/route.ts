import { NextRequest, NextResponse } from 'next/server';
import { getUserPfpUrl } from '@/lib/neynar';
import { generateFromPfp } from '@/lib/image';

export async function POST(req: NextRequest) {
  try {
    const { fid } = await req.json();
    if (!fid) return NextResponse.json({ error: 'Missing fid' }, { status: 400 });

    const pfpUrl = await getUserPfpUrl(fid);
    if (!pfpUrl) return NextResponse.json({ error: 'No PFP found for FID' }, { status: 404 });

    const imageUrl = await generateFromPfp({
      pfpUrl,
      stylePrompt: 'high-quality NFT portrait of a stylized ape, detailed, clean background, no text, no watermark, 1:1'
    });

    if (!imageUrl) return NextResponse.json({ error: 'Image provider failed' }, { status: 502 });

    return NextResponse.json({ imageUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
      }
