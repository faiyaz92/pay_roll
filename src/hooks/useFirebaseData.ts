import { useAuth } from '@/contexts/AuthContext';
import { useFirestorePaths } from './useFirestorePaths';

// Payrole HR Management System - Firebase Collection Paths

export const useFirebaseCollections = () => {
  const { userInfo } = useAuth();
  const paths = useFirestorePaths(userInfo?.companyId);

  return {
    // Main collection paths for HR system
    usersPath: paths.getUsersPath(),
    employeesPath: paths.getEmployeesPath(),
    payrollPath: paths.getPayrollPath(),
    attendancePath: paths.getAttendancePath(),
    leavePath: paths.getLeavePath(),
    departmentsPath: paths.getDepartmentsPath(),
    notificationsPath: paths.getNotificationsPath(),
    auditLogsPath: paths.getAuditLogsPath(),
  };
};


