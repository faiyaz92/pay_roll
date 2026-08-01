import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, Award, ShieldAlert, CheckCircle2, DollarSign } from 'lucide-react';

const GratuityCalculator = () => {
  const [basicSalary, setBasicSalary] = useState<number>(12000);
  const [years, setYears] = useState<number>(3.5);
  const [contractType, setContractType] = useState<'unlimited' | 'limited'>('unlimited');
  const [reason, setReason] = useState<'resignation' | 'termination'>('resignation');
  const [gratuityResult, setGratuityResult] = useState<number | null>(null);

  const handleCalculate = () => {
    // UAE Labor Law Gratuity Formula:
    // - Less than 1 year: 0
    // - 1 to 5 years: 21 days basic salary per year
    // - Above 5 years: 30 days basic salary per year for each additional year
    // - Max total gratuity cannot exceed 2 years total salary

    if (years < 1) {
      setGratuityResult(0);
      return;
    }

    const perDaySalary = basicSalary / 30;
    let totalGratuity = 0;

    if (years <= 5) {
      totalGratuity = years * 21 * perDaySalary;
    } else {
      const first5Years = 5 * 21 * perDaySalary;
      const remainingYears = (years - 5) * 30 * perDaySalary;
      totalGratuity = first5Years + remainingYears;
    }

    // Resignation deductions for unlimited contracts if service < 3 yrs
    if (contractType === 'unlimited' && reason === 'resignation') {
      if (years >= 1 && years < 3) {
        totalGratuity = totalGratuity * (1 / 3);
      } else if (years >= 3 && years < 5) {
        totalGratuity = totalGratuity * (2 / 3);
      }
    }

    // Cap at 2 years basic salary
    const maxAllowed = basicSalary * 24;
    totalGratuity = Math.min(totalGratuity, maxAllowed);

    setGratuityResult(Math.round(totalGratuity));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">GCC End-of-Service Gratuity Calculator</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              UAE Labor Law Article 132
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Calculate exact End-of-Service Benefit (EOSB) gratuity based on UAE & GCC Labor Laws.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              Gratuity Calculation Inputs
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Enter basic salary and tenure details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Monthly Basic Salary (AED / SAR) *</Label>
              <Input
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(Number(e.target.value))}
                className="bg-slate-50 border-slate-200 text-slate-900 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Total Years of Service *</Label>
              <Input
                type="number"
                step="0.1"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="bg-slate-50 border-slate-200 text-slate-900 font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Contract Type</Label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
                >
                  <option value="unlimited">Unlimited Contract</option>
                  <option value="limited">Limited Contract</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Reason for Leaving</Label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
                >
                  <option value="resignation">Resignation</option>
                  <option value="termination">Termination by Employer</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleCalculate}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 mt-2"
            >
              Calculate Gratuity Amount
            </Button>
          </CardContent>
        </Card>

        {/* Calculation Result */}
        <Card className="bg-white border-slate-200 flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Calculated Gratuity Payout
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Official UAE Labor Law End-of-Service benefit summary.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Total Gratuity Entitlement
              </p>
              <h2 className="text-4xl font-extrabold text-emerald-600 mt-2 font-mono">
                {gratuityResult !== null ? `${gratuityResult.toLocaleString()} AED` : 'Press Calculate'}
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Based on {years} years of service at {basicSalary.toLocaleString()} AED/month Basic Salary.
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-500 bg-slate-50/60 p-4 rounded-lg border border-slate-200/80">
              <h4 className="font-semibold text-slate-800 uppercase text-[11px] mb-1">Legal Provision Reference:</h4>
              <p>• <strong>1 - 5 Years:</strong> Entitled to 21 days basic salary per year of service.</p>
              <p>• <strong>Above 5 Years:</strong> Entitled to 30 days basic salary for each additional year.</p>
              <p>• Maximum total payout capped at 2 years total basic salary.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GratuityCalculator;
