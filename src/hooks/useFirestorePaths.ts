
import { useMemo } from 'react';

export const useFirestorePaths = (companyId?: string) => {
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
    
    // Transportation specific paths for current company
    getDriversPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/drivers` : '',
    getVehiclesPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/vehicles` : '',
    getTripsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/trips` : '',
    getCitiesPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/cities` : '',
    getRoutesPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/routes` : '',
  }), [companyId, basePath, tenantCompaniesPath]);
};
