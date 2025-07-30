
import { useMemo } from 'react';

export const useFirestorePaths = (companyId?: string) => {
  // Define root path constants to match Flutter implementation
  const rootPath = 'Easy2Solutions';
  const companyDirectory = 'companyDirectory';
  const tenantCompanies = 'tenantCompanies';
  const usersCollection = 'users';
  const superAdmins = 'superAdmins';
  const companiesCollection = 'companies';
  const tasksCollection = 'tasks';
  const productCollection = 'products';
  const categoriesCollection = 'categories';
  const subcategoriesCollection = 'subcategories';
  const accountLedgers = 'accountLedgers';
  const transactions = 'transactions';
  const cartsCollection = 'carts';
  const wishlistCollection = 'wishlists';
  
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
    getMaintenanceRecordsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/maintenanceRecords` : '',
    getFuelRecordsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/fuelRecords` : '',
    getExpensesPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/expenses` : '',
    getCustomersPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/customers` : '',
    getBookingsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/bookings` : '',
    getPaymentsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/payments` : '',
    getNotificationsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/notifications` : '',
    getReportsPath: () => companyId ? `${tenantCompaniesPath}/${companyId}/reports` : '',
    
    // General business paths
    getCustomerCompanyPath: (id: string) => `${tenantCompaniesPath}/${id}/${companiesCollection}`,
    getTaskCollectionPath: (id: string) => `${tenantCompaniesPath}/${id}/${tasksCollection}`,
    getProductCollectionPath: (id: string) => `${tenantCompaniesPath}/${id}/${productCollection}`,
    getCategoriesPath: (id: string) => `${tenantCompaniesPath}/${id}/${categoriesCollection}`,
    getSubcategoriesPath: (id: string) => `${tenantCompaniesPath}/${id}/${subcategoriesCollection}`,
    getAccountLedgersPath: (id: string) => `${tenantCompaniesPath}/${id}/${accountLedgers}`,
    getTransactionsPath: (id: string, ledgerId: string) => `${tenantCompaniesPath}/${id}/${accountLedgers}/${ledgerId}/${transactions}`,
    getCartsPath: (id: string) => `${tenantCompaniesPath}/${id}/${cartsCollection}`,
    getWishlistPath: (id: string) => `${tenantCompaniesPath}/${id}/${wishlistCollection}`,
    getStoresPath: (id: string) => `${tenantCompaniesPath}/${id}/stores`,
    getOrdersPath: (id: string) => `${tenantCompaniesPath}/${id}/orders`,
    
    // Taxi booking paths
    getTaxiBookingsPath: (id: string) => `${tenantCompaniesPath}/${id}/taxiBookings`,
    getTaxiTypesPath: (id: string) => `${tenantCompaniesPath}/${id}/settings/taxiBookingSettings/taxiTypes`,
    getTripTypesPath: (id: string) => `${tenantCompaniesPath}/${id}/settings/taxiBookingSettings/tripTypes`,
    getServiceTypesPath: (id: string) => `${tenantCompaniesPath}/${id}/settings/taxiBookingSettings/serviceTypes`,
    getTripStatusesPath: (id: string) => `${tenantCompaniesPath}/${id}/settings/taxiBookingSettings/tripStatuses`,
    
    // Analytics paths
    getVisitorCountersPath: (id: string) => `${tenantCompaniesPath}/${id}/analytics/visitorCounters/daily`,
  }), [companyId, basePath, tenantCompaniesPath]);
};
