import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import { useFirestorePaths } from './useFirestorePaths';

// Payrole HR Management System - Firebase Collection Paths

export const useFirebaseCollections = () => {
  const { userInfo } = useAuth();
  const paths = useFirestorePaths(userInfo?.companyId);

  return {
    collections: paths.collections,
    companyId: paths.companyId,
    companyFilter: paths.companyFilter,
    // Main collection paths for HR system
    usersPath: paths.getUsersPath(),
    employeesPath: paths.getEmployeesPath(),
    payrollPath: paths.getPayrollPath(),
    attendancePath: paths.getAttendancePath(),
    leavePath: paths.getLeavePath(),
    auditLogsPath: paths.getAuditLogsPath(),
    // Optional collections (pending schema confirmation)
    departmentsPath: paths.getDepartmentsPath() || null,
    notificationsPath: paths.getNotificationsPath() || null,
  };
};


