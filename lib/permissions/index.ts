import type { UserRole } from "@/types";

export const ROLES: Record<UserRole, number> = {
  super_admin: 3,
  admin: 2,
  employee: 1,
};

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLES[userRole] >= ROLES[requiredRole];
}

export function canManageDepartment(role: UserRole): boolean {
  return hasRole(role, "admin");
}

export function canManageUsers(role: UserRole): boolean {
  return hasRole(role, "admin");
}

export function canManageSpiels(role: UserRole): boolean {
  return hasRole(role, "admin");
}

export function canViewSpiels(role: UserRole): boolean {
  return hasRole(role, "employee");
}
