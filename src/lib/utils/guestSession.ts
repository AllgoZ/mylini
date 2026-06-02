const COOKIE_KEY = 'session_id'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1]
}

function writeCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0`
}

export function getGuestSessionId(): string {
  const existing = readCookie(COOKIE_KEY)
  if (existing) return existing

  const id = crypto.randomUUID()
  writeCookie(COOKIE_KEY, id, MAX_AGE)
  return id
}

export function clearGuestSessionId(): void {
  deleteCookie(COOKIE_KEY)
}
