async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store', ...options })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? `Request failed: ${res.status}`)
  return json.data as T
}

export { apiFetch }
