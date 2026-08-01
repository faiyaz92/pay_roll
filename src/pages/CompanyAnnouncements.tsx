import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, AlertCircle, Calendar } from 'lucide-react';
import { INITIAL_ANNOUNCEMENTS, type CompanyAnnouncement } from '@/useCases/extendedHRUseCases';

const CompanyAnnouncements = () => {
  const [announcements] = useState<CompanyAnnouncement[]>(INITIAL_ANNOUNCEMENTS);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Company Announcements & Compliance Notices</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              Company Broadcast
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Official company circulars, GCC labor compliance mandates, and statutory holiday notices.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6 space-y-4">
        {announcements.map((ann) => (
          <Card
            key={ann.id}
            className={`bg-white border ${
              ann.priority === 'high' ? 'border-amber-500/50 border-l-4 border-l-amber-500' : 'border-slate-200'
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge
                  className={
                    ann.priority === 'high'
                      ? 'bg-amber-500/20 text-amber-700 border-amber-500/30 text-xs'
                      : 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-xs'
                  }
                >
                  {ann.category}
                </Badge>
                <span className="text-xs text-slate-500 font-mono">{ann.date}</span>
              </div>
              <CardTitle className="text-lg font-bold text-slate-900 mt-2">{ann.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-xs leading-relaxed">{ann.content}</p>
              <p className="text-[11px] text-slate-500 mt-3 font-semibold">Posted by: {ann.author}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CompanyAnnouncements;
