import { useState, useEffect, useCallback } from 'react'
import { api } from './api'

// ─── Icônes ───────────────────────────────────────────────────────────────────
const Plus  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const Trash = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
const Edit  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12"/></svg>
const X     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

// ─── Health badge ─────────────────────────────────────────────────────────────
function HealthBadge() {
  const [status, setStatus] = useState(null)   // null | 'ok' | 'error'
  const [dbTime, setDbTime] = useState(null)

  const check = useCallback(async () => {
    try {
      const data = await api.health()
      setStatus('ok')
      setDbTime(new Date(data.db_time).toLocaleTimeString('fr-FR'))
    } catch {
      setStatus('error')
      setDbTime(null)
    }
  }, [])

  useEffect(() => {
    check()
    const t = setInterval(check, 15_000)
    return () => clearInterval(t)
  }, [check])

  const dot = status === 'ok' ? '#4ade80' : status === 'error' ? '#f87171' : '#555'

  return (
    <button className="health" onClick={check} title="Cliquer pour rafraîchir">
      <span className="health-dot" style={{ background: dot }} />
      <span>
        {status === null  && 'connexion…'}
        {status === 'ok'  && `API · DB ${dbTime}`}
        {status === 'error' && 'API injoignable'}
      </span>
    </button>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function NoteCard({ note, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [title,   setTitle]   = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [saving,  setSaving]  = useState(false)

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const updated = await api.updateNote(note.id, { title, content })
      onUpdate(updated)
      setEditing(false)
    } finally { setSaving(false) }
  }

  const cancel = () => {
    setTitle(note.title)
    setContent(note.content)
    setEditing(false)
  }

  const date = new Date(note.updated_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  if (editing) return (
    <div className="card card--edit">
      <input className="input-title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
      <textarea className="input-body" value={content} onChange={e => setContent(e.target.value)} rows={4} />
      <div className="card-actions">
        <button className="btn btn-ghost" onClick={cancel}><X /></button>
        <button className="btn btn-primary" onClick={save} disabled={saving}><Check /></button>
      </div>
    </div>
  )

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-title">{note.title}</span>
        <span className="card-date">{date}</span>
      </div>
      <p className="card-body">{note.content}</p>
      <div className="card-actions">
        <button className="btn btn-ghost" onClick={() => onDelete(note.id)}><Trash /></button>
        <button className="btn btn-ghost" onClick={() => setEditing(true)}><Edit /></button>
      </div>
    </div>
  )
}

// ─── New note ─────────────────────────────────────────────────────────────────
function NewNote({ onCreated }) {
  const [open,    setOpen]    = useState(false)
  const [title,   setTitle]   = useState('')
  const [content, setContent] = useState('')
  const [saving,  setSaving]  = useState(false)

  const submit = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      const note = await api.createNote({ title, content })
      onCreated(note)
      setTitle(''); setContent(''); setOpen(false)
    } finally { setSaving(false) }
  }

  if (!open) return (
    <button className="btn-new" onClick={() => setOpen(true)}>
      <Plus /> Nouvelle note
    </button>
  )

  return (
    <div className="card card--edit">
      <input className="input-title" placeholder="Titre…" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
      <textarea className="input-body" placeholder="Contenu…" value={content} onChange={e => setContent(e.target.value)} rows={4} />
      <div className="card-actions">
        <button className="btn btn-ghost" onClick={() => setOpen(false)}><X /></button>
        <button className="btn btn-primary" onClick={submit} disabled={saving || !title.trim()}><Check /></button>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [notes,   setNotes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    try { setNotes(await api.getNotes()) }
    catch { setError('Impossible de charger les notes.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = note  => setNotes(p => [note, ...p])
  const handleUpdate = note  => setNotes(p => p.map(n => n.id === note.id ? note : n))
  const handleDelete = async id => {
    await api.deleteNote(id)
    setNotes(p => p.filter(n => n.id !== id))
  }

  return (
    <div className="app">

      <header className="header">
        <div className="header-left">
          <span className="logo">notes</span>
          <span className="logo-sub">cloud privé ↔ public</span>
        </div>
        <HealthBadge />
      </header>

      <main className="main">
        <NewNote onCreated={handleCreate} />

        {loading && <p className="msg">Chargement…</p>}
        {error   && <p className="msg msg--error">{error}</p>}
        {!loading && !error && notes.length === 0 && (
          <p className="msg">Aucune note — crée-en une !</p>
        )}

        <div className="grid">
          {notes.map(note => (
            <NoteCard key={note.id} note={note} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))}
        </div>
      </main>

      <footer className="footer">
        public · {import.meta.env.VITE_API_URL || 'http://localhost:3001'}
      </footer>

    </div>
  )
}
