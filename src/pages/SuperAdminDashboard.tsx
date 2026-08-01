import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/GCCPayrollAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  ShieldCheck,
  Users,
  Database,
  CheckCircle2,
  Copy,
  LogOut,
  Sparkles,
  Search,
} from 'lucide-react';
import {
  createTenantCompany,
  getAllTenantCompanies,
  toggleCompanyStatus,
  type TenantCompanyRecord,
} from '@/useCases/superAdminUseCases';
import { seedDemoData, DEMO_CREDENTIALS } from '@/lib/demoDataSeeder';

const SuperAdminDashboard = () => {
  const { logout, userInfo } = useAuth();
  const [companies, setCompanies] = useState<TenantCompanyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [country, setCountry] = useState('UAE');
  const [currency, setCurrency] = useState('AED');
  const [regNo, setRegNo] = useState('');
  const [taxId, setTaxId] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminName, setAdminName] = useState('');

  const loadCompanies = async () => {
    setLoading(true);
    const data = await getAllTenantCompanies();
    setCompanies(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !adminEmail) {
      toast.error('Company Name and Admin Email are required');
      return;
    }

    try {
      await createTenantCompany(
        {
          name: companyName,
          email: companyEmail || adminEmail,
          country,
          currency,
          registrationNumber: regNo || `TRN-${Date.now().toString().slice(-6)}`,
          taxId: taxId || `TAX-${Date.now().toString().slice(-4)}`,
          industry: 'General Services',
          adminEmail,
          adminName: adminName || 'Company Administrator',
        },
        userInfo?.uid || 'SUPER_ADMIN'
      );

      toast.success(`Tenant Company "${companyName}" created successfully!`);
      setCompanyName('');
      setCompanyEmail('');
      setRegNo('');
      setTaxId('');
      setAdminEmail('');
      setAdminName('');
      loadCompanies();
    } catch (err) {
      toast.error('Failed to create company');
    }
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    const success = await seedDemoData();
    setSeeding(false);
    if (success) {
      toast.success('Demo data for "Al Hilal Enterprises LLC (Dubai)" seeded successfully!');
      loadCompanies();
    } else {
      toast.error('Failed to seed demo data. Check Firestore rules.');
    }
  };

  const handleToggleStatus = async (comp: TenantCompanyRecord) => {
    const nextStatus = comp.status === 'active' ? 'inactive' : 'active';
    await toggleCompanyStatus(comp.companyId, nextStatus);
    toast.success(`Status updated for ${comp.name}`);
    loadCompanies();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied: ${text}`);
  };

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Super Admin Portal</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              Multi-Tenant Governance
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Manage GCC tenant companies, provision HR accounts, and launch instant client demos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSeedDemo}
            disabled={seeding}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-2 shadow-lg shadow-emerald-950"
          >
            <Sparkles className="w-4 h-4" />
            {seeding ? 'Seeding Data…' : 'Seed Client Demo Data'}
          </Button>

          <Button
            variant="outline"
            onClick={logout}
            className="border-slate-200 text-slate-600 hover:bg-white gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Demo Credentials Panel */}
        <Card className="bg-white border-slate-200 lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              Turnkey Client Presentation Demo Credentials
            </CardTitle>
            <CardDescription className="text-slate-500">
              Use these pre-configured accounts to demonstrate full system capabilities to clients:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {DEMO_CREDENTIALS.map((cred, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-800">
                      {cred.role}
                    </Badge>
                    <button
                      onClick={() => copyToClipboard(cred.email)}
                      className="text-slate-500 hover:text-emerald-600 p-1"
                      title="Copy Email"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="font-semibold text-slate-800 text-sm">{cred.name}</h4>
                  <p className="text-xs text-emerald-600 font-mono mt-1">{cred.email}</p>
                  <p className="text-xs text-slate-500 mt-1">Pass: <span className="font-mono text-slate-600">{cred.passwordHint}</span></p>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{cred.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Create New Tenant Form */}
        <Card className="bg-white border-slate-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <Plus className="w-5 h-5 text-emerald-600" />
              Create New Tenant Company
            </CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Provision a isolated environment for a new client company.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Company Name *</Label>
                <Input
                  placeholder="e.g. Al-Futtaim Logistics"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600">Country</Label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="UAE">UAE (AED)</option>
                    <option value="Saudi Arabia">Saudi Arabia (SAR)</option>
                    <option value="Kuwait">Kuwait (KWD)</option>
                    <option value="Qatar">Qatar (QAR)</option>
                    <option value="Oman">Oman (OMR)</option>
                    <option value="Bahrain">Bahrain (BHD)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600">Currency</Label>
                  <Input
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Company Admin Email *</Label>
                <Input
                  type="email"
                  placeholder="admin@clientcompany.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900 text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">Admin Full Name</Label>
                <Input
                  placeholder="e.g. Tariq Mansoor"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600">Trade License / Reg No</Label>
                  <Input
                    placeholder="TRN-100293"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600">Tax ID</Label>
                  <Input
                    placeholder="TAX-88912"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="bg-slate-50 border-slate-200 text-slate-900 text-sm"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 mt-2">
                Create Tenant Company
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Companies List */}
        <Card className="bg-white border-slate-200 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <Building2 className="w-5 h-5 text-emerald-600" />
                Registered Tenant Companies ({companies.length})
              </CardTitle>
              <CardDescription className="text-slate-500 text-xs">
                Active multi-tenant instances registered in the system.
              </CardDescription>
            </div>

            <div className="relative w-48 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <Input
                placeholder="Search tenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border-slate-200 pl-9 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-500 text-sm py-8 text-center">Loading companies...</p>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 rounded-lg border border-slate-200/50">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">No tenant companies found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Click "Seed Client Demo Data" above to pre-populate sample companies.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredCompanies.map((comp) => (
                  <div
                    key={comp.companyId}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-900">{comp.name}</h4>
                        <Badge
                          variant="outline"
                          className={
                            comp.status === 'active'
                              ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                              : 'border-rose-500/30 text-rose-600 bg-rose-500/10'
                          }
                        >
                          {comp.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Country: <strong className="text-slate-800">{comp.country} ({comp.currency})</strong></span>
                        <span>Admin: <strong className="text-slate-800">{comp.adminEmail}</strong></span>
                        <span>Employees: <strong className="text-emerald-600">{comp.employeeCount}</strong></span>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(comp)}
                      className="border-slate-200 hover:bg-white text-xs"
                    >
                      {comp.status === 'active' ? 'Suspend' : 'Activate'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
