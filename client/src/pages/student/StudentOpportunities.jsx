import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { opportunitiesApi, applicationsApi, skillsApi } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { Table, Pagination } from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/States';
import { formatDate, getOpportunityTypeLabel, getStatusColor, getProficiencyColor, debounce } from '../../utils';

const OPPORTUNITY_TYPES = [
  { value: 'internship', label: 'Internship' },
  { value: 'project', label: 'Project' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'draft', label: 'Draft' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function StudentOpportunities() {
  const { id } = useParams();

  // Detail mode state
  const [detailOpportunity, setDetailOpportunity] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // List mode state
  const [opportunities, setOpportunities] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: 'open',
    location: '',
    skill_id: '',
  });

  // ── Detail Mode Logic ──────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setDetailLoading(true);
    setDetailError(null);
    setApplySuccess(false);

    opportunitiesApi.get(id)
      .then(res => {
        setDetailOpportunity(res.opportunity || null);
      })
      .catch(err => {
        console.error('Failed to load opportunity:', err);
        setDetailError(err.message || 'Opportunity not found');
      })
      .finally(() => setDetailLoading(false));
  }, [id]);

  const handleApply = async () => {
    if (!detailOpportunity) return;
    setApplying(true);
    try {
      await applicationsApi.create({
        opportunity_id: detailOpportunity.id,
        cover_letter: coverLetter || undefined,
      });
      setApplySuccess(true);
      setCoverLetter('');
    } catch (err) {
      console.error('Failed to apply:', err);
      if (err.status === 409) {
        alert('You have already applied to this opportunity');
      } else if (err.errors) {
        alert(err.errors.map(e => e.message).join('\n'));
      } else {
        alert(err.message || 'Failed to apply');
      }
    } finally {
      setApplying(false);
    }
  };

  // ── List Mode Logic ────────────────────────────────────────────
  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      const params = { 
        page: pagination.page, 
        limit: pagination.limit,
        ...filters,
      };
      const res = await opportunitiesApi.list(params);
      setOpportunities(res.opportunities || []);
      setPagination(prev => ({ 
        ...prev, 
        total: res.pagination?.total || 0, 
        totalPages: res.pagination?.totalPages || 0 
      }));
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, filters]);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await skillsApi.list({ limit: 100 });
      setAllSkills(res.skills || []);
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  }, []);

  useEffect(() => {
    if (!id) {
      fetchOpportunities();
      fetchSkills();
    }
  }, [id, fetchOpportunities, fetchSkills]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const searchTimeoutRef = useRef(null);

  const handleSearch = (e) => {
    const val = e.target.value;
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: val }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: DETAIL VIEW MODE (when :id is present in URL)
  // ─────────────────────────────────────────────────────────────
  if (id) {
    if (detailLoading) {
      return (
        <>
          <div className="mb-4">
            <Link to="/student/opportunities" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1.5">
              ← Back to All Opportunities
            </Link>
          </div>
          <PageHeader title="Loading Opportunity..." subtitle="Please wait while details are retrieved" />
          <div className="space-y-6">
            <Card variant="elevated"><CardContent><Skeleton variant="card" /></CardContent></Card>
          </div>
        </>
      );
    }

    if (detailError || !detailOpportunity) {
      return (
        <>
          <div className="mb-4">
            <Link to="/student/opportunities" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1.5">
              ← Back to All Opportunities
            </Link>
          </div>
          <EmptyState
            icon="🔍"
            title="Opportunity Not Found"
            description="The opportunity you requested does not exist or has been removed."
            action={{ to: "/student/opportunities", children: "Browse Opportunities" }}
          />
        </>
      );
    }

    return (
      <>
        <div className="mb-4">
          <Link to="/student/opportunities" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1.5">
            ← Back to All Opportunities
          </Link>
        </div>

        <PageHeader
          title={detailOpportunity.title}
          subtitle={`${detailOpportunity.company_display_name || detailOpportunity.company_name} • ${getOpportunityTypeLabel(detailOpportunity.opportunity_type)} • ${detailOpportunity.location || 'Remote'}`}
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card variant="elevated">
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={getStatusColor(detailOpportunity.status)}>
                    {detailOpportunity.status}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    {getOpportunityTypeLabel(detailOpportunity.opportunity_type)}
                  </Badge>
                  {detailOpportunity.location && (
                    <Badge variant="outline" size="sm">📍 {detailOpportunity.location}</Badge>
                  )}
                  {detailOpportunity.deadline && (
                    <Badge variant="outline" size="sm">📅 Deadline: {formatDate(detailOpportunity.deadline)}</Badge>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Description & Requirements</h3>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {detailOpportunity.description || 'No description provided.'}
                  </p>
                </div>

                {detailOpportunity.skills && detailOpportunity.skills.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailOpportunity.skills.map((skill) => (
                        <Badge
                          key={skill.id || skill.skill_id}
                          variant="outline"
                          className={getProficiencyColor(skill.required_proficiency)}
                        >
                          {skill.name} (Level {skill.required_proficiency}) {skill.importance === 3 && '⭐'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action / Application Form */}
          <div className="space-y-6">
            <Card variant="elevated">
              <CardContent className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Application</h3>
                {applySuccess ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm">
                    ✓ Your application has been submitted successfully! You can track its status in the Applications tab.
                  </div>
                ) : (
                  <>
                    <Textarea
                      label="Cover Letter (optional)"
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Why are you a good fit for this role?"
                      rows={5}
                    />
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleApply}
                      loading={applying}
                      disabled={applying || detailOpportunity.status !== 'open'}
                    >
                      {detailOpportunity.status === 'open' ? 'Apply Now' : 'Opportunity Closed'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent>
                <h4 className="font-medium text-white mb-1">Company</h4>
                <p className="text-sm font-semibold text-indigo-400">
                  {detailOpportunity.company_display_name || detailOpportunity.company_name}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Posted {formatDate(detailOpportunity.created_at)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: LIST VIEW MODE (when on /student/opportunities)
  // ─────────────────────────────────────────────────────────────
  if (loading && opportunities.length === 0) {
    return (
      <>
        <PageHeader title="Opportunities" subtitle="Browse and apply for opportunities" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
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

  const columns = [
    {
      key: 'title',
      header: 'Title',
      width: '30%',
      render: (row) => (
        <Link
          to={`/student/opportunities/${row.id}`}
          className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline"
        >
          {row.title}
        </Link>
      ),
    },
    { key: 'company_display_name', header: 'Company', width: '15%' },
    {
      key: 'opportunity_type',
      header: 'Type',
      width: '12%',
      render: (row) => (
        <Badge variant="outline" size="sm">{getOpportunityTypeLabel(row.opportunity_type)}</Badge>
      ),
    },
    { key: 'location', header: 'Location', width: '15%' },
    {
      key: 'deadline',
      header: 'Deadline',
      width: '13%',
      render: (row) => row.deadline ? formatDate(row.deadline) : '—',
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (row) => (
        <Badge variant="outline" size="sm" className={getStatusColor(row.status)}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '5%',
      render: (row) => (
        <Link
          to={`/student/opportunities/${row.id}`}
          className="text-gray-400 hover:text-white p-1 inline-block"
          title="View Details"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Opportunities" subtitle="Browse and apply for internships, projects, and jobs" />

      {/* Filters */}
      <Card variant="elevated" className="mb-6">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Input
              label="Search"
              placeholder="Search opportunities..."
              value={filters.search}
              onChange={handleSearch}
            />
            <Select
              label="Type"
              options={[{ value: '', label: 'All Types' }, ...OPPORTUNITY_TYPES]}
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            />
            <Select
              label="Status"
              options={[{ value: '', label: 'All Status' }, ...STATUS_OPTIONS]}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            />
            <Input
              label="Location"
              placeholder="City, Remote..."
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            />
            <Select
              label="Skill"
              options={[{ value: '', label: 'All Skills' }, ...allSkills.map(s => ({ value: s.id, label: s.name }))]}
              value={filters.skill_id}
              onChange={(e) => handleFilterChange('skill_id', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card variant="elevated">
        <CardContent className="p-0">
          {opportunities.length > 0 ? (
            <>
              <Table
                columns={columns}
                data={opportunities}
                keyField="id"
                loading={loading}
              />
              <div className="px-6 py-4 border-t border-gray-800">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <EmptyState 
              icon="💼" 
              title="No opportunities found" 
              description="Try adjusting your filters or check back later"
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}