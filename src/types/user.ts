
export enum Role {
  SUPER_ADMIN = 'super_admin',
  COMPANY_ADMIN = 'company_admin',
  DRIVER = 'driver',
  MANAGER = 'manager',
  DISPATCHER = 'dispatcher',
  FLEET_MANAGER = 'fleet_manager',
  MAINTENANCE_MANAGER = 'maintenance_manager',
  ACCOUNTANT = 'accountant',
  CUSTOMER = 'customer'
}

export enum UserType {
  Employee = 'Employee',
  Driver = 'Driver',
  Manager = 'Manager',
  Dispatcher = 'Dispatcher',
  FleetManager = 'FleetManager',
  MaintenanceManager = 'MaintenanceManager',
  Accountant = 'Accountant',
  Supplier = 'Supplier',
  Customer = 'Customer',
  Contractor = 'Contractor'
}

export enum TenantCompanyType {
  TRANSPORTATION = 'Transportation',
  LOGISTICS = 'Logistics',
  DELIVERY = 'Delivery',
  RETAIL = 'Retail'
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
  // Transportation specific fields
  licenseNumber?: string;
  vehicleAssigned?: string;
  employeeId?: string;
  department?: string;
  isActive?: boolean;
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
  companyType: TenantCompanyType;
  // Transportation specific fields
  fleetSize?: number;
  operatingLicense?: string;
  insuranceDetails?: string;
}
