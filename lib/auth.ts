const COOKIE_NAME = 'admin-auth-token'
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24시간
const PAYLOAD = 'admin'

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function getKey(secret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret)
  return crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ])
}

async function signToken(secret: string): Promise<string> {
  const key = await getKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(PAYLOAD))
  return uint8ArrayToBase64Url(new Uint8Array(sig))
}

async function verifyToken(token: string, secret: string): Promise<boolean> {
  const key = await getKey(secret)
  const data = base64UrlToUint8Array(token)
  return crypto.subtle.verify('HMAC', key, data.buffer as ArrayBuffer, new TextEncoder().encode(PAYLOAD))
}

export { COOKIE_NAME, COOKIE_MAX_AGE, signToken, verifyToken }
