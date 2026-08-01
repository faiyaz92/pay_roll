import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Award, TrendingUp } from 'lucide-react';
import { INITIAL_PERFORMANCE_REVIEWS, type PerformanceAppraisal } from '@/useCases/extendedHRUseCases';

const PerformanceAppraisals = () => {
  const [reviews] = useState<PerformanceAppraisal[]>(INITIAL_PERFORMANCE_REVIEWS);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900">Performance & Appraisal Management</h1>
            <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
              KPI & Ratings
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Conduct bi-annual employee performance reviews, track KPI scores, and manage rating appraisals.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-6">
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Completed Employee Appraisals</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Performance metrics used for annual increment calculations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">{rev.employeeName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Review Period: <strong className="text-slate-800">{rev.reviewPeriod}</strong></p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-sm py-1 px-3 gap-1">
                      <Star className="w-4 h-4 fill-emerald-400 text-emerald-600" />
                      {rev.overallRating} / 5.0 Rating
                    </Badge>
                  </div>
                </div>

                <div className="bg-white/60 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                  <p className="text-slate-500 font-semibold">KPI Score: <strong className="text-emerald-600 font-mono text-sm">{rev.kpiScorePercentage}%</strong></p>
                  <p className="text-slate-600 font-italic mt-1">"{rev.managerComments}"</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceAppraisals;
