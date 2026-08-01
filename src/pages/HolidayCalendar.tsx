import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Moon, Sun, Flag } from 'lucide-react';
import { GCC_PUBLIC_HOLIDAYS_2026, type HolidayItem } from '@/useCases/holidayShiftUseCases';

const HolidayCalendar = () => {
  const [holidays] = useState<HolidayItem[]>(GCC_PUBLIC_HOLIDAYS_2026);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">GCC Public Holiday Calendar 2026</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              Paid Statutory Leaves
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Official statutory public holidays for UAE, Saudi Arabia, and GCC countries.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Declared Statutory Holidays</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Employees are automatically credited with paid leave days for statutory public holidays.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {holidays.map((hol) => (
                <div
                  key={hol.id}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs bg-white border-slate-200">
                      {hol.country}
                    </Badge>
                    <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30 text-xs">
                      {hol.daysCount} {hol.daysCount === 1 ? 'Day' : 'Days'} Paid
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{hol.name}</h4>
                    <p className="text-xs text-emerald-600 font-arabic font-semibold mt-0.5">{hol.nameArabic}</p>
                  </div>
                  <p className="text-xs text-slate-500 pt-1 font-mono">Date: <strong className="text-slate-800">{hol.date}</strong></p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HolidayCalendar;
