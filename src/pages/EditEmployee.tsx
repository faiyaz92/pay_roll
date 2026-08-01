/**
 * Edit Employee Page
 * Uses EmployeeForm component to edit existing employees
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import EmployeeForm from '../components/Forms/EmployeeForm';
import { useEmployeeStore, useAuthStore } from '../stores';
import type { EmployeeInput } from '../types/employee';

export default function EditEmployee() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { employeeId } = useParams<{ employeeId: string }>();
  const { firebaseUser } = useAuthStore();
  const { selectedEmployee, fetchEmployeeById, updateEmployeeData, loading } = useEmployeeStore();

  useEffect(() => {
    if (employeeId) {
      fetchEmployeeById(employeeId);
    }
  }, [employeeId]);

  const handleSubmit = async (data: EmployeeInput) => {
    if (!employeeId || !firebaseUser?.uid) {
      toast.error(t('employee.errors.invalidData'));
      return;
    }

    try {
      await updateEmployeeData(employeeId, data, firebaseUser.uid);
      toast.success(t('employee.messages.updateSuccess'));
      navigate(`/hr/employees/${employeeId}`);
    } catch (error) {
      console.error('Failed to update employee:', error);
      toast.error(t('employee.errors.updateFailed'));
    }
  };

  if (!selectedEmployee) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">{t('common.loading')}</div>
      </div>
    );
  }

  // Convert employee data to form format
  const initialData = {
    firstName: selectedEmployee.personal.firstName,
    lastName: selectedEmployee.personal.lastName,
    dateOfBirth: selectedEmployee.personal.dateOfBirth instanceof Date
      ? selectedEmployee.personal.dateOfBirth.toISOString().split('T')[0]
      : (selectedEmployee.personal.dateOfBirth as any).toDate?.()?.toISOString().split('T')[0] || new Date(selectedEmployee.personal.dateOfBirth).toISOString().split('T')[0],
    gender: selectedEmployee.personal.gender,
    nationality: selectedEmployee.personal.nationality,
    maritalStatus: selectedEmployee.personal.maritalStatus,
    dependents: selectedEmployee.personal.dependents,
    department: selectedEmployee.employment.department,
    designation: selectedEmployee.employment.designation,
    grade: selectedEmployee.employment.grade,
    costCenter: selectedEmployee.employment.costCenter,
    officeId: selectedEmployee.employment.officeId,
    contractType: selectedEmployee.employment.contractType,
    startDate: selectedEmployee.employment.startDate instanceof Date
      ? selectedEmployee.employment.startDate.toISOString().split('T')[0]
      : (selectedEmployee.employment.startDate as any).toDate?.()?.toISOString().split('T')[0] || new Date(selectedEmployee.employment.startDate).toISOString().split('T')[0],
    probationEndDate: selectedEmployee.employment.probationEndDate instanceof Date
      ? selectedEmployee.employment.probationEndDate.toISOString().split('T')[0]
      : (selectedEmployee.employment.probationEndDate as any).toDate?.()?.toISOString().split('T')[0] || new Date(selectedEmployee.employment.probationEndDate).toISOString().split('T')[0],
    basicSalary: selectedEmployee.payroll.basicSalary,
    hraAmount: selectedEmployee.payroll.hra.amount,
    hraPercentage: selectedEmployee.payroll.hra.percentage,
    transportation: selectedEmployee.payroll.transportation,
    mobile: selectedEmployee.payroll.mobile,
    utilities: selectedEmployee.payroll.utilities,
    overtimeRate: selectedEmployee.payroll.overtimeRate,
    currency: selectedEmployee.payroll.currency,
    bankName: selectedEmployee.banking.bankName,
    branch: selectedEmployee.banking.branch,
    iban: selectedEmployee.banking.iban,
    swiftCode: selectedEmployee.banking.swiftCode,
    accountNumber: selectedEmployee.banking.accountNumber,
    routingCode: selectedEmployee.banking.routingCode,
    emiratesId: selectedEmployee.compliance.emiratesId,
    passportNumber: selectedEmployee.compliance.passportNumber,
    passportExpiry: selectedEmployee.compliance.passportExpiry instanceof Date
      ? selectedEmployee.compliance.passportExpiry.toISOString().split('T')[0]
      : (selectedEmployee.compliance.passportExpiry as any).toDate?.()?.toISOString().split('T')[0] || new Date(selectedEmployee.compliance.passportExpiry).toISOString().split('T')[0],
    visaStatus: selectedEmployee.compliance.visaStatus,
    labourCardNumber: selectedEmployee.compliance.labourCardNumber,
    gosiNumber: selectedEmployee.compliance.gosiNumber,
  };

  return <EmployeeForm initialData={initialData} onSubmit={handleSubmit} loading={loading} />;
}
