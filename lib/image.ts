// OpenAI Images (edits) adapter — tidak menambah watermark.
// TIDAK melakukan penghapusan watermark/logo pihak ketiga.

export async function generateFromPfp({ pfpUrl, stylePrompt }: { pfpUrl: string; stylePrompt: string }): Promise<string | null> {
  const provider = process.env.IMAGE_PROVIDER || 'OPENAI';
  if (provider === 'OPENAI') return generateOpenAI({ pfpUrl, stylePrompt });
  return pfpUrl; // fallback
}

async function generateOpenAI({ pfpUrl, stylePrompt }: { pfpUrl: string; stylePrompt: string }): Promise<string | null> {
  try {
    const apiKey = process.env.OPENAI_API_KEY!;
    if (!apiKey) return null;

    const imgRes = await fetch(pfpUrl);
    if (!imgRes.ok) return null;
    const arrayBuffer = await imgRes.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'image/png' });

    const form = new FormData();
    form.append('image', blob as any, 'pfp.png');
    form.append('prompt', `${stylePrompt}`);
    form.append('size', '1024x1024');
    form.append('response_format', 'url');

    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form as any,
    });
    if (!res.ok) return null;
    const out = await res.json();
    return out?.data?.[0]?.url || null;
  } catch {
    return null;
  }
}
