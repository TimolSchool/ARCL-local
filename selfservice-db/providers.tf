terraform {
  required_providers {
    openstack = {
      source  = "terraform-provider-openstack/openstack"
      version = "~> 3.0"
    }
  }
}

provider "openstack" {
  alias = "os1"
  cloud = "kolla-openstack-1"
}

provider "openstack" {
  alias = "os2"
  cloud = "kolla-openstack-2"
}
