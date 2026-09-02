-- Exécuter une seule fois sur le cloud privé
-- psql -U postgres -f init.sql

CREATE DATABASE notesdb;

\c notesdb

CREATE TABLE IF NOT EXISTS notes (
  id         SERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
