provider "aws" {
  region = var.aws_region
}

data "aws_vpc" "selected" {
  id = var.vpc_id
}

data "aws_lb" "existing_alb" {
  name = var.alb_name
}

data "aws_lb_listener" "http_80" {
  load_balancer_arn = data.aws_lb.existing_alb.arn
  port              = 80
}

resource "aws_security_group" "app_sg" {
  name_prefix = "app-arcl-"
  description = "Allow ALB to reach app instances"
  vpc_id      = data.aws_vpc.selected.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = data.aws_lb.existing_alb.security_groups
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_cidr_blocks
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "app" {
  count                       = 2
  ami                         = var.ami_id
  instance_type               = var.instance_type
  subnet_id                   = var.subnet_ids[count.index]
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  associate_public_ip_address = true

  # Recreate instances when bootstrap changes.
  user_data_replace_on_change = true

  lifecycle {
    create_before_destroy = true
  }

  user_data = <<-EOF
              #!/bin/bash
              set -euxo pipefail
              exec > >(tee /var/log/user-data-bootstrap.log) 2>&1

              export DEBIAN_FRONTEND=noninteractive

              apt-get update -y
              apt-get install -y git curl nginx postgresql postgresql-contrib

              curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
              apt-get install -y nodejs
              npm install -g pm2

              systemctl enable postgresql
              systemctl start postgresql
              su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres_password';\"" || true
              systemctl restart postgresql

              TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" || true)
              if [ -n "$TOKEN" ]; then
                EC2_PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/public-ipv4" || true)
              else
                EC2_PUBLIC_IP=$(curl -s "http://169.254.169.254/latest/meta-data/public-ipv4" || true)
              fi
              EC2_PUBLIC_IP=$${EC2_PUBLIC_IP:-localhost}

              for i in $(seq 1 60); do getent hosts github.com >/dev/null 2>&1 && break; sleep 5; done

              mkdir -p /opt
              REPO_URL="https://github.com/TimolSchool/APP_ARCL.git"
              for attempt in 1 2 3 4 5 6 7 8; do
                rm -rf /opt/APP_ARCL
                git clone "$REPO_URL" /opt/APP_ARCL && break
                sleep $((attempt * 15))
              done
              test -f /opt/APP_ARCL/backend/init.sql

              su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='notesdb'\" | grep -q 1 || createdb notesdb"
              su - postgres -c "psql -d notesdb -f /opt/APP_ARCL/backend/init.sql"

              cat >/opt/APP_ARCL/backend/.env <<ENVBACK
              DB_HOST=10.200.0.2
              DB_PORT=5433
              DB_USER=postgres
              DB_PASSWORD=postgres-password
              DB_NAME=postgres
              PORT=3001
              FRONTEND_URL=http://${data.aws_lb.existing_alb.dns_name}
              ENVBACK
              cp /opt/APP_ARCL/backend/.env /opt/APP_ARCL/backend/.env.example

              cat >/opt/APP_ARCL/frontend/.env <<ENVFRONT
              VITE_API_URL=http://${data.aws_lb.existing_alb.dns_name}
              ENVFRONT
              cp /opt/APP_ARCL/frontend/.env /opt/APP_ARCL/frontend/.env.example

              cd /opt/APP_ARCL/backend
              npm install
              # Keep PM2 state in /root/.pm2 to match the systemd startup service.
              export HOME=/root
              export PM2_HOME=/root/.pm2
              pm2 delete app-arcl-backend 2>/dev/null || true
              pm2 start src/index.js --name app-arcl-backend
              pm2 save
              pm2 startup systemd -u root --hp /root || true

              cd /opt/APP_ARCL/frontend
              npm install
              npm run build

              rm -rf /var/www/html/*
              cp -r dist/* /var/www/html/

              cat >/etc/nginx/sites-available/default <<'NGINXCONF'
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

              systemctl enable nginx
              systemctl restart nginx
              EOF

  tags = {
    Name = "app-ec2-${count.index + 1}"
  }
}

resource "aws_lb_target_group" "app_tg" {
  name_prefix = "app-"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.selected.id

  health_check {
    path = "/"
  }
}

resource "aws_lb_target_group_attachment" "app_attach" {
  count            = 2
  target_group_arn = aws_lb_target_group.app_tg.arn
  target_id        = aws_instance.app[count.index].id
  port             = 80
}

resource "aws_lb_listener_rule" "app_rule" {
  listener_arn = data.aws_lb_listener.http_80.arn
  priority     = var.listener_rule_priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }

  condition {
    path_pattern {
      values = [var.listener_path_pattern]
    }
  }
}

variable "aws_region" {
  type    = string
  default = "eu-west-3"
}

variable "vpc_id" {
  type    = string
  default = "vpc-03ad6c19b3aa6126c"
}

variable "alb_name" {
  type    = string
  default = "TheUltimateLoadbalancer"
}

variable "subnet_ids" {
  type    = list(string)
  default = ["subnet-016d2907c7fa7c9fd", "subnet-0fd1e6df31a42d1de"]

  validation {
    condition     = length(var.subnet_ids) == 2
    error_message = "Provide exactly 2 subnet IDs."
  }
}

variable "ami_id" {
  type    = string
  default = "ami-05b5a865c3579bbc4"
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "ssh_cidr_blocks" {
  type    = list(string)
  default = ["0.0.0.0/0"]
}

variable "listener_rule_priority" {
  type    = number
  default = null
}

variable "listener_path_pattern" {
  type    = string
  default = "/*"
}

output "instance_public_ips" {
  value = aws_instance.app[*].public_ip
}

output "alb_url" {
  value = "http://${data.aws_lb.existing_alb.dns_name}"
}

