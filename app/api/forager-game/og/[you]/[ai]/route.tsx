import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(_req: NextRequest, { params }: { params: { you: string; ai: string } }) {
  const youScore = Math.max(0, Math.min(99, parseInt(params.you, 10) || 0));
  const aiScore  = Math.max(0, Math.min(99, parseInt(params.ai,  10) || 0));
  const verdict = youScore > aiScore ? 'I beat the AI' : aiScore > youScore ? 'AI got me' : 'Tied with the AI';
  const accentForUser = youScore > aiScore ? '#ff7300' : '#E8D3BE';
  const accentForAi   = aiScore > youScore ? '#ff7300' : '#E8D3BE';

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 88,
              lineHeight: 1.0,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '-0.02em',
              color: '#ff7300',
            }}
          >
            {verdict}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 64 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 22, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.2em' }}>You</span>
              <span style={{ fontSize: 168, fontWeight: 700, lineHeight: 1, color: accentForUser }}>{youScore}</span>
            </div>
            <span style={{ fontSize: 96, opacity: 0.3 }}>vs</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 22, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.2em' }}>AI</span>
              <span style={{ fontSize: 168, fontWeight: 700, lineHeight: 1, color: accentForAi }}>{aiScore}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, opacity: 0.5, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          <span>Play at homesteaderlabs.com/tools/forager-game/</span>
          <span>WALKING MAN PRO</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
