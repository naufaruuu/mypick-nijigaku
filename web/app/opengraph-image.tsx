import { ImageResponse } from 'next/og';
import { MEMBER_COLORS } from '@/lib/layout';

// Default share-preview image for every route (inherited unless a closer
// opengraph-image overrides it). Rendered at request time by next/og.
export const alt = 'My Pick Nijigasaki';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function Rainbow() {
  return (
    <div style={{ display: 'flex', width: '100%', height: 20 }}>
      {MEMBER_COLORS.map((c, i) => (
        <div key={i} style={{ flex: 1, background: c }} />
      ))}
    </div>
  );
}

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#faf7ef',
        }}
      >
        <Rainbow />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 80px',
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: 14,
              color: '#26215c',
              textAlign: 'center',
            }}
          >
            MY PICK NIJIGASAKI
          </div>
          <div style={{ fontSize: 32, color: '#6b5a00', marginTop: 28, textAlign: 'center' }}>
            Pick your favorite Nijigasaki songs · share your grid
          </div>
        </div>
        <Rainbow />
      </div>
    ),
    { ...size },
  );
}
