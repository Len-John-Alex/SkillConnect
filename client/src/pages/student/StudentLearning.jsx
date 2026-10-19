import { useState, useEffect, useMemo } from 'react';
import { learningResourcesApi, studentsApi, skillsApi } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Table';
import { LoadingSpinner, Skeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/States';
import { getResourceTypeIcon, formatDate } from '../../utils';

export default function StudentLearning() {
  const [resources, setResources] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [studentSkills, setStudentSkills] = useState([]);
  const [gapResources, setGapResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    skill_id: '',
    resource_type: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [resourcesRes, skillsRes, studentSkillsRes] = await Promise.all([
          learningResourcesApi.list({ ...filters, page: pagination.page, limit: pagination.limit }),
          skillsApi.list({ limit: 100 }),
          studentsApi.listSkills(),
        ]);
        setResources(resourcesRes.resources || []);
        setPagination(prev => ({ ...prev, total: resourcesRes.pagination?.total || 0, totalPages: resourcesRes.pagination?.totalPages || 0 }));
        setAllSkills(skillsRes.skills || []);
        setStudentSkills(studentSkillsRes.skills || []);

        // Load dedicated recommendations for skill gaps across the full catalog
        const gapSkills = (studentSkillsRes.skills || []).filter(s => s.proficiency_level < 4);
        const gapSkillIds = new Set(gapSkills.map(s => s.skill_id || s.id));
        if (gapSkillIds.size > 0) {
          const allRes = await learningResourcesApi.list({ limit: 100 });
          const matched = (allRes.resources || [])
            .filter(r => gapSkillIds.has(r.skill_id))
            .sort((a, b) => {
              const typeOrder = { course: 0, video: 1, article: 2, book: 3, tool: 4, other: 5 };
              return (typeOrder[a.resource_type] || 5) - (typeOrder[b.resource_type] || 5);
            });
          setGapResources(matched.slice(0, 6));
        } else {
          setGapResources([]);
        }
      } catch (err) {
        console.error('Failed to load resources:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filters, pagination.page]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  if (loading && resources.length === 0) {
    return (
      <><PageHeader title="Learning Roadmap" subtitle="Discover resources to bridge your skill gaps" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
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

  return (
    <><PageHeader title="Learning Roadmap" subtitle="Discover resources to bridge your skill gaps" />
      {/* Filters */}
      <Card variant="elevated" className="mb-6">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              label="Filter by Skill"
              options={[{ value: '', label: 'All Skills' }, ...allSkills.map(s => ({ value: s.id, label: s.name }))]}
              value={filters.skill_id}
              onChange={(e) => handleFilterChange('skill_id', e.target.value)}
            />
            <Select
              label="Resource Type"
              options={[
                { value: '', label: 'All Types' },
                { value: 'course', label: 'Course' },
                { value: 'video', label: 'Video' },
                { value: 'article', label: 'Article' },
                { value: 'book', label: 'Book' },
                { value: 'tool', label: 'Tool' },
                { value: 'other', label: 'Other' },
              ]}
              value={filters.resource_type}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* All Resources (Search Results) */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">All Resources</h3>
        <span className="text-sm text-gray-500">{pagination.total} resources</span>
      </div>

      {resources.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            {resources.map(r => (
              <Card key={r.id} variant="elevated">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{getResourceTypeIcon(r.resource_type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white truncate">{r.title}</p>
                        <Badge variant="outline" size="sm">{r.resource_type}</Badge>
                      </div>
                      <p className="text-xs text-gray-500">{r.skill_name} • {r.resource_type}</p>
                      {r.description && <p className="text-sm text-gray-400 mt-2 line-clamp-2">{r.description}</p>}
                      <a href={r.resource_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm mt-3">
                        View Resource →
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center mb-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <div className="mb-8">
          <EmptyState 
            icon="📚" 
            title="No resources found" 
            description="Try adjusting your filters or check back later"
          />
        </div>
      )}

      {/* Recommended for Skill Gaps */}
      {gapResources.length > 0 && (
        <div className="mb-6 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Recommended for Your Skill Gaps</h3>
              <p className="text-xs text-gray-400">Curated materials matching skills needed for your target opportunities</p>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">Personalized</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gapResources.slice(0, 6).map(r => (
              <Card key={r.id} variant="elevated" className="border-l-4 border-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{getResourceTypeIcon(r.resource_type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-white truncate">{r.title}</p>
                        <Badge variant="outline" size="sm" className="bg-emerald-500/20 text-emerald-300">Recommended</Badge>
                      </div>
                      <p className="text-xs text-gray-500">{r.skill_name} • {r.resource_type}</p>
                      {r.description && <p className="text-sm text-gray-400 mt-2 line-clamp-2">{r.description}</p>}
                      <a href={r.resource_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm mt-3">
                        View Resource →
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}