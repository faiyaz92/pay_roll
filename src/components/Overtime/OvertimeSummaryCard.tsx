/**
 * Overtime Summary Card
 * Displays overtime statistics for an employee
 */

import { useEffect } from 'react';
import { Clock, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useOvertimeStore, OVERTIME_RATES } from '@/stores/overtime/overtime.store';

interface OvertimeSummaryCardProps {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  statusFilter?: 'all' | 'approved';
}

export const OvertimeSummaryCard = ({
  employeeId,
  startDate,
  endDate,
  statusFilter = 'approved',
}: OvertimeSummaryCardProps) => {
  const { employeeSummary, getEmployeeSummary, loading } = useOvertimeStore();

  useEffect(() => {
    getEmployeeSummary(employeeId, startDate, endDate, statusFilter);
  }, [employeeId, startDate, endDate, statusFilter, getEmployeeSummary]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!employeeSummary) {
    return null;
  }

  const stats = [
    {
      label: 'Total Hours',
      value: employeeSummary.totalHours.toFixed(1),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Total Amount',
      value: `$${employeeSummary.totalAmount.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: `Regular (${OVERTIME_RATES.regular}x)`,
      value: employeeSummary.regularHours.toFixed(1),
      icon: Calendar,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      label: `Weekend (${OVERTIME_RATES.weekend}x)`,
      value: employeeSummary.weekendHours.toFixed(1),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: `Holiday (${OVERTIME_RATES.holiday}x)`,
      value: employeeSummary.holidayHours.toFixed(1),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overtime Summary</CardTitle>
        <CardDescription>
          {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          {statusFilter === 'approved' && ' (Approved Only)'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-lg ${stat.bgColor} mb-2`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {employeeSummary.totalHours === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No overtime hours recorded for this period
          </div>
        )}
      </CardContent>
    </Card>
  );
};
