# Notes App — Cloud Privé ↔ Cloud Public

Application minimaliste de gestion de notes pour valider la communication entre deux clouds.

```
┌──────────────────────────┐          ┌───────────────────────────────┐
│      CLOUD PUBLIC        │          │        CLOUD PRIVÉ            │
│                          │          │                               │
│   React + Vite           │──HTTP──▶ │   Express API  (port 3001)    │
│   npm run build          │          │        │                      │
│   → nginx / tout héb.    │          │        ▼                      │
│                          │          │   PostgreSQL   (port 5432)    │
└──────────────────────────┘          └───────────────────────────────┘
```

---

## Prérequis

| Outil       | Version min |
|-------------|-------------|
| Node.js     | 18+         |
| npm         | 9+          |
| PostgreSQL   | 14+         |

---

## 1. Cloud privé — API + PostgreSQL

### Initialiser la base de données

```bash
# Créer la DB et la table
psql -U postgres -f backend/init.sql
```

### Configurer et lancer l'API

```bash
cd backend
npm install

cp .env.example .env
# Éditer .env : DB_HOST, DB_USER, DB_PASSWORD, FRONTEND_URL

npm start          # production
# ou
npm run dev        # développement (nodemon)
```

L'API écoute sur **http://localhost:3001**

---

## 2. Cloud public — Frontend React

```bash
cd frontend
npm install

cp .env.example .env
# Éditer .env : VITE_API_URL=http://<IP-cloud-privé>:3001

npm run dev        # développement → http://localhost:5173
# ou
npm run build      # production → dossier dist/
npm run preview    # prévisualiser le build
```

### Déployer le build (nginx, Apache, Vercel, Netlify…)

```bash
# Exemple nginx — copier dist/ dans le webroot
cp -r dist/* /var/www/html/
```

---

## Variables d'environnement

### Backend (`backend/.env`)
| Variable        | Défaut        | Description                       |
|----------------|---------------|-----------------------------------|
| `DB_HOST`       | `localhost`   | Hôte PostgreSQL                  |
| `DB_PORT`       | `5432`        | Port PostgreSQL                  |
| `DB_NAME`       | `notesdb`     | Nom de la base                   |
| `DB_USER`       | `postgres`    | Utilisateur                      |
| `DB_PASSWORD`   | `postgres`    | Mot de passe                     |
| `PORT`          | `3001`        | Port de l'API Express            |
| `FRONTEND_URL`  | `*`           | Origin autorisée (CORS)          |

### Frontend (`frontend/.env`)
| Variable          | Défaut                  | Description             |
|------------------|-------------------------|-------------------------|
| `VITE_API_URL`   | `http://localhost:3001` | URL de l'API privée     |

---

## Endpoints API

| Méthode | Route             | Description           |
|---------|------------------|-----------------------|
| GET     | `/api/health`    | Santé API + heure DB  |
| GET     | `/api/notes`     | Toutes les notes      |
| GET     | `/api/notes/:id` | Une note              |
| POST    | `/api/notes`     | Créer une note        |
| PUT     | `/api/notes/:id` | Modifier une note     |
| DELETE  | `/api/notes/:id` | Supprimer une note    |

---

## Structure

```
notes-app/
├── README.md
├── backend/
│   ├── .env.example
│   ├── init.sql            ← Script d'init PostgreSQL
│   ├── package.json
│   └── src/
│       └── index.js        ← API Express
└── frontend/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx        ← Point d'entrée React
        ├── App.jsx         ← Composants (CRUD + health)
        ├── api.js          ← Couche appels HTTP
        └── index.css       ← Styles
```
