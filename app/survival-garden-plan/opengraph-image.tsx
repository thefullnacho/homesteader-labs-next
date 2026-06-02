import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Survival Garden Plan — personalized for your zone';
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
          Homesteader Labs · Survival Garden Plan
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 96,
              lineHeight: 1.0,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
            }}
          >
            <span>A garden plan</span>
            <span style={{ color: '#ff7300' }}>calibrated to your zone.</span>
          </div>
          <div style={{ display: 'flex', fontSize: 26, opacity: 0.6, letterSpacing: '0.04em' }}>
            Zone-specific · Calorie-optimized · Personalized PDF · $19
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 32,
            fontSize: 18,
            opacity: 0.5,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}
        >
          <span>Layout grid · Sowing schedule · Companion pairings · Seed list</span>
        </div>
      </div>
    ),
    size,
  );
}
