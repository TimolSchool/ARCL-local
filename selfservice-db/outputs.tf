output "db_instances" {
  value = {
    db1 = {
      name = var.db1_name
      ip   = var.db1_ip
      cloud = "kolla-openstack-1"
    }

    db2 = {
      name = var.db2_name
      ip   = var.db2_ip
      cloud = "kolla-openstack-2"
    }
  }
}
