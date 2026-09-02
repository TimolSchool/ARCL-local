# ARCL â€” Architecture Cloud & Automatisation Terraform

[![GitHub Pages Demo](https://img.shields.io/badge/Demo_En_Ligne-GitHub_Pages-38bdf8?style=for-the-badge&logo=github)](https://TimolSchool.github.io/ARCL-local/)
[![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/Cloud-AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Docker Compose](https://img.shields.io/badge/Container-Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_&_Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/Frontend-React_&_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

> **Projet d'Architecture Cloud & DevOps (EPITA)**  
> DÃ©ploiement automatisÃ© d'une infrastructure rÃ©siliente et hautement disponible combinant **AWS** (Application Load Balancer, EC2 multi-AZ, Nginx reverse proxy), **OpenStack** (Base de donnÃ©es self-service PostgreSQL), et un **Dashboard Web de pilotage (Terraform Runner UI)**.

---

## ðŸŒ DÃ©monstration en Ligne Gratuite (GitHub Pages)

Vous pouvez tester l'infrastructure et l'application directement dans votre navigateur sans aucune installation :

ðŸ‘‰ **[https://TimolSchool.github.io/ARCL-local/](https://TimolSchool.github.io/ARCL-local/)**

Sur cette page interactive, vous pouvez :
- **Piloter le Terraform Runner** : dÃ©clencher `apply`, `destroy`, et allumer/Ã©teindre les instances EC2 en observant les logs en temps rÃ©el.
- **Consulter le schÃ©ma d'architecture interactif** et les dÃ©tails rÃ©seau (VPC, Subnets, ALB, SG).
- **Tester l'application Notes dÃ©ployÃ©e** (CRUD complet, vÃ©rification `/api/health`).

---

## ðŸ›ï¸ SchÃ©ma d'Architecture Multi-Niveaux

```text
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                           CLIENT / NAVIGATEUR                                 â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                        â”‚ RequÃªtes HTTP (:80)
                                        â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚               AWS APPLICATION LOAD BALANCER (TheUltimateLoadbalancer)         â”‚
â”‚                     RÃ¨gle d'Ã©coute : /* â”€â”€â–º Target Group : app-tg             â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                        â”‚                               â”‚
            Round-Robin â”‚ Port 80                       â”‚ Port 80
                        â–¼                               â–¼
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚       INSTANCE EC2 #1         â”‚ â”‚       INSTANCE EC2 #2         â”‚
        â”‚     Sous-rÃ©seau eu-west-3a    â”‚ â”‚     Sous-rÃ©seau eu-west-3b    â”‚
        â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
        â”‚ â”‚ Nginx Reverse Proxy (:80) â”‚ â”‚ â”‚ â”‚ Nginx Reverse Proxy (:80) â”‚ â”‚
        â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
        â”‚               â”‚ Proxy /api/   â”‚ â”‚               â”‚ Proxy /api/   â”‚
        â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚ â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
        â”‚ â”‚ Node.js Express API (:3001)â”‚ â”‚ â”‚ â”‚ Node.js Express API (:3001)â”‚ â”‚
        â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚ â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                        â”‚                                 â”‚
                        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                        â”‚ RequÃªtes SQL (:5432)
                                        â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                    CLUSTER BASE DE DONNÃ‰ES (Self-Service)                     â”‚
â”‚                  PostgreSQL 15 provisionnÃ© via Terraform                      â”‚
â”‚                     Base : notesdb â”€â”€ Table : notes                           â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## ðŸš€ DÃ©marrage en Local sur N'importe Quel PC

Le projet a Ã©tÃ© adaptÃ© pour fonctionner de maniÃ¨re reproductible sur n'importe quel ordinateur (Windows, macOS, Linux).

### Option 1 : Stack ComplÃ¨te avec Docker Compose (RecommandÃ©)

Cette option dÃ©marre l'intÃ©gralitÃ© de la topologie rÃ©seau en conteneurs (l'ALB Nginx, les deux instances applicatives EC2, la base de donnÃ©es PostgreSQL et le Terraform Runner UI).

```bash
# 1. Cloner le dÃ©pÃ´t
git clone https://github.com/TimolSchool/ARCL-local.git
cd ARCL-local

# 2. DÃ©marrer toute l'architecture en local
docker compose up -d
```

Une fois les conteneurs dÃ©marrÃ©s :
- ðŸŽ›ï¸ **Dashboard Terraform Runner UI** : [http://localhost:8080](http://localhost:8080)
- ðŸŒ **Application via le Load Balancer (ALB)** : [http://localhost:80](http://localhost:80)
- ðŸ—„ï¸ **Base de donnÃ©es PostgreSQL** : `localhost:5432` (`notesdb` / user: `postgres` / pass: `postgres`)

Pour stopper la stack :
```bash
docker compose down
```

---

### Option 2 : Terraform Runner en Node.js Natif (Sans Docker)

Si vous avez uniquement Node.js installÃ© :

```bash
cd terraform-runner-ui
node server.js
```

Puis ouvrez votre navigateur sur [http://localhost:8080](http://localhost:8080).

> **Note d'exÃ©cution** : Si des identifiants AWS rÃ©els sont configurÃ©s dans votre terminal, le serveur exÃ©cute les vraies commandes Terraform sur AWS. Sinon, il active automatiquement le **mode DÃ©mo / Simulation** pour permettre une dÃ©monstration fluide et sans frais d'infrastructure.

---

## ðŸ“‚ Structure du RÃ©pertoire

```text
ARCL-local/
â”œâ”€â”€ final/                      # Infrastructure AWS (ALB, EC2, Target Groups, User-Data)
â”‚   â””â”€â”€ realfinal.tf
â”œâ”€â”€ intermediate/               # Scripts de tests Terraform (ALB + Instances)
â”‚   â””â”€â”€ main.tf
â”œâ”€â”€ selfservice-db/             # Infrastructure OpenStack pour la base de donnÃ©es
â”‚   â”œâ”€â”€ main.tf
â”‚   â”œâ”€â”€ providers.tf
â”‚   â”œâ”€â”€ variables.tf
â”‚   â”œâ”€â”€ outputs.tf
â”‚   â”œâ”€â”€ cloud-init-db-1.yaml
â”‚   â””â”€â”€ cloud-init-db-2.yaml
â”œâ”€â”€ terraform-runner-ui/        # Dashboard Web Node.js pour orchestrer Terraform
â”‚   â”œâ”€â”€ server.js
â”‚   â”œâ”€â”€ README.md
â”‚   â””â”€â”€ public/
â”‚       â”œâ”€â”€ index.html
â”‚       â””â”€â”€ app.js
â”œâ”€â”€ app/                        # Code source de l'application dÃ©ployÃ©e
â”‚   â”œâ”€â”€ backend/                # API REST Express + PostgreSQL
â”‚   â”‚   â”œâ”€â”€ src/index.js
â”‚   â”‚   â”œâ”€â”€ init.sql
â”‚   â”‚   â””â”€â”€ package.json
â”‚   â””â”€â”€ frontend/               # Interface utilisateur React + Vite
â”‚       â”œâ”€â”€ src/
â”‚       â””â”€â”€ package.json
â”œâ”€â”€ docker/                     # Configuration pour la simulation locale Docker
â”‚   â”œâ”€â”€ Dockerfile.app
â”‚   â”œâ”€â”€ Dockerfile.runner
â”‚   â””â”€â”€ nginx-alb.conf
â”œâ”€â”€ docs/                       # Site statique pour hÃ©bergement GitHub Pages
â”‚   â””â”€â”€ index.html
â”œâ”€â”€ docker-compose.yml          # Orchestration multi-conteneurs locale
â”œâ”€â”€ .gitignore                  # Exclusion des secrets et artefacts temporaires
â””â”€â”€ README.md
```

---

## ðŸ”’ SÃ©curitÃ© et Bonnes Pratiques

- **ZÃ©ro Secret en Clair** : Aucun identifiant actif (AWS Access Keys, tokens privÃ©s) n'est prÃ©sent dans ce dÃ©pÃ´t. Un modÃ¨le `aws_k/AK.example` est fourni Ã  titre indicatif.
- **Isolation RÃ©seau** : En production sur AWS, les Security Groups n'autorisent l'accÃ¨s HTTP sur les ports applicatifs qu'en provenance de l'Application Load Balancer.
- **PortabilitÃ© Totale** : Le projet inclut Ã  la fois les manifestes d'Infrastructure as Code (Terraform) pour le cloud et un environnement Docker Compose pour tester l'architecture en local sans abonnement cloud.

---

## ðŸ‘¤ Auteur & Contexte

- **Auteur** : Alexis Busson ([@TimolSchool](https://github.com/TimolSchool)) â€” Ã‰tudiant EPITA
- **Projet** : Architecture Cloud (ARCL)
