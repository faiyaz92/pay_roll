/**
 * Overtime Page
 * Employee overtime tracking and management
 */

import { useState } from 'react';
import { Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OvertimeLogForm } from '@/components/Overtime/OvertimeLogForm';
import { OvertimeSummaryCard } from '@/components/Overtime/OvertimeSummaryCard';
import { OvertimeApprovalList } from '@/components/Overtime/OvertimeApprovalList';
import { useAuthStore } from '@/stores/auth/auth.store';
import { useOvertimeStore } from '@/stores/overtime/overtime.store';

export default function OvertimePage() {
  const { user } = useAuthStore();
  const { overtimeLogs, getEmployeeLogs } = useOvertimeStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentMonth] = useState(() => {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
    };
  });

  // Mock data - replace with actual data
  const employeeId = user?.uid || 'employee-1';
  const companyId = 'company-1';
  const userRole = 'hr'; // or 'employee'

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    // Refresh logs
    getEmployeeLogs(employeeId);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Overtime Management</h1>
          <p className="text-muted-foreground">Track and manage overtime hours</p>
        </div>
        {userRole === 'employee' && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Log Overtime
          </Button>
        )}
      </div>

      <Tabs defaultValue={userRole === 'hr' ? 'approvals' : 'my-overtime'} className="space-y-6">
        <TabsList>
          {userRole === 'employee' && <TabsTrigger value="my-overtime">My Overtime</TabsTrigger>}
          {(userRole === 'hr' || userRole === 'admin') && (
            <>
              <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Employee View */}
        {userRole === 'employee' && (
          <TabsContent value="my-overtime" className="space-y-6">
            {/* Summary Card */}
            <OvertimeSummaryCard
              employeeId={employeeId}
              startDate={currentMonth.start}
              endDate={currentMonth.end}
              statusFilter="all"
            />

            {/* My Overtime Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  My Overtime Records
                </CardTitle>
                <CardDescription>Your overtime hours for current month</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Placeholder for employee overtime list */}
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your overtime records will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* HR/Admin Views */}
        {(userRole === 'hr' || userRole === 'admin') && (
          <>
            <TabsContent value="approvals">
              <OvertimeApprovalList companyId={companyId} status="pending" />
            </TabsContent>

            <TabsContent value="approved">
              <OvertimeApprovalList companyId={companyId} status="approved" />
            </TabsContent>

            <TabsContent value="rejected">
              <OvertimeApprovalList companyId={companyId} status="rejected" />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Create Overtime Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Overtime Hours</DialogTitle>
            <DialogDescription>
              Record overtime hours worked beyond standard 8 hours per day
            </DialogDescription>
          </DialogHeader>
          <OvertimeLogForm
            employeeId={employeeId}
            companyId={companyId}
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
