import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { studentsApi, opportunitiesApi, learningResourcesApi } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner, Skeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/States';
import { formatDate, getProficiencyLabel, getProficiencyColor, getStatusColor, getOpportunityTypeLabel, getResourceTypeIcon } from '../../utils';

export default function StudentSkillGap() {
  const [opportunities, setOpportunities] = useState([]);
  const [studentSkills, setStudentSkills] = useState([]);
  const [allResources, setAllResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [oppRes, skillsRes, resourcesRes] = await Promise.all([
          opportunitiesApi.list({ status: 'open', limit: 50 }),
          studentsApi.listSkills(),
          learningResourcesApi.list({ limit: 100 }),
        ]);
        setOpportunities(oppRes.opportunities || []);
        setStudentSkills(skillsRes.skills || []);
        setAllResources(resourcesRes.resources || []);
        if (oppRes.opportunities?.length > 0) {
          setSelectedOpportunityId(prev => prev || oppRes.opportunities[0].id);
        }
      } catch (err) {
        console.error('Failed to load skill gap data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const selectedOpportunity = useMemo(
    () => opportunities.find(o => o.id === selectedOpportunityId),
    [opportunities, selectedOpportunityId]
  );

  // Calculate skill gap with importance weighting and partial match credit
  const skillGap = useMemo(() => {
    if (!selectedOpportunity) return null;
    
    const studentSkillMap = new Map();
    studentSkills.forEach(s => {
      studentSkillMap.set(s.skill_id || s.id, s);
    });

    const matched = [];
    const needsImprovement = [];
    const missing = [];
    let totalWeight = 0;
    let earnedWeight = 0;

    (selectedOpportunity.skills || []).forEach(req => {
      const reqSkillId = req.skill_id || req.id;
      const studentSkill = studentSkillMap.get(reqSkillId);
      const weight = Number(req.importance) || 1;
      totalWeight += weight;

      if (!studentSkill) {
        missing.push({ ...req, skill_id: reqSkillId, gap: req.required_proficiency, gapLevel: 'missing' });
      } else {
        const current = studentSkill.proficiency_level;
        const required = req.required_proficiency;
        const gap = required - current;
        const fraction = Math.min(1, Math.max(0, current / required));
        earnedWeight += fraction * weight;

        if (gap <= 0) {
          matched.push({ ...req, skill_id: reqSkillId, ...studentSkill, gap: 0, gapLevel: 'met' });
        } else {
          needsImprovement.push({ ...req, skill_id: reqSkillId, ...studentSkill, gap, gapLevel: gap <= 1 ? 'close' : gap <= 2 ? 'moderate' : 'significant' });
        }
      }
    });

    const totalRequired = selectedOpportunity.skills?.length || 0;
    const metCount = matched.length;
    const needsCount = needsImprovement.length;
    const missingCount = missing.length;
    const matchPercentage = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 100;

    let readiness = 'ready';
    if (missingCount > 0) readiness = 'not-ready';
    else if (needsCount > 0) readiness = 'partial';

    return { matched, needsImprovement, missing, summary: { totalRequired, metCount, needsCount, missingCount, matchPercentage, readiness } };
  }, [selectedOpportunity, studentSkills]);

  // Get recommended resources for gaps
  const recommendedResources = useMemo(() => {
    if (!skillGap) return [];
    const gapSkills = [...skillGap.needsImprovement, ...skillGap.missing];
    const gapSkillIds = new Set(gapSkills.map(s => s.skill_id || s.id).filter(Boolean));
    return allResources
      .filter(r => gapSkillIds.has(r.skill_id || r.id))
      .sort((a, b) => {
        const typeOrder = { course: 0, video: 1, article: 2, book: 3, tool: 4, other: 5 };
        return (typeOrder[a.resource_type] || 5) - (typeOrder[b.resource_type] || 5);
      });
  }, [skillGap, allResources]);

  if (loading && opportunities.length === 0) {
    return (
      <><PageHeader title="Skill Gap Analysis" subtitle="Compare your skills against opportunity requirements" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} variant="elevated">
              <CardContent>
                <Skeleton variant="card" />
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (!selectedOpportunity) {
    return (
      <><PageHeader title="Skill Gap Analysis" subtitle="Compare your skills against opportunity requirements" />
        <EmptyState icon="🔍" title="No opportunities available" description="There are currently no open opportunities to analyze" />
      </>
    );
  }

  const readinessColors = {
    ready: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    partial: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'not-ready': 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  const readinessLabels = {
    ready: '✅ Ready to Apply',
    partial: '⚠️ Partial Match - Some Gaps',
    'not-ready': '❌ Significant Gaps',
  };

  return (
    <><PageHeader title="Skill Gap Analysis" subtitle="Compare your skills against opportunity requirements" />
      {/* Opportunity Selector */}
      <Card variant="elevated" className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Opportunity to Analyze</label>
              <Select
                options={opportunities.map(o => ({ value: o.id, label: o.title }))}
                value={selectedOpportunityId}
                onChange={(e) => setSelectedOpportunityId(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-xl border ${readinessColors[skillGap?.summary.readiness]}`}>
                <span className="font-medium">{readinessLabels[skillGap?.summary.readiness]}</span>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-400">{skillGap?.summary.matchPercentage}%</p>
                <p className="text-xs text-gray-500">Skill Match</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {skillGap && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <Card variant="elevated">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-emerald-400">{skillGap.summary.metCount}</p>
                <p className="text-gray-500 text-sm">Skills Met</p>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-blue-400">{skillGap.summary.needsCount}</p>
                <p className="text-gray-500 text-sm">Need Improvement</p>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-red-400">{skillGap.summary.missingCount}</p>
                <p className="text-gray-500 text-sm">Missing Skills</p>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-purple-400">{skillGap.summary.totalRequired}</p>
                <p className="text-gray-500 text-sm">Total Required</p>
              </CardContent>
            </Card>
          </div>

          {/* Skill Gap Details */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Matched Skills */}
            <Card variant="elevated">
              <CardContent>
                <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Skills You Have ({skillGap.matched.length})
                </h3>
                {skillGap.matched.length > 0 ? (
                  <div className="space-y-2">
                    {skillGap.matched.map(s => (
                      <div key={s.skill_id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                          <span className="font-medium text-white">{s.name}</span>
                        </div>
                        <Badge variant="outline" className={getProficiencyColor(s.proficiency_level)}>
                          Lvl {s.proficiency_level} ≥ {s.required_proficiency}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">No matched skills</p>
                )}
              </CardContent>
            </Card>

            {/* Needs Improvement */}
            <Card variant="elevated">
              <CardContent>
                <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Need Improvement ({skillGap.needsImprovement.length})
                </h3>
                {skillGap.needsImprovement.length > 0 ? (
                  <div className="space-y-3">
                    {skillGap.needsImprovement.map(s => (
                      <div key={s.skill_id} className="p-3 bg-gray-800/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{s.name}</span>
                          <Badge 
                            variant="outline" 
                            className={
                              s.gapLevel === 'close' 
                                ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' 
                                : s.gapLevel === 'moderate' 
                                ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' 
                                : 'border-red-500/30 text-red-400 bg-red-500/10'
                            }
                          >
                            Gap: +{s.gap} level{s.gap > 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${Math.max(0, Math.min(100, (s.proficiency_level / s.required_proficiency) * 100))}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Current: {getProficiencyLabel(s.proficiency_level)}</span>
                          <span>Required: {getProficiencyLabel(s.required_proficiency)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">No skills need improvement</p>
                )}
              </CardContent>
            </Card>

            {/* Missing Skills */}
            <Card variant="elevated">
              <CardContent>
                <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Missing Skills ({skillGap.missing.length})
                </h3>
                {skillGap.missing.length > 0 ? (
                  <div className="space-y-2">
                    {skillGap.missing.map(s => (
                      <div key={s.skill_id} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span className="font-medium text-white">{s.name}</span>
                        </div>
                        <Badge variant="outline" className="bg-red-500/20 text-red-300">
                          Required: Lvl {s.required_proficiency}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-4">No missing skills</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommended Resources */}
          {recommendedResources.length > 0 && (
            <Card variant="elevated" className="mt-6">
              <CardContent>
                <h3 className="text-lg font-semibold text-white mb-4">Recommended Learning Resources</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recommendedResources.slice(0, 6).map(r => (
                    <Link key={r.id} to="/student/learning" className="block p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getResourceTypeIcon(r.resource_type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{r.title}</p>
                          <p className="text-xs text-gray-500">{r.skill_name} • {r.resource_type}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}