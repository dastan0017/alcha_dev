import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const revalidate = 86400;

async function loadFont(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Golos+Text:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
    const match = css.match(/src: url\((https:[^)]+)\) format/);
    if (!match) return null;
    return await (await fetch(match[1]).then((r) => r.arrayBuffer()));
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get('title') || 'alcha.dev').slice(0, 120);
  const glyphs = `${title}alcha.dev САЙТЫ CRM ПОД КЛЮЧ Bishkek Kyrgyzstan`;

  const [regular, bold] = await Promise.all([loadFont(500, glyphs), loadFont(800, glyphs)]);
  const fonts: { name: string; data: ArrayBuffer; weight: number; style: string }[] = [];
  if (regular) fonts.push({ name: 'Golos', data: regular, weight: 500, style: 'normal' });
  if (bold) fonts.push({ name: 'Golos', data: bold, weight: 800, style: 'normal' });
  const fontFamily = fonts.length ? 'Golos' : 'sans-serif';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#17121F',
          padding: 72,
          fontFamily,
        }}
      >
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 800 }}>
          <span style={{ color: '#ffffff' }}>alcha</span>
          <span style={{ color: '#C4B0FF' }}>.dev</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: 4, color: '#C4B0FF' }}>
            САЙТЫ · CRM · ПОД КЛЮЧ
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.05,
              marginTop: 20,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: 20, color: '#A99FB8' }}>Bishkek · Kyrgyzstan</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fonts: fonts.length ? (fonts as any) : undefined,
    },
  );
}
