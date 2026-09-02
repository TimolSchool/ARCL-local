resource "openstack_compute_instance_v2" "db1" {
  provider    = openstack.os1
  name        = var.db1_name
  image_name  = var.image_name
  flavor_name = var.flavor_name
  key_pair = var.keypair_name_db1
  security_groups = ["default", "allow-ssh-icmp"]

  # réseau interne (10.x)
  network {
    name = "internal-net"
  }

  # réseau external (172.x)
  network {
    name        = "external-net"
    fixed_ip_v4 = var.db1_ip
  }
  user_data = file("${path.module}/cloud-init-db-1.yaml")
}

resource "openstack_compute_instance_v2" "db2" {
  provider    = openstack.os2
  name        = var.db2_name
  image_name  = var.image_name
  flavor_name = var.flavor_name
  key_pair = var.keypair_name_db2
  security_groups = ["default", "allow-ssh-icmp"]

  # réseau interne (10.x)
  network {
    name = "internal-net"
  }

  # réseau external (172.x)
  network {
    name        = "external-net"
    fixed_ip_v4 = var.db2_ip
  }

  user_data = file("${path.module}/cloud-init-db-2.yaml")
}
