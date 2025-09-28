
import { useMemo } from 'react';

export const useFirestorePaths = (companyId?: string) => {
  // Define root path constants to match Flutter implementation
  const rootPath = 'Easy2Solutions';
  const companyDirectory = 'companyDirectory';
  const tenantCompanies = 'tenantCompanies';
  const usersCollection = 'users';
  const superAdmins = 'superAdmins';
  
  const basePath = `${rootPath}/${companyDirectory}`;
  const tenantCompaniesPath = `${basePath}/${tenantCompanies}`;

  return useMemo(() => ({
    // Base paths
    basePath,
    superAdminPath: `${basePath}/${superAdmins}`,
    commonUsersPath: `${basePath}/${usersCollection}`,
    tenantCompaniesPath,
    
    // Tenant company specific paths
    getTenantCompanyPath: (id: string) => `${tenantCompaniesPath}/${id}`,
    getTenantUsersPath: (id: string) => `${tenantCompaniesPath}/${id}/${usersCollection}`,
    getTenantUserPath: (companyId: string, userId: string) => 
      `${tenantCompaniesPath}/${companyId}/${usersCollection}/${userId}`,
    
    // Car Rental specific paths for current company (following BRD structure)
    getUsersPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/users` : '',
    getVehiclesPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/vehicles` : '',
    getAssignmentsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/assignments` : '',
    getExpensesPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/expenses` : '',
    getPaymentsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/payments` : '',
    getReportsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/reports` : '',
    getSettingsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/settings` : '',
    getAuditLogsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/auditLogs` : '',
    getFuelRecordsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/fuelRecords` : '',
    getMaintenanceRecordsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/maintenanceRecords` : '',
    
    // Vehicle subcollection paths
    getOdometerHistoryPath: (vehicleId: string) => 
      companyId ? `${tenantCompaniesPath}/${companyId}/vehicles/${vehicleId}/odometerHistory` : '',
    
  }), [companyId, basePath, tenantCompaniesPath]);
};
