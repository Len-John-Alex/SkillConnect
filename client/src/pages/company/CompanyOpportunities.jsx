import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { opportunitiesApi, applicationsApi, skillsApi } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Table, Pagination } from '../../components/ui/Table';
import { LoadingSpinner, Skeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/States';
import { formatDate, getOpportunityTypeLabel, getStatusColor, getProficiencyLabel, getProficiencyColor } from '../../utils';

const OPPORTUNITY_TYPES = [
  { value: 'internship', label: 'Internship' },
  { value: 'project', label: 'Project' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function CompanyOpportunities() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    opportunity_type: 'internship',
    location: '',
    deadline: '',
    status: 'open',
    skills: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [availableSkills, setAvailableSkills] = useState([]);

  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await opportunitiesApi.myList({
        page: pagination.page,
        limit: pagination.limit,
      });
      setOpportunities(res.opportunities || []);
      if (res.pagination) {
        setPagination(prev => ({
          ...prev,
          total: res.pagination.total,
          totalPages: res.pagination.totalPages,
        }));
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await skillsApi.list({ limit: 100 });
      setAvailableSkills(res.skills || []);
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  }, []);

  useEffect(() => {
    fetchOpportunities();
    fetchSkills();
  }, [fetchOpportunities, fetchSkills]);

  const totalPages = pagination.totalPages || Math.max(1, Math.ceil(opportunities.length / pagination.limit));

  const paginatedOpps = opportunities;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setPagination(prev => ({ ...prev, page }));
    }
  };

  const handleOpenModal = useCallback((opp = null) => {
    if (opp) {
      setEditingOpp(opp);
      setFormData({
        title: opp.title,
        description: opp.description || '',
        opportunity_type: opp.opportunity_type,
        location: opp.location || '',
        deadline: opp.deadline ? opp.deadline.split('T')[0] : '',
        status: opp.status,
        skills: opp.skills?.map(s => ({
          skill_id: s.id,
          required_proficiency: s.required_proficiency,
          importance: s.importance,
        })) || [],
      });
    } else {
      setEditingOpp(null);
      setFormData({
        title: '',
        description: '',
        opportunity_type: 'internship',
        location: '',
        deadline: '',
        status: 'open',
        skills: [],
      });
    }
    setFormErrors({});
    setModalOpen(true);
  }, []);

  useEffect(() => {
    if (!id) return;
    const opp = opportunities.find(o => o.id === id);
    if (opp) {
      handleOpenModal(opp);
    } else {
      opportunitiesApi.get(id)
        .then(res => {
          if (res.opportunity) handleOpenModal(res.opportunity);
        })
        .catch(err => console.error('Failed to load opportunity for edit:', err));
    }
  }, [id, opportunities, handleOpenModal]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingOpp(null);
    setFormData({
      title: '',
      description: '',
      opportunity_type: 'internship',
      location: '',
      deadline: '',
      status: 'open',
      skills: [],
    });
    setFormErrors({});
    if (id) {
      navigate('/company/opportunities', { replace: true });
    }
  }, [id, navigate]);

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.opportunity_type) errors.opportunity_type = 'Type is required';
    formData.skills.forEach((skill, index) => {
      if (!skill.skill_id) {
        errors[`skills.${index}.skill_id`] = 'Please select a skill or remove this row';
      }
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const validSkills = formData.skills
      .filter(s => s.skill_id && typeof s.skill_id === 'string' && s.skill_id.trim() !== '')
      .map(s => ({
        skill_id: s.skill_id,
        required_proficiency: Number(s.required_proficiency) || 1,
        importance: Number(s.importance) || 1,
      }));

    const skillIds = validSkills.map(s => s.skill_id);
    if (new Set(skillIds).size !== skillIds.length) {
      alert('Duplicate skills detected. Please ensure each skill is only added once.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = { ...formData, skills: validSkills };
      if (payload.deadline === '') delete payload.deadline;
      
      if (editingOpp) {
        await opportunitiesApi.update(editingOpp.id, payload);
      } else {
        await opportunitiesApi.create(payload);
      }
      handleCloseModal();
      fetchOpportunities();
    } catch (err) {
      console.error('Failed to save opportunity:', err);
      if (err.errors) {
        const mapped = {};
        err.errors.forEach(fe => { mapped[fe.field] = fe.message; });
        setFormErrors(mapped);
      } else {
        setFormErrors({ general: err.message || 'Failed to save opportunity' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this opportunity?')) return;
    try {
      await opportunitiesApi.delete(id);
      fetchOpportunities();
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete opportunity');
    }
  };

  const handleSkillAdd = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { skill_id: '', required_proficiency: 1, importance: 1 }],
    }));
  };

  const handleSkillRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleSkillChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  };

  const selectedSkillIds = useMemo(() => {
    return new Set(formData.skills.map(s => s.skill_id).filter(Boolean));
  }, [formData.skills]);

  const getAvailableSkillsForRow = useCallback((currentSkillId) => {
    return availableSkills.filter(s => s.id === currentSkillId || !selectedSkillIds.has(s.id));
  }, [availableSkills, selectedSkillIds]);

  if (loading && opportunities.length === 0) {
    return (
      <><PageHeader title="My Opportunities" subtitle="Manage your posted opportunities" />
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
    { key: 'title', header: 'Title', width: '25%', render: (row) => (
      <button 
        type="button" 
        onClick={() => handleOpenModal(row)} 
        className="font-medium text-white hover:text-indigo-400 text-left transition-colors cursor-pointer"
      >
        {row.title}
      </button>
    )},
    { key: 'opportunity_type', header: 'Type', width: '12%', render: (row) => <Badge variant="outline" size="sm">{getOpportunityTypeLabel(row.opportunity_type)}</Badge> },
    { key: 'location', header: 'Location', width: '15%' },
    { key: 'deadline', header: 'Deadline', width: '12%', render: (row) => row.deadline ? formatDate(row.deadline) : '—' },
    { key: 'status', header: 'Status', width: '12%', render: (row) => <Badge variant="outline" size="sm" className={getStatusColor(row.status)}>{row.status}</Badge> },
    { key: 'actions', header: '', width: '15%', render: (row) => (
      <div className="flex items-center gap-2">
        <Link 
          to={`/company/applicants?opportunity_id=${row.id}`}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
          title="View Applicants"
        >
          Applicants
        </Link>
        <button onClick={() => handleOpenModal(row)} className="text-gray-400 hover:text-white p-1" title="Edit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button onClick={() => handleDelete(row.id)} className="text-gray-400 hover:text-red-400 p-1" title="Delete">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    )},
  ];

  return (
    <><PageHeader title="My Opportunities" subtitle="Create and manage your opportunities" actions={
        <Button onClick={() => handleOpenModal()} variant="primary">
          Post Opportunity
        </Button>
      } />
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl" role="alert">
          {error}
        </div>
      )}

      <Card variant="elevated">
        <CardContent className="p-0">
          {opportunities.length > 0 ? (
            <>
              <Table columns={columns} data={paginatedOpps} keyField="id" loading={loading} />
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-800">
                  <Pagination currentPage={pagination.page} totalPages={totalPages} onPageChange={handlePageChange} />
                </div>
              )}
            </>
          ) : (
            <EmptyState 
              icon="💼" 
              title="No opportunities yet" 
              description="Start by posting your first opportunity"
              action={{ onClick: () => handleOpenModal(), children: "Post Opportunity", variant: "primary" }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={handleCloseModal} title={editingOpp ? 'Edit Opportunity' : 'Post New Opportunity'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {formErrors.general && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm" role="alert">
              {formErrors.general}
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} error={formErrors.title} required />
            <Select label="Type" options={OPPORTUNITY_TYPES} value={formData.opportunity_type} onChange={e => setFormData({...formData, opportunity_type: e.target.value})} error={formErrors.opportunity_type} />
          </div>
          <Textarea label="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the role, responsibilities, requirements, and benefits..." rows={5} />
          <div className="grid gap-4 md:grid-cols-3">
            <Input label="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="City, Remote, Hybrid" />
            <Input label="Deadline" type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
            <Select label="Status" options={STATUS_OPTIONS} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} />
          </div>

          {/* Skills Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white">Required Skills</h4>
              <Button type="button" variant="secondary" size="sm" onClick={handleSkillAdd}>
                + Add Skill
              </Button>
            </div>
            <div className="space-y-3">
              {formData.skills.map((skill, index) => (
                <div key={index} className="flex gap-3 p-3 bg-gray-800/30 rounded-xl">
                  <Select
                    options={[
                      { value: '', label: 'Select Skill' },
                      ...getAvailableSkillsForRow(skill.skill_id).map(s => ({
                        value: s.id,
                        label: `${s.name} (${s.category})`,
                      })),
                    ]}
                    value={skill.skill_id}
                    onChange={e => handleSkillChange(index, 'skill_id', e.target.value)}
                    className="flex-1"
                    placeholder="Select skill"
                    error={formErrors[`skills.${index}.skill_id`]}
                  />
                  <Select
                    options={[
                      { value: 1, label: '1 - Beginner' },
                      { value: 2, label: '2 - Novice' },
                      { value: 3, label: '3 - Intermediate' },
                      { value: 4, label: '4 - Advanced' },
                      { value: 5, label: '5 - Expert' },
                    ]}
                    value={skill.required_proficiency}
                    onChange={e => handleSkillChange(index, 'required_proficiency', parseInt(e.target.value))}
                    className="w-40"
                    error={formErrors[`skills.${index}.required_proficiency`]}
                  />
                  <Select
                    options={[
                      { value: 1, label: 'Nice to have' },
                      { value: 2, label: 'Important' },
                      { value: 3, label: 'Must have' },
                    ]}
                    value={skill.importance}
                    onChange={e => handleSkillChange(index, 'importance', parseInt(e.target.value))}
                    className="w-40"
                    error={formErrors[`skills.${index}.importance`]}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleSkillRemove(index)} className="text-red-400 hover:text-red-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
              <Button variant="ghost" onClick={handleCloseModal} disabled={submitting}>Cancel</Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {editingOpp ? 'Update' : 'Post Opportunity'}
              </Button>
            </div>
        </form>
      </Modal>
    </>
  );
}