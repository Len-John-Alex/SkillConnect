import { useState, useEffect } from 'react';
import { PageHeader } from '../../components/layout';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner, Skeleton } from '../../components/ui/Loading';

export default function InstitutionAnalytics() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader title="Analytics" subtitle="Institutional performance and industry alignment metrics" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} variant="elevated">
              <CardContent><Skeleton variant="card" /></CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  const topSkills = [
    { name: 'Full-Stack JavaScript (React/Node)', demand: 92, students: 48, growth: '+15%' },
    { name: 'Python & Data Engineering', demand: 86, students: 42, growth: '+22%' },
    { name: 'Cloud Computing & DevOps (AWS/Docker)', demand: 79, students: 31, growth: '+8%' },
    { name: 'Machine Learning & AI', demand: 75, students: 28, growth: '+34%' },
    { name: 'Database Architecture (PostgreSQL/Redis)', demand: 70, students: 35, growth: '+5%' },
  ];

  const departmentMetrics = [
    { dept: 'Computer Science & Engineering', placed: 84, total: 120, avgScore: '88%' },
    { dept: 'Information Technology', placed: 76, total: 95, avgScore: '83%' },
    { dept: 'Electronics & Communication', placed: 65, total: 110, avgScore: '79%' },
    { dept: 'Data Science & AI', placed: 88, total: 60, avgScore: '91%' },
  ];

  return (
    <>
      <PageHeader title="Analytics" subtitle="Institutional performance, student placement, and industry skill demand" />

      {/* Top Level Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-indigo-400">81.5%</p>
            <p className="text-gray-400 text-sm mt-1">Average Placement Rate</p>
            <span className="text-xs text-emerald-400 mt-2 inline-block">↑ +4.2% from last cycle</span>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">86.2%</p>
            <p className="text-gray-400 text-sm mt-1">Industry Skill Match Index</p>
            <span className="text-xs text-emerald-400 mt-2 inline-block">↑ High alignment</span>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-400">38</p>
            <p className="text-gray-400 text-sm mt-1">Hiring Corporate Partners</p>
            <span className="text-xs text-blue-400 mt-2 inline-block">12 new this semester</span>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-400">385</p>
            <p className="text-gray-400 text-sm mt-1">Verified Student Passports</p>
            <span className="text-xs text-gray-400 mt-2 inline-block">Across 4 departments</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Industry Skill Demand */}
        <Card variant="elevated">
          <CardContent>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              <span>Top Industry Skill Demand</span>
              <span className="text-xs text-indigo-400">Market Benchmark</span>
            </h3>
            <div className="space-y-4">
              {topSkills.map((skill) => (
                <div key={skill.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-200 font-medium">{skill.name}</span>
                    <span className="text-gray-400">{skill.demand}% Demand <span className="text-emerald-400 text-xs ml-1">({skill.growth})</span></span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full"
                      style={{ width: `${skill.demand}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{skill.students} enrolled students matching</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Department Placement Breakdown */}
        <Card variant="elevated">
          <CardContent>
            <h3 className="text-lg font-semibold text-white mb-4">Department Placement Performance</h3>
            <div className="space-y-3">
              {departmentMetrics.map((dm) => (
                <div key={dm.dept} className="p-3 bg-gray-800/40 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white text-sm">{dm.dept}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{dm.placed} of {dm.total} students placed</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300">
                      {Math.round((dm.placed / dm.total) * 100)}% Placement
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1">Avg Score: {dm.avgScore}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
