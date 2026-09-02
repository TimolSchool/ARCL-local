# Terraform Runner UI

Mini frontend local pour lancer `terraform apply` sur le dossier Terraform `../final`.

## Lancer (portable)

Depuis la racine du projet :

```bash
cd terraform-runner-ui
node server.js
```

Puis ouvrir :

- [http://localhost:8080](http://localhost:8080)

## Comportement

- Le bouton **Apply** appelle `POST /api/apply`.
- Le bouton **Destroy** appelle `POST /api/destroy` (avec confirmation navigateur).
- Le bouton **Apply selfservice-db** appelle `POST /api/db/apply`.
- Le bouton **Destroy selfservice-db** appelle `POST /api/db/destroy` (avec confirmation navigateur).
- Le bouton **Demarrer les instances** appelle `POST /api/start-instances`.
- Le bouton **Stopper les instances** appelle `POST /api/stop-instances`.
- Les boutons **Demarrer/Stopper** ne sont pas visibles en meme temps :
  - `Demarrer` s'affiche quand les instances sont `stopped` (ou absentes),
  - `Stopper` s'affiche quand les instances sont `running` (ou etat mixte).
- Le serveur exécute, dans `../final` :
  - `terraform init -input=false`
  - puis `terraform apply -auto-approve -input=false` ou `terraform destroy -auto-approve -input=false`
- Pour la DB self-service, le serveur exécute les memes commandes dans `../selfservice-db`.
- Les actions start/stop visent les instances taggées `Name=app-ec2-1` et `Name=app-ec2-2`.
- Les logs sont renvoyés dans la réponse et affichés dans la page.

## Prérequis

- `node` installé (Node.js 18+ recommandé)
- `terraform` installé et accessible dans le `PATH`
- identifiants AWS valides dans l'environnement local (variables d'environnement, profil AWS CLI, SSO, etc.)

## Structure attendue

Le serveur suppose cette arborescence relative :

```text
<racine-projet>/
  final/
    realfinal.tf
  selfservice-db/
    main.tf
    providers.tf
    variables.tf
  terraform-runner-ui/
    server.js
    public/
```
