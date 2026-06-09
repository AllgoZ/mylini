async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store', ...options })
  let json: any
  try {
    json = await res.json()
  } catch {
    throw new Error(`Server error (${res.status}). Check server logs or try refreshing.`)
  }
  if (!res.ok || json.error) throw new Error(json.error ?? `Request failed: ${res.status}`)
  return json.data as T
}

export { apiFetch }
