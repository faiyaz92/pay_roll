
export enum Role {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  DRIVER = 'driver',
  MANAGER = 'manager'
}

export enum UserType {
  Employee = 'Employee',
  Supplier = 'Supplier',
  Customer = 'Customer',
  Boss = 'Boss',
  ThirdPartyVendor = 'ThirdPartyVendor',
  Contractor = 'Contractor'
}

export interface UserInfo {
  userId: string;
  companyId?: string | null;
  name: string;
  email: string;
  userName: string;
  role: Role;
  userType?: UserType;
  latitude?: number;
  longitude?: number;
  dailyWage?: number;
  mobileNumber?: string;
  businessName?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TenantCompany {
  companyId: string;
  name: string;
  email: string;
  mobileNumber?: string;
  gstin?: string;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  address?: string;
  createdBy: string;
  createdAt: Date;
}
