import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Landmark, RefreshCw, CheckCircle2, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';
import {
  MOCK_GCC_BANKS,
  testBankApiConnection,
  triggerMockDirectBankDisbursement,
  type BankIntegrationConfig,
} from '@/useCases/bankIntegrationUseCases';

const BankIntegrationSetup = () => {
  const [banks, setBanks] = useState<BankIntegrationConfig[]>(MOCK_GCC_BANKS);
  const [testingBankId, setTestingBankId] = useState<string | null>(null);
  const [disbursing, setDisbursing] = useState(false);

  const handleTestConnection = async (bankId: string) => {
    setTestingBankId(bankId);
    const ok = await testBankApiConnection(bankId);
    setTestingBankId(null);

    if (ok) {
      setBanks((prev) =>
        prev.map((b) => (b.bankId === bankId ? { ...b, connectionStatus: 'connected', lastPing: new Date() } : b))
      );
      toast.success(`Bank API connection test passed for ${bankId}!`);
    }
  };

  const handleTriggerDirectPayment = async (bankId: string) => {
    setDisbursing(true);
    const res = await triggerMockDirectBankDisbursement(bankId, 'BATCH-JUL2026', 46250);
    setDisbursing(false);
    toast.success(res.message);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Bank Direct API Integration Setup</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              Mock Direct Connect
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Connect corporate bank accounts for automated Wage Protection System (WPS) direct API payroll transfers.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banks.map((bank) => (
            <Card key={bank.bankId} className="bg-white border-slate-200 hover:border-slate-300 transition">
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div>
                  <Badge className="bg-slate-100 text-slate-600 mb-2">{bank.country}</Badge>
                  <CardTitle className="text-lg font-bold text-slate-900">{bank.bankName}</CardTitle>
                  <CardDescription className="text-xs font-mono text-emerald-600 mt-1">
                    SWIFT: {bank.swiftCode}
                  </CardDescription>
                </div>

                <Badge
                  className={
                    bank.connectionStatus === 'connected'
                      ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-600 border-rose-500/30'
                  }
                >
                  {bank.connectionStatus.toUpperCase()}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs">
                  <p className="text-slate-500">Corporate IBAN Account:</p>
                  <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">{bank.corporateAccountId}</p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(bank.bankId)}
                    disabled={testingBankId === bank.bankId}
                    className="border-slate-200 text-xs gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingBankId === bank.bankId ? 'animate-spin' : ''}`} />
                    {testingBankId === bank.bankId ? 'Testing API…' : 'Test API Ping'}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleTriggerDirectPayment(bank.bankId)}
                    disabled={disbursing || bank.connectionStatus !== 'connected'}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Direct API Disbursement
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BankIntegrationSetup;
