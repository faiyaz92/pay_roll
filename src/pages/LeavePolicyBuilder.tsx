import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Settings2, Plus, CheckCircle2, ShieldAlert } from 'lucide-react';
import { INITIAL_LEAVE_POLICIES, type LeavePolicy } from '@/useCases/leavePolicyUseCases';

const LeavePolicyBuilder = () => {
  const [policies, setPolicies] = useState<LeavePolicy[]>(INITIAL_LEAVE_POLICIES);

  // Form State
  const [policyName, setPolicyName] = useState('');
  const [type, setType] = useState<'annual' | 'sick' | 'casual'>('annual');
  const [days, setDays] = useState(30);

  const handleCreatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyName) return;

    const newPol: LeavePolicy = {
      policyId: `POL-${Date.now().toString(36).toUpperCase()}`,
      policyName,
      type,
      yearlyEntitlementDays: Number(days),
      accrualFrequency: 'monthly',
      carryForwardAllowed: true,
      maxCarryForwardDays: 10,
      probationMonthsBeforeEligible: 6,
    };

    setPolicies([...policies, newPol]);
    toast.success(`Leave policy "${policyName}" created!`);
    setPolicyName('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings2 className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Leave Policy & Accrual Rules Builder</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              Policy Governance
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Define corporate leave policies, carry-forward limits, and statutory entitlement rules.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Policy Form */}
        <Card className="bg-white border-slate-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              New Policy Definition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Policy Name *</Label>
                <Input
                  placeholder="e.g. Executive Unlimited Annual Leave"
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Leave Category</Label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
                >
                  <option value="annual">Annual Paid Leave</option>
                  <option value="sick">MOHRE Sick Leave</option>
                  <option value="casual">Casual / Emergency</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Yearly Entitlement (Days)</Label>
                <Input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="bg-slate-50 border-slate-200 text-slate-900 font-mono"
                  min={1}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                Create Policy
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Policies List */}
        <Card className="bg-white border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Configured Company Leave Policies</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Active policies applied to employee contracts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {policies.map((pol) => (
              <div
                key={pol.policyId}
                className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-800">{pol.policyName}</h4>
                    <Badge variant="outline" className="text-xs uppercase bg-white">
                      {pol.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Entitlement: <strong className="text-emerald-600">{pol.yearlyEntitlementDays} Days/Year</strong> | Carry Forward: <strong className="text-slate-800">{pol.maxCarryForwardDays} Days Max</strong>
                  </p>
                </div>

                <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-xs">
                  Active Rule
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeavePolicyBuilder;
