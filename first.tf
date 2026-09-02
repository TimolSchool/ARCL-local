# 1. Déclaration du Provider
provider "aws" {
  region = "eu-west-3"
}

# 2. Utiliser un VPC précis (non-default)
data "aws_vpc" "selected" {
  id = "vpc-03ad6c19b3aa6126c"
}

# 2bis. Récupérer les subnets de ce VPC pour placer les instances dedans
data "aws_subnets" "selected_vpc" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.selected.id]
  }
}

# 2ter. Réutiliser le SG existant (évite InvalidGroup.Duplicate)
data "aws_security_group" "app_arcl_sg" {
  filter {
    name   = "group-name"
    values = ["app-arcl-sg"]
  }

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.selected.id]
  }
}

# 3. Déclaration des ressources EC2
resource "aws_instance" "mes_premiers_serveurs" {
  count                  = 2
  ami                    = "ami-05b5a865c3579bbc4"
  instance_type          = "t3.micro"
  vpc_security_group_ids = [data.aws_security_group.app_arcl_sg.id]
  subnet_id              = element(data.aws_subnets.selected_vpc.ids, count.index)

  # Bootstrap de l'instance: clone, install et déploiement APP_ARCL
  user_data = <<-EOF
              #!/bin/bash
              set -euxo pipefail

              export DEBIAN_FRONTEND=noninteractive

              apt-get update -y
              apt-get install -y git curl nginx postgresql postgresql-contrib

              curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
              apt-get install -y nodejs
              npm install -g pm2

              # Récupère l'IP publique de l'instance pour configurer le frontend.
              TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" || true)
              if [ -n "$TOKEN" ]; then
                EC2_PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/public-ipv4" || true)
              else
                EC2_PUBLIC_IP=$(curl -s "http://169.254.169.254/latest/meta-data/public-ipv4" || true)
              fi
              EC2_PUBLIC_IP=$${EC2_PUBLIC_IP:-localhost}

              mkdir -p /opt
              rm -rf /opt/APP_ARCL
              git clone https://github.com/TimolSchool/APP_ARCL.git /opt/APP_ARCL

              su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='notesdb'\" | grep -q 1 || createdb notesdb"
              su - postgres -c "psql -d notesdb -f /opt/APP_ARCL/backend/init.sql"

              cat > /opt/APP_ARCL/backend/.env << 'ENVBACK'
              # ── PostgreSQL (local sur le cloud privé) ────────────────────────────────────
              DB_HOST=10.0.0.144
              DB_PORT=5432
              DB_NAME=arcl8pp
              DB_USER=arcl_user
              DB_PASSWORD=arcl_password

              # ── API ───────────────────────────────────────────────────────────────────────
              PORT=3001

              # ── CORS : URL exacte de ton frontend (cloud public) ─────────────────────────
              FRONTEND_URL=http://localhost:5173
              ENVBACK
              cp /opt/APP_ARCL/backend/.env /opt/APP_ARCL/backend/.env.example

              cat > /opt/APP_ARCL/frontend/.env << ENVFRONT
              VITE_API_URL=http://$${EC2_PUBLIC_IP}:80
              ENVFRONT
              cp /opt/APP_ARCL/frontend/.env /opt/APP_ARCL/frontend/.env.example

              cd /opt/APP_ARCL/backend
              npm install
              pm2 start src/index.js --name app-arcl-backend
              pm2 save
              pm2 startup systemd -u root --hp /root || true

              cd /opt/APP_ARCL/frontend
              npm install
              npm run build

              rm -rf /var/www/html/*
              cp -r dist/* /var/www/html/

              cat > /etc/nginx/sites-available/default << 'NGINXCONF'
              server {
                listen 80 default_server;
                listen [::]:80 default_server;

                root /var/www/html;
                index index.html;

                location / {
                  try_files $uri /index.html;
                }

                location /api/ {
                  proxy_pass http://127.0.0.1:3001;
                  proxy_http_version 1.1;
                  proxy_set_header Host $host;
                  proxy_set_header X-Real-IP $remote_addr;
                  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                }
              }
              NGINXCONF

              systemctl enable postgresql
              systemctl restart postgresql
              systemctl enable nginx
              systemctl restart nginx
              EOF

  tags = {
    Name = "Serveur-Test-${count.index + 1}"
  }
}

# 4. (Optionnel) Sortie pour vérifier le déploiement
output "instance_details" {
  value = {
    for i in aws_instance.mes_premiers_serveurs : i.tags["Name"] => i.availability_zone
  }
}

output "instance_public_ips" {
  value = aws_instance.mes_premiers_serveurs[*].public_ip
}