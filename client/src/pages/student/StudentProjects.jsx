import { useState, useEffect } from 'react';
import { studentsApi } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { LoadingSpinner, Skeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/States';
import { formatRelativeTime } from '../../utils';

export default function StudentProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await studentsApi.listProjects();
      setProjects(res.projects || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        title: project.title,
        description: project.description || '',
        project_url: project.project_url || '',
      });
    } else {
      setEditingProject(null);
      setFormData({ title: '', description: '', project_url: '' });
    }
    setFormErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingProject(null);
    setFormData({ title: '', description: '', project_url: '' });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title?.trim()) {
      errors.title = 'Title is required';
    }
    if (formData.project_url && formData.project_url.trim() && !isValidUrl(formData.project_url.trim())) {
      errors.project_url = 'Please enter a valid URL starting with http:// or https://';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  function isValidUrl(string) {
    if (!string || typeof string !== 'string') return false;
    if (!/^https?:\/\/[a-z0-9]/i.test(string.trim())) return false;
    try {
      const url = new URL(string.trim());
      return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
    } catch {
      return false;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || null,
        project_url: formData.project_url?.trim() || null,
      };
      if (editingProject) {
        await studentsApi.updateProject(editingProject.id, payload);
      } else {
        await studentsApi.createProject(payload);
      }
      handleCloseModal();
      fetchProjects();
    } catch (err) {
      console.error('Failed to save project:', err);
      if (err.errors) {
        const mapped = {};
        err.errors.forEach(fe => { mapped[fe.field] = fe.message; });
        setFormErrors(mapped);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await studentsApi.deleteProject(projectId);
      fetchProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <><PageHeader title="Projects" subtitle="Showcase your work and achievements" />
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
    <><PageHeader title="Projects" subtitle="Showcase your work and achievements" actions={
        <Button onClick={() => handleOpenModal()} variant="primary">
          Add Project
        </Button>
      } />
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl">
          {error}
        </div>
      )}

      {projects.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="py-16">
            <EmptyState 
              icon="🚀" 
              title="No projects yet" 
              description="Showcase your work, side projects, and achievements"
              action={{ onClick: () => handleOpenModal(), children: "Add Your First Project", variant: "primary" }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => (
            <Card key={project.id} variant="elevated">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{project.title}</h3>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenModal(project)} className="p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(project.id)} className="p-1 text-red-400 hover:text-red-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
                {project.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-3">{project.description}</p>
                )}
                <div className="flex items-center gap-3 pt-3 border-t border-gray-800">
                  <span className="text-xs text-gray-500">Created {formatRelativeTime(project.created_at)}</span>
                  {project.project_url && (
                    <a href={project.project_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300">
                      View Project →
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Project Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={handleCloseModal}
        title={editingProject ? 'Edit Project' : 'Add Project'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Project Title"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            error={formErrors.title}
            placeholder="E.g., E-commerce Platform"
            required
          />
          <Textarea
            label="Description"
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your project, technologies used, your role, and outcomes..."
            rows={4}
          />
          <Input
            label="Project URL (GitHub, Live Demo, etc.)"
            id="project_url"
            type="url"
            value={formData.project_url}
            onChange={(e) => setFormData(prev => ({ ...prev, project_url: e.target.value }))}
            error={formErrors.project_url}
            placeholder="https://github.com/username/project"
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
              <Button variant="ghost" onClick={handleCloseModal} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {editingProject ? 'Update' : 'Add Project'}
              </Button>
            </div>
        </form>
      </Modal>
    </>
  );
}