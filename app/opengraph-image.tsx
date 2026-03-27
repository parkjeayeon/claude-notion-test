import { ImageResponse } from 'next/og'

export const alt = 'StarterKit'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        color: '#fff',
        fontSize: 64,
        fontWeight: 700,
      }}
    >
      <span>StarterKit</span>
      <span style={{ fontSize: 28, opacity: 0.7, marginTop: 16 }}>
        A modern Next.js starter kit
      </span>
    </div>,
    { ...size },
  )
}
