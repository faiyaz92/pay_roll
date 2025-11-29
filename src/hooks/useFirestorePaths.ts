
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
    
    // HR/Payroll specific paths for current company
    getUsersPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/users` : '',
    getEmployeesPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/employees` : '',
    getPayrollPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/payroll` : '',
    getAttendancePath: () => companyId ? `${tenantCompaniesPath}/${companyId}/attendance` : '',
    getLeavePath: () => companyId ? `${tenantCompaniesPath}/${companyId}/leave` : '',
    getDepartmentsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/departments` : '',
    getNotificationsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/notifications` : '',
    getAuditLogsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/auditLogs` : '',
    
  }), [companyId, basePath, tenantCompaniesPath]);
};
