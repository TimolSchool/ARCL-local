# 1. Déclaration du Provider
provider "aws" {
  region = "eu-west-3"
}

# 2. Récupération dynamique des Zones de Disponibilité de la région
data "aws_availability_zones" "available" {
  state = "available"
}

# 3. Déclaration des ressources EC2
resource "aws_instance" "mes_premiers_serveurs" {
  count         = 2
  ami           = "ami-05b5a865c3579bbc4"
  instance_type = "t3.micro"

  # C'est ici que la magie opère :
  # element() permet de boucler sur la liste des AZ si le count est supérieur au nombre d'AZ
  availability_zone = element(data.aws_availability_zones.available.names, count.index)

  tags = {
    Name = "Serveur-Test-${count.index + 1}"
    AZ   = element(data.aws_availability_zones.available.names, count.index)
  }
}

# 4. (Optionnel) Sortie pour vérifier le déploiement
output "instance_details" {
  value = {
    for i in aws_instance.mes_premiers_serveurs : i.tags["Name"] => i.availability_zone
  }
}

##############################################################
# 5. RESSOURCES LOAD BALANCER (TEST)
#    Ajoutées pour test: ALB + Listener + Rule + Target Group
#    AUCUN attachement EC2 volontairement
##############################################################

# Utilisation du VPC par défaut pour simplifier les tests
data "aws_vpc" "default" {
  default = true
}

# Subnets du VPC par défaut
data "aws_subnets" "default_vpc" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

resource "aws_security_group" "alb_test_sg" {
  name        = "alb-test-sg"
  description = "Security group for test ALB"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "alb-test-sg"
  }
}

resource "aws_lb" "test_alb" {
  name               = "alb-arcl-test"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_test_sg.id]
  subnets            = data.aws_subnets.default_vpc.ids

  tags = {
    Name = "alb-arcl-test"
  }
}

resource "aws_lb_target_group" "test_tg" {
  name     = "tg-arcl-test"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    path                = "/"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }

  tags = {
    Name = "tg-arcl-test"
  }
}

resource "aws_lb_listener" "http_80" {
  load_balancer_arn = aws_lb.test_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.test_tg.arn
  }
}

resource "aws_lb_listener_rule" "test_routing" {
  listener_arn = aws_lb_listener.http_80.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.test_tg.arn
  }

  condition {
    path_pattern {
      values = ["/test/*"]
    }
  }
}

output "alb_dns_name" {
  value = aws_lb.test_alb.dns_name
}

output "target_group_arn" {
  value = aws_lb_target_group.test_tg.arn
}
