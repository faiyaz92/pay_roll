
import { useMemo } from 'react';
import { FIREBASE_COLLECTIONS, type FirebaseCollectionKey } from '@/config/firebaseCollections';

interface CompanyFilter {
  field: 'companyId';
  operator: '==';
  value: string;
}

export const useFirestorePaths = (companyId?: string) => {
  return useMemo(() => {
    const companyFilter: CompanyFilter | null = companyId
      ? { field: 'companyId', operator: '==', value: companyId }
      : null;

    const getCollection = (key: FirebaseCollectionKey) => FIREBASE_COLLECTIONS[key];

    const buildScopedCollection = (key: FirebaseCollectionKey) => ({
      collection: FIREBASE_COLLECTIONS[key],
      companyFilter
    });

    return {
      collections: FIREBASE_COLLECTIONS,
      companyId,
      companyFilter,
      getCollection,
      getScopedCollection: buildScopedCollection,

      // Core collections used across modules (follow Database-Info references)
      getUsersPath: () => FIREBASE_COLLECTIONS.users,
      getEmployeesPath: () => FIREBASE_COLLECTIONS.employees,
      getPayrollPath: () => FIREBASE_COLLECTIONS.payrollCycles,
      getAttendancePath: () => FIREBASE_COLLECTIONS.attendanceRecords,
      getLeavePath: () => FIREBASE_COLLECTIONS.leaveRequests,
      getAuditLogsPath: () => FIREBASE_COLLECTIONS.auditLogs,

      // Placeholders for future collections pending schema confirmation
      getDepartmentsPath: () => '',
      getNotificationsPath: () => ''
    };
  }, [companyId]);
};
