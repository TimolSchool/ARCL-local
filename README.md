# ARCL — Architecture Cloud & Automatisation Terraform

[![GitHub Pages Demo](https://img.shields.io/badge/Demo_En_Ligne-GitHub_Pages-38bdf8?style=for-the-badge&logo=github)](https://TimolSchool.github.io/ARCL-local/)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/Cloud-AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Docker Compose](https://img.shields.io/badge/Container-Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_&_Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React_&_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

> **Projet d'Architecture Cloud & DevOps (EPITA)**  
> Déploiement automatisé d'une infrastructure résiliente et hautement disponible combinant **AWS** (Application Load Balancer, EC2 multi-AZ, Nginx reverse proxy), **OpenStack** (Base de données self-service PostgreSQL), et un **Dashboard Web de pilotage (Terraform Runner UI)**.

---

## 🌐 Démonstration en Ligne Gratuite (GitHub Pages)

Vous pouvez tester l'infrastructure et l'application directement dans votre navigateur sans aucune installation :

👉 **[https://TimolSchool.github.io/ARCL-local/](https://TimolSchool.github.io/ARCL-local/)**

Sur cette page interactive, vous pouvez :
- **Piloter le Terraform Runner** : déclencher `apply`, `destroy`, et allumer/éteindre les instances EC2 en observant les logs en temps réel.
- **Consulter le schéma d'architecture interactif** et les détails réseau (VPC, Subnets, ALB, SG).
- **Tester l'application Notes déployée** (CRUD complet, vérification `/api/health`).

---

## 🏛️ Schéma d'Architecture Multi-Niveaux

```text
┌───────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT / NAVIGATEUR                                 │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │ Requêtes HTTP (:80)
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│               AWS APPLICATION LOAD BALANCER (TheUltimateLoadbalancer)         │
│                     Règle d'écoute : /* ──► Target Group : app-tg             │
└───────────────────────┬───────────────────────────────┬───────────────────────┘
                        │                               │
            Round-Robin │ Port 80                       │ Port 80
                        ▼                               ▼
        ┌───────────────────────────────┐ ┌───────────────────────────────┐
        │       INSTANCE EC2 #1         │ │       INSTANCE EC2 #2         │
        │     Sous-réseau eu-west-3a    │ │     Sous-réseau eu-west-3b    │
        │ ┌───────────────────────────┐ │ │ ┌───────────────────────────┐ │
        │ │ Nginx Reverse Proxy (:80) │ │ │ │ Nginx Reverse Proxy (:80) │ │
        │ └─────────────┬─────────────┘ │ │ └─────────────┬─────────────┘ │
        │               │ Proxy /api/   │ │               │ Proxy /api/   │
        │ ┌─────────────▼─────────────┐ │ │ ┌─────────────▼─────────────┐ │
        │ │ Node.js Express API (:3001)│ │ │ │ Node.js Express API (:3001)│ │
        │ └─────────────┬─────────────┘ │ │ └─────────────┬─────────────┘ │
        └───────────────┼───────────────┘ └───────────────┼───────────────┘
                        │                                 │
                        └───────────────┬─────────────────┘
                                        │ Requêtes SQL (:5432)
                                        ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                    CLUSTER BASE DE DONNÉES (Self-Service)                     │
│                  PostgreSQL 15 provisionné via Terraform                      │
│                     Base : notesdb ── Table : notes                           │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Démarrage en Local sur N'importe Quel PC

Le projet a été adapté pour fonctionner de manière reproductible sur n'importe quel ordinateur (Windows, macOS, Linux).

### Option 1 : Stack Complète avec Docker Compose (Recommandé)

Cette option démarre l'intégralité de la topologie réseau en conteneurs (l'ALB Nginx, les deux instances applicatives EC2, la base de données PostgreSQL et le Terraform Runner UI).

```bash
# 1. Cloner le dépôt
git clone https://github.com/TimolSchool/ARCL-local.git
cd ARCL-local

# 2. Démarrer toute l'architecture en local
docker compose up -d
```

Une fois les conteneurs démarrés :
- 🎛️ **Dashboard Terraform Runner UI** : [http://localhost:8080](http://localhost:8080)
- 🌐 **Application via le Load Balancer (ALB)** : [http://localhost:80](http://localhost:80)
- 🗄️ **Base de données PostgreSQL** : `localhost:5432` (`notesdb` / user: `postgres` / pass: `postgres`)

Pour stopper la stack :
```bash
docker compose down
```

---

### Option 2 : Terraform Runner en Node.js Natif (Sans Docker)

Si vous avez uniquement Node.js installé :

```bash
cd terraform-runner-ui
node server.js
```

Puis ouvrez votre navigateur sur [http://localhost:8080](http://localhost:8080).

> **Note d'exécution** : Si des identifiants AWS réels sont configurés dans votre terminal, le serveur exécute les vraies commandes Terraform sur AWS. Sinon, il active automatiquement le **mode Démo / Simulation** pour permettre une démonstration fluide et sans frais d'infrastructure.

---

## 📂 Structure du Répertoire

```text
ARCL-local/
├── final/                      # Infrastructure AWS (ALB, EC2, Target Groups, User-Data)
│   └── realfinal.tf
├── intermediate/               # Scripts de tests Terraform (ALB + Instances)
│   └── main.tf
├── selfservice-db/             # Infrastructure OpenStack pour la base de données
│   ├── main.tf
│   ├── providers.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── cloud-init-db-1.yaml
│   └── cloud-init-db-2.yaml
├── terraform-runner-ui/        # Dashboard Web Node.js pour orchestrer Terraform
│   ├── server.js
│   ├── README.md
│   └── public/
│       ├── index.html
│       └── app.js
├── app/                        # Code source de l'application déployée
│   ├── backend/                # API REST Express + PostgreSQL
│   │   ├── src/index.js
│   │   ├── init.sql
│   │   └── package.json
│   └── frontend/               # Interface utilisateur React + Vite
│       ├── src/
│       └── package.json
├── docker/                     # Configuration pour la simulation locale Docker
│   ├── Dockerfile.app
│   ├── Dockerfile.runner
│   └── nginx-alb.conf
├── docs/                       # Site statique pour hébergement GitHub Pages
│   └── index.html
├── docker-compose.yml          # Orchestration multi-conteneurs locale
├── .gitignore                  # Exclusion des secrets et artefacts temporaires
└── README.md
```

---

## 🔒 Sécurité et Bonnes Pratiques

- **Zéro Secret en Clair** : Aucun identifiant actif (AWS Access Keys, tokens privés) n'est présent dans ce dépôt. Un modèle `aws_k/AK.example` est fourni à titre indicatif.
- **Isolation Réseau** : En production sur AWS, les Security Groups n'autorisent l'accès HTTP sur les ports applicatifs qu'en provenance de l'Application Load Balancer.
- **Portabilité Totale** : Le projet inclut à la fois les manifestes d'Infrastructure as Code (Terraform) pour le cloud et un environnement Docker Compose pour tester l'architecture en local sans abonnement cloud.

---
