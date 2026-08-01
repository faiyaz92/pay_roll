/**
 * Create Employee Page
 * Uses EmployeeForm component to create new employees
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import EmployeeForm from '../components/Forms/EmployeeForm';
import { useEmployeeStore, useAuthStore } from '../stores';
import type { EmployeeInput } from '../types/employee';

export default function CreateEmployee() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userInfo, firebaseUser } = useAuthStore();
  const { createNewEmployee, loading } = useEmployeeStore();

  const handleSubmit = async (data: EmployeeInput) => {
    if (!userInfo?.companyId || !firebaseUser?.uid) {
      toast.error(t('employee.errors.noCompanyId'));
      return;
    }

    try {
      // Note: In the real implementation, we would first create the user account
      // via the onboarding flow. For now, we'll use a placeholder userId.
      const userId = `user_${Date.now()}`;
      
      const employeeId = await createNewEmployee(
        userInfo.companyId,
        userId,
        data,
        firebaseUser.uid
      );

      toast.success(t('employee.messages.createSuccess'));
      navigate(`/hr/employees/${employeeId}`);
    } catch (error) {
      console.error('Failed to create employee:', error);
      toast.error(t('employee.errors.createFailed'));
    }
  };

  return <EmployeeForm onSubmit={handleSubmit} loading={loading} />;
}
