import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShieldCheck, History, Search, UserCheck } from 'lucide-react';
import { getAuditLogs, type AuditLogItem } from '@/useCases/reportsUseCases';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      const data = await getAuditLogs();
      setLogs(data);
      setLoading(false);
    };
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">System Audit Logs & Security Trail</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              Immutable Records
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Complete audit trail tracking user logins, payroll runs, WPS file exports, and data mutations.
          </p>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <Input
            placeholder="Search audit trail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-white border-slate-200 pl-9 text-xs"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Audit Trail Events</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Chronological log of system actions for compliance and security auditing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-500 py-8 text-center text-sm">Loading audit trail...</p>
            ) : filteredLogs.length === 0 ? (
              <p className="text-slate-500 py-8 text-center text-sm">No audit logs found.</p>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.logId}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            log.action === 'PAYROLL_RUN'
                              ? 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30'
                              : log.action === 'WPS_EXPORT'
                              ? 'bg-blue-500/20 text-blue-700 border-blue-500/30'
                              : 'bg-slate-100 text-slate-600'
                          }
                        >
                          {log.action}
                        </Badge>
                        <h4 className="font-semibold text-slate-800 text-sm">{log.userName}</h4>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{log.details}</p>
                    </div>

                    <div className="text-right text-xs text-slate-500 font-mono">
                      <p>{log.timestamp.toLocaleString()}</p>
                      <p className="text-slate-600">IP: {log.ipAddress}</p>
                    </div>
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

export default AuditLogViewer;
