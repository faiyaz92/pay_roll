/**
 * Employee Form Component
 * Comprehensive form for creating/editing employees
 * Tabbed interface: Personal, Employment, Payroll, Banking, Compliance
 * RTL-compatible with bilingual support
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore, useAuthStore } from '@/stores';
import { getOffices } from '@/useCases/officeUseCases';
import type { Office } from '@/types/office';
import type { EmployeeInput } from '@/types/employee';

// Validation schema
const employeeSchema = z.object({
  // Personal
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  dateOfBirth: z.string(),
  gender: z.enum(['male', 'female']),
  nationality: z.string().min(2),
  maritalStatus: z.enum(['single', 'married', 'divorced']),
  dependents: z.number().min(0),
  
  // Employment
  department: z.string().min(2),
  designation: z.string().min(2),
  grade: z.string(),
  costCenter: z.string(),
  officeId: z.string(),
  contractType: z.enum(['limited', 'unlimited']),
  startDate: z.string(),
  probationEndDate: z.string(),
  
  // Payroll
  basicSalary: z.number().min(0),
  hraAmount: z.number().min(0),
  hraPercentage: z.number().min(0).max(100),
  transportation: z.number().min(0),
  mobile: z.number().min(0),
  utilities: z.number().min(0),
  overtimeRate: z.number().min(0),
  currency: z.string().default('AED'),
  
  // Banking
  bankName: z.string().min(2),
  branch: z.string(),
  iban: z.string().min(10),
  swiftCode: z.string(),
  accountNumber: z.string(),
  routingCode: z.string(),
  
  // Compliance
  emiratesId: z.string(),
  passportNumber: z.string(),
  passportExpiry: z.string(),
  visaStatus: z.string(),
  labourCardNumber: z.string(),
  gosiNumber: z.string(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  initialData?: Partial<EmployeeFormData>;
  onSubmit: (data: EmployeeInput) => Promise<void>;
  loading?: boolean;
}

export default function EmployeeForm({ initialData, onSubmit, loading }: EmployeeFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { direction } = useAppStore();
  const { userInfo } = useAuthStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [offices, setOffices] = useState<Office[]>([]);

  useEffect(() => {
    if (userInfo?.companyId) {
      getOffices(userInfo.companyId).then(setOffices).catch(() => setOffices([]));
    }
  }, [userInfo?.companyId]);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      gender: 'male',
      maritalStatus: 'single',
      dependents: 0,
      contractType: 'unlimited',
      currency: 'AED',
      hraPercentage: 0,
      basicSalary: 0,
      hraAmount: 0,
      transportation: 0,
      mobile: 0,
      utilities: 0,
      overtimeRate: 1.5,
      ...initialData,
    },
  });

  const handleSubmit = async (data: EmployeeFormData) => {
    const employeeInput: EmployeeInput = {
      personal: {
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        nationality: data.nationality,
        maritalStatus: data.maritalStatus,
        dependents: data.dependents,
      },
      employment: {
        department: data.department,
        designation: data.designation,
        grade: data.grade,
        costCenter: data.costCenter,
        officeId: data.officeId,
        contractType: data.contractType,
        startDate: new Date(data.startDate),
        probationEndDate: new Date(data.probationEndDate),
      },
      payroll: {
        basicSalary: data.basicSalary,
        hra: {
          amount: data.hraAmount,
          percentage: data.hraPercentage,
        },
        transportation: data.transportation,
        mobile: data.mobile,
        utilities: data.utilities,
        otherAllowances: [],
        overtimeRate: data.overtimeRate,
        currency: data.currency,
      },
      banking: {
        bankName: data.bankName,
        branch: data.branch,
        iban: data.iban,
        swiftCode: data.swiftCode,
        accountNumber: data.accountNumber,
        routingCode: data.routingCode,
      },
      compliance: {
        emiratesId: data.emiratesId,
        passportNumber: data.passportNumber,
        passportExpiry: new Date(data.passportExpiry),
        visaStatus: data.visaStatus,
        labourCardNumber: data.labourCardNumber,
        gosiNumber: data.gosiNumber,
      },
    };

    await onSubmit(employeeInput);
  };

  return (
    <div className="container mx-auto p-6" dir={direction}>
      <Card>
        <CardHeader>
          <CardTitle>
            {initialData ? t('employee.form.editTitle') : t('employee.form.createTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="personal">{t('employee.sections.personal')}</TabsTrigger>
                  <TabsTrigger value="employment">{t('employee.sections.employment')}</TabsTrigger>
                  <TabsTrigger value="payroll">{t('employee.sections.payroll')}</TabsTrigger>
                  <TabsTrigger value="banking">{t('employee.sections.banking')}</TabsTrigger>
                  <TabsTrigger value="compliance">{t('employee.sections.compliance')}</TabsTrigger>
                </TabsList>

                {/* Personal Tab */}
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.firstName')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.lastName')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.dateOfBirth')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.gender.label')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">{t('common.gender.male')}</SelectItem>
                              <SelectItem value="female">{t('common.gender.female')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.nationality')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maritalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.maritalStatus.label')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single">{t('common.maritalStatus.single')}</SelectItem>
                              <SelectItem value="married">{t('common.maritalStatus.married')}</SelectItem>
                              <SelectItem value="divorced">{t('common.maritalStatus.divorced')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dependents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.dependents')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Employment Tab */}
                <TabsContent value="employment" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.department')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="designation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.designation')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.grade')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="costCenter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.costCenter')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="officeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.officeId')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={offices.length ? 'Select office' : 'No offices yet — add one under Offices'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {offices.map((office) => (
                                <SelectItem key={office.officeId} value={office.officeId}>
                                  {office.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contractType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.contractType.label')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="limited">{t('employee.fields.contractType.limited')}</SelectItem>
                              <SelectItem value="unlimited">{t('employee.fields.contractType.unlimited')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.startDate')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="probationEndDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.probationEndDate')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Payroll Tab */}
                <TabsContent value="payroll" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="basicSalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.basicSalary')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.currency.label')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="AED">{t('common.currency.aed')}</SelectItem>
                              <SelectItem value="SAR">{t('common.currency.sar')}</SelectItem>
                              <SelectItem value="KWD">{t('common.currency.kwd')}</SelectItem>
                              <SelectItem value="BHD">{t('common.currency.bhd')}</SelectItem>
                              <SelectItem value="OMR">{t('common.currency.omr')}</SelectItem>
                              <SelectItem value="QAR">{t('common.currency.qar')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hraAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.hra')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hraPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.hraPercentage')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="transportation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.transportation')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.mobile')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="utilities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.utilities')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="overtimeRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.overtimeRate')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Banking Tab */}
                <TabsContent value="banking" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.bankName')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.branch')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="iban"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.iban')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="swiftCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.swiftCode')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accountNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.accountNumber')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="routingCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.routingCode')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Compliance Tab */}
                <TabsContent value="compliance" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emiratesId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.emiratesId')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="passportNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.passportNumber')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="passportExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.passportExpiry')}</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="visaStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.visaStatus')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="labourCardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.labourCardNumber')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gosiNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('employee.fields.gosiNumber')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Form Actions */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/hr/employees')}
                  disabled={loading}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? t('common.saving') : t('common.save')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
