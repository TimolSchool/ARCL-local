const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const api = {
  health:     ()         => req('/api/health'),
  getNotes:   ()         => req('/api/notes'),
  createNote: (body)     => req('/api/notes',      { method: 'POST',   body: JSON.stringify(body) }),
  updateNote: (id, body) => req(`/api/notes/${id}`, { method: 'PUT',    body: JSON.stringify(body) }),
  deleteNote: (id)       => req(`/api/notes/${id}`, { method: 'DELETE' }),
}
