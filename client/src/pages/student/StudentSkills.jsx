import { useState, useEffect } from 'react';
import { studentsApi, skillsApi } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner, Skeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/States';
import { getProficiencyLabel, getProficiencyColor, getStatusColor } from '../../utils';

const PROFICIENCY_OPTIONS = [
  { value: 1, label: '1 - Beginner' },
  { value: 2, label: '2 - Novice' },
  { value: 3, label: '3 - Intermediate' },
  { value: 4, label: '4 - Advanced' },
  { value: 5, label: '5 - Expert' },
];

const CATEGORY_OPTIONS = [
  'Programming',
  'Frontend',
  'Backend',
  'Database',
  'AI/ML',
  'Data Science',
  'DevOps',
  'Soft Skills',
  'Other',
];

export default function StudentSkills() {
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [formData, setFormData] = useState({
    skill_id: '',
    proficiency_level: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [skillsRes, allSkillsRes] = await Promise.all([
        studentsApi.listSkills(),
        skillsApi.list({ limit: 100 }),
      ]);
      setSkills(skillsRes.skills || []);
      setAllSkills(allSkillsRes.skills || []);
    } catch (err) {
      console.error('Failed to load skills:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (skill = null) => {
    if (skill) {
      setEditingSkill(skill);
      setFormData({
        skill_id: skill.skill_id || skill.id,
        proficiency_level: skill.proficiency_level,
      });
    } else {
      setEditingSkill(null);
      setFormData({
        skill_id: '',
        proficiency_level: 1,
      });
    }
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSkill(null);
    setFormData({ skill_id: '', proficiency_level: 1 });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.skill_id) {
      errors.skill_id = 'Please select a skill';
    } else if (skills.some(s => (s.skill_id || s.id) === formData.skill_id && (s.skill_id || s.id) !== (editingSkill?.skill_id || editingSkill?.id))) {
      errors.skill_id = 'This skill is already in your profile';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingSkill) {
        const currentSkillId = editingSkill.skill_id || editingSkill.id;
        if (currentSkillId !== formData.skill_id) {
          await studentsApi.removeSkill(currentSkillId);
          await studentsApi.addSkill({ skill_id: formData.skill_id, proficiency_level: formData.proficiency_level });
        } else {
          await studentsApi.updateSkill(currentSkillId, { proficiency_level: formData.proficiency_level });
        }
      } else {
        await studentsApi.addSkill(formData);
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      console.error('Failed to save skill:', err);
      if (err.errors) {
        const mapped = {};
        err.errors.forEach(fe => { mapped[fe.field] = fe.message; });
        setFormErrors(mapped);
      } else {
        setFormErrors({ general: err.message || 'Failed to save skill' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (skillId) => {
    if (!window.confirm('Remove this skill from your profile?')) return;
    try {
      await studentsApi.removeSkill(skillId);
      fetchData();
    } catch (err) {
      console.error('Failed to remove skill:', err);
      alert('Failed to remove skill');
    }
  };

  if (loading) {
    return (
      <><PageHeader title="Skill Passport" subtitle="Track and manage your skills" />
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

  // Group skills by category
  const skillsByCategory = skills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  const userSkillIdSet = new Set(
    skills.map(us => us.skill_id || us.id).filter(Boolean)
  );

  const availableSkills = allSkills.filter(s => 
    !userSkillIdSet.has(s.id) && !userSkillIdSet.has(s.skill_id)
  );

  return (
    <><PageHeader title="Skill Passport" subtitle="Track your skills and proficiency levels" actions={
        <Button onClick={() => handleOpenModal()} variant="primary">
          Add Skill
        </Button>
      } />
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
          {error}
        </div>
      )}

      {Object.keys(skillsByCategory).length === 0 ? (
        <Card variant="elevated">
          <CardContent className="py-16">
            <EmptyState 
              icon="🎯" 
              title="No skills added yet" 
              description="Start building your skill passport by adding skills you know or are learning"
              action={{ onClick: () => handleOpenModal(), children: "Add Your First Skill", variant: "primary" }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
            <Card key={category} variant="elevated">
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white capitalize">{category}</h3>
                  <span className="text-sm text-gray-500">{categorySkills.length} skill{categorySkills.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-3">
                  {categorySkills.map((skill) => {
                    const sid = skill.skill_id || skill.id;
                    return (
                      <div key={sid} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-xl">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg">{category === 'Programming' ? '💻' : category === 'Frontend' ? '🎨' : category === 'Backend' ? '⚙️' : category === 'Database' ? '🗄️' : category === 'AI/ML' ? '🤖' : category === 'Data Science' ? '📊' : category === 'DevOps' ? '☁️' : '🛠️'}</span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{skill.name}</p>
                            <p className="text-xs text-gray-500">Proficiency: {getProficiencyLabel(skill.proficiency_level)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={getProficiencyColor(skill.proficiency_level)}>
                            Level {skill.proficiency_level}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenModal(skill)}
                            className="text-gray-400 hover:text-indigo-400"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemove(sid)}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Skill Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={handleCloseModal}
        title={editingSkill ? 'Update Skill Proficiency' : 'Add Skill to Passport'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.general && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm" role="alert">
              {formErrors.general}
            </div>
          )}
          <Select
            label="Skill"
            id="skill_id"
            options={editingSkill 
              ? [
                  { value: editingSkill.skill_id || editingSkill.id, label: `${editingSkill.name}${editingSkill.category ? ` (${editingSkill.category})` : ''}` },
                  ...availableSkills.map(s => ({ value: s.id, label: `${s.name}${s.category ? ` (${s.category})` : ''}` }))
                ]
              : availableSkills.map(s => ({ value: s.id, label: `${s.name}${s.category ? ` (${s.category})` : ''}` }))}
            value={formData.skill_id}
            onChange={(e) => setFormData(prev => ({ ...prev, skill_id: e.target.value }))}
            error={formErrors.skill_id}
            helperText={editingSkill ? 'Adjust your proficiency level or switch to a different skill.' : undefined}
            placeholder="Select a skill"
          />
          <Select
            label="Proficiency Level"
            id="proficiency_level"
            options={PROFICIENCY_OPTIONS}
            value={formData.proficiency_level}
            onChange={(e) => setFormData(prev => ({ ...prev, proficiency_level: parseInt(e.target.value) }))}
            error={formErrors.proficiency_level}
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
              <Button variant="ghost" onClick={handleCloseModal} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {editingSkill ? 'Update' : 'Add Skill'}
              </Button>
            </div>
        </form>
      </Modal>
    </>
  );
}