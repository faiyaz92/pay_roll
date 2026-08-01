import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DollarSign, Plus, Check, X, Receipt, CheckCircle2 } from 'lucide-react';
import { INITIAL_EXPENSE_CLAIMS, type ExpenseClaim } from '@/useCases/extendedHRUseCases';

const ExpenseClaims = () => {
  const [claims, setClaims] = useState<ExpenseClaim[]>(INITIAL_EXPENSE_CLAIMS);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [category, setCategory] = useState<'Travel' | 'Client Entertainment' | 'Medical' | 'Office Supplies'>('Travel');
  const [amount, setAmount] = useState(250);
  const [description, setDescription] = useState('');

  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    const newClaim: ExpenseClaim = {
      id: `EXP-${Date.now().toString(36).toUpperCase()}`,
      employeeId: 'EMP-ALH-001',
      employeeName: 'Rashid Khan',
      category,
      amount: Number(amount),
      currency: 'AED',
      date: new Date().toISOString().slice(0, 10),
      status: 'pending',
      description: description || 'Business reimbursement claim',
    };

    setClaims([newClaim, ...claims]);
    toast.success('Expense claim submitted for HR approval!');
    setShowForm(false);
    setDescription('');
  };

  const handleStatusChange = (id: string, status: 'approved' | 'rejected' | 'reimbursed') => {
    setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    toast.success(`Claim ${id} status updated to ${status}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Expense Claims & Reimbursements</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              Finance & Claims
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Submit out-of-pocket business expense claims and manage manager approval queues.
          </p>
        </div>

        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 shadow-lg shadow-emerald-950"
        >
          <Plus className="w-4 h-4" />
          Submit Expense Claim
        </Button>
      </div>

      <div className="max-w-7xl mx-auto mt-6 space-y-6">
        {/* Form Modal / Card */}
        {showForm && (
          <Card className="bg-white border-emerald-500/50">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900">New Reimbursement Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateClaim} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-slate-600">Category</Label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full mt-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="Travel">Travel & Transportation</option>
                    <option value="Client Entertainment">Client Entertainment</option>
                    <option value="Medical">Medical Reimbursement</option>
                    <option value="Office Supplies">Office Supplies & Tools</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs text-slate-600">Amount (AED)</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-1 bg-slate-50 border-slate-200 text-slate-900 font-mono"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-xs text-slate-600">Description / Business Purpose</Label>
                  <Input
                    placeholder="e.g. Client lunch at DIFC..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 bg-slate-50 border-slate-200 text-slate-900"
                    required
                  />
                </div>

                <div className="md:col-span-4 flex justify-end">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                    Submit Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Claims List */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Claims Queue & Payouts</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Expense requests submitted by employees.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-800">{claim.employeeName}</h4>
                    <Badge variant="outline" className="text-xs bg-white border-slate-200">
                      {claim.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{claim.description}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">Date: {claim.date}</p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono text-base font-bold text-emerald-600">
                    {claim.amount.toLocaleString()} {claim.currency}
                  </span>

                  <Badge
                    className={
                      claim.status === 'approved' || claim.status === 'reimbursed'
                        ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30'
                        : claim.status === 'rejected'
                        ? 'bg-rose-500/20 text-rose-600 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-700 border-amber-500/30'
                    }
                  >
                    {claim.status.toUpperCase()}
                  </Badge>

                  {claim.status === 'pending' && (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(claim.id, 'approved')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(claim.id, 'rejected')}
                        className="border-slate-200 text-rose-600 hover:bg-rose-950/30 text-xs gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpenseClaims;
