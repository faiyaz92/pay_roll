import { Role } from "@/types/user";

const ROLE_HOME_ROUTE: Record<Role, string> = {
  [Role.SUPER_ADMIN]: "/super-admin/dashboard",
  [Role.COMPANY_ADMIN]: "/company-admin/overview",
  [Role.HR_MANAGER]: "/hr/overview",
  [Role.EMPLOYEE]: "/employee/home"
};

export const getRoleHomeRoute = (role: Role | null | undefined): string => {
  if (!role) {
    return "/dashboard";
  }

  return ROLE_HOME_ROUTE[role] ?? "/dashboard";
};

export const getRoleLabel = (role: Role): string => {
  switch (role) {
    case Role.SUPER_ADMIN:
      return "Super Administrator";
    case Role.COMPANY_ADMIN:
      return "Company Administrator";
    case Role.HR_MANAGER:
      return "HR Manager";
    case Role.EMPLOYEE:
      return "Employee";
    default:
      return role;
  }
};
