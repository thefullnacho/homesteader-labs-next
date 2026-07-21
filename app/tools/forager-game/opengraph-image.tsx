import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Can You Beat the AI? Wild Plant ID Game';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#14110d',
          padding: '72px 88px',
          fontFamily: 'monospace',
          color: '#E8D3BE',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 20,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#ff7300',
          }}
        >
          <div style={{ width: 14, height: 14, background: '#ff7300' }} />
          Homesteader Labs · Forager Game
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 108,
              lineHeight: 0.98,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}
          >
            <span>Can you beat</span>
            <span style={{ color: '#ff7300' }}>the AI?</span>
          </div>
          <div style={{ display: 'flex', fontSize: 26, opacity: 0.6, letterSpacing: '0.04em' }}>
            10 rounds · Real species · WALKING MAN PRO vision model
          </div>
        </div>

        <div style={{ display: 'flex', gap: 32, fontSize: 18, opacity: 0.5, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          <span>Berries · Mushrooms · Psilocybes · Medicinals</span>
        </div>
      </div>
    ),
    size,
  );
}
