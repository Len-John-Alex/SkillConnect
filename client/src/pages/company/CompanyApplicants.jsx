import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { applicationsApi, opportunitiesApi } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, Pagination } from '../../components/ui/Table';
import { LoadingSpinner, Skeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/States';
import { formatDate, formatRelativeTime, getStatusColor, getOpportunityTypeLabel, getProficiencyColor, getProficiencyLabel } from '../../utils';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export default function CompanyApplicants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialOppId = searchParams.get('opportunity_id') || '';
  const [applications, setApplications] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ status: '', opportunity_id: initialOppId });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const oppId = searchParams.get('opportunity_id') || '';
    setFilters(prev => {
      if (prev.opportunity_id === oppId) return prev;
      return { ...prev, opportunity_id: oppId };
    });
  }, [searchParams]);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { 
        page: pagination.page, 
        limit: pagination.limit,
        status: filters.status || undefined,
        opportunity_id: filters.opportunity_id || undefined,
      };
      const res = await applicationsApi.list(params);
      setApplications(res.applications || []);
      setPagination(prev => ({ ...prev, total: res.pagination?.total || 0, totalPages: res.pagination?.totalPages || 0 }));
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters.status, filters.opportunity_id]);

  const fetchOpportunities = useCallback(async () => {
    try {
      const res = await opportunitiesApi.myList();
      setOpportunities(res.opportunities || []);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
    fetchOpportunities();
  }, [fetchApplications, fetchOpportunities]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
    if (key === 'opportunity_id') {
      const nextParams = new URLSearchParams(searchParams);
      if (value) {
        nextParams.set('opportunity_id', value);
      } else {
        nextParams.delete('opportunity_id');
      }
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  const openDetail = (app) => {
    setSelectedApp(app);
    setDetailModalOpen(true);
  };

  const handleStatusChange = async (newStatus) => {
    if (!selectedApp) return;
    setUpdatingStatus(true);
    try {
      await applicationsApi.updateStatus(selectedApp.id, newStatus);
      setDetailModalOpen(false);
      fetchApplications();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const validTransitions = {
    pending: ['shortlisted', 'rejected'],
    shortlisted: ['accepted', 'rejected'],
    accepted: [],
    rejected: [],
    withdrawn: [],
  };

  if (loading && applications.length === 0) {
    return (
      <><PageHeader title="Applicants" subtitle="Review and manage applications" />
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
    { key: 'title', header: 'Opportunity', width: '20%', render: (row) => <span className="font-medium">{row.title}</span> },
    { key: 'student_name', header: 'Applicant', width: '15%', render: (row) => <span className="font-medium">{row.student_name}</span> },
    { key: 'student_email', header: 'Email', width: '18%', render: (row) => <span className="text-gray-400">{row.student_email}</span> },
    { key: 'status', header: 'Status', width: '12%', render: (row) => <Badge variant="outline" className={getStatusColor(row.status)}>{row.status}</Badge> },
    { key: 'applied_at', header: 'Applied', width: '13%', render: (row) => formatRelativeTime(row.applied_at) },
    { key: 'actions', header: '', width: '8%', render: (row) => (
      <button onClick={() => openDetail(row)} className="text-gray-400 hover:text-white p-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      </button>
    )},
  ];

  return (
    <><PageHeader title="Applicants" subtitle="Review and manage applications for your opportunities" />
      {/* Filters */}
      <Card variant="elevated" className="mb-6">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            />
            <Select
              label="Opportunity"
              options={[{ value: '', label: 'All Opportunities' }, ...opportunities.map(o => ({ value: o.id, label: o.title }))]}
              value={filters.opportunity_id}
              onChange={(e) => handleFilterChange('opportunity_id', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl flex items-center justify-between" role="alert">
          <span>{error}</span>
          <Button variant="secondary" size="sm" onClick={fetchApplications}>Retry</Button>
        </div>
      )}

      {/* Results */}
      <Card variant="elevated">
        <CardContent className="p-0">
          {applications.length > 0 ? (
            <>
              <Table columns={columns} data={applications} keyField="id" loading={loading} />
              <div className="px-6 py-4 border-t border-gray-800">
                <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
              </div>
            </>
          ) : (
            <EmptyState icon="👥" title="No applications" description="Applications will appear here when candidates apply to your opportunities" />
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={detailModalOpen} onClose={() => { setDetailModalOpen(false); setSelectedApp(null); }} title="Application Details" size="xl">
        {selectedApp && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={getStatusColor(selectedApp.status)}>{selectedApp.status}</Badge>
              <Badge variant="outline" size="sm">{getOpportunityTypeLabel(selectedApp.opportunity_type)}</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div><p className="text-sm text-gray-500">Applicant</p><p className="font-medium text-white">{selectedApp.student_name}</p></div>
              <div><p className="text-sm text-gray-500">Email</p><p className="font-medium text-white">{selectedApp.student_email}</p></div>
              <div><p className="text-sm text-gray-500">Opportunity</p><p className="font-medium text-white">{selectedApp.title}</p></div>
              <div><p className="text-sm text-gray-500">Applied</p><p className="font-medium text-white">{formatDate(selectedApp.applied_at)}</p></div>
            </div>

            {selectedApp.cover_letter && (
              <div>
                <h4 className="font-semibold text-white mb-2">Cover Letter</h4>
                <p className="text-gray-300 whitespace-pre-wrap bg-gray-800/30 p-4 rounded-xl">{selectedApp.cover_letter}</p>
              </div>
            )}

            {selectedApp.opportunity_skills && selectedApp.opportunity_skills.length > 0 && (
              <div>
                <h4 className="font-semibold text-white mb-3">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.opportunity_skills.map(skill => (
                    <Badge key={skill.id} variant="outline" className={getProficiencyColor(skill.required_proficiency)}>
                      {skill.name} (Lvl {skill.required_proficiency}) {skill.importance === 3 && '⭐'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedApp.student_skills && selectedApp.student_skills.length > 0 && (
              <div>
                <h4 className="font-semibold text-white mb-3">Applicant's Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApp.student_skills.map(skill => (
                    <Badge key={skill.id} variant="outline" className={getProficiencyColor(skill.proficiency_level)}>
                      {skill.name} (Lvl {skill.proficiency_level})
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedApp.student_profile && (
              <div className="bg-gray-800/30 rounded-xl p-4">
                <h4 className="font-semibold text-white mb-3">Applicant's Profile</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {selectedApp.student_profile.degree && <div><p className="text-sm text-gray-500">Degree</p><p className="text-white">{selectedApp.student_profile.degree}</p></div>}
                  {selectedApp.student_profile.branch && <div><p className="text-sm text-gray-500">Branch</p><p className="text-white">{selectedApp.student_profile.branch}</p></div>}
                  {selectedApp.student_profile.graduation_year && <div><p className="text-sm text-gray-500">Graduation</p><p className="text-white">{selectedApp.student_profile.graduation_year}</p></div>}
                  {selectedApp.student_profile.institution_name && <div><p className="text-sm text-gray-500">Institution</p><p className="text-white">{selectedApp.student_profile.institution_name}</p></div>}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-800">
              <h4 className="font-semibold text-white mb-3">Update Status</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {validTransitions[selectedApp.status]?.map(s => (
                  <Button 
                    key={s} 
                    variant={selectedApp.status === s ? 'primary' : 'outline'} 
                    onClick={() => handleStatusChange(s)} 
                    loading={updatingStatus}
                    disabled={updatingStatus || selectedApp.status === s}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
              {validTransitions[selectedApp.status].length === 0 && (
                <p className="text-gray-500">No further status changes available for <strong>{selectedApp.status}</strong>.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}