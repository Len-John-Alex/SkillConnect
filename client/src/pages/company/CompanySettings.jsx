import { useState, useEffect } from 'react';
import { companiesApi, authApi } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { LoadingSpinner } from '../../components/ui/Loading';
import { formatDate } from '../../utils';

export default function CompanySettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    website: '',
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await companiesApi.getProfile();
        setProfile(res.profile);
        setFormData({
          company_name: res.profile?.company_name || '',
          description: res.profile?.description || '',
          website: res.profile?.website || '',
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await companiesApi.updateProfile(formData);
      setSuccess('Profile updated successfully');
      const res = await companiesApi.getProfile();
      setProfile(res.profile);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <><PageHeader title="Settings" subtitle="Manage your company account settings" />
        <Card variant="elevated"><CardContent><LoadingSpinner size="lg" className="mx-auto" /></CardContent></Card>
      </>
    );
  }

  return (
    <><PageHeader title="Settings" subtitle="Manage your company account settings" />
      {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl" role="alert">{error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl" role="status">{success}</div>}

      <Card variant="elevated" className="mb-6">
        <CardHeader><h3 className="text-lg font-semibold text-white">Company Profile</h3></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Company Name" name="company_name" value={formData.company_name} onChange={handleChange} required placeholder="Your Company Name" />
            <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe your company, mission, culture..." rows={4} />
            <Input label="Website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://yourcompany.com" />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={saving}>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card variant="elevated" className="mb-6">
        <CardHeader><h3 className="text-lg font-semibold text-white">Account Information</h3></CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><dt className="text-sm text-gray-500">Company Name</dt><dd className="text-white font-medium">{profile?.company_name}</dd></div>
              <div><dt className="text-sm text-gray-500">Contact Email</dt><dd className="text-white font-medium">{profile?.email}</dd></div>
              <div><dt className="text-sm text-gray-500">Role</dt><dd className="text-white font-medium capitalize">{profile?.role}</dd></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-800">
              <div><dt className="text-sm text-gray-500">Member Since</dt><dd className="text-white font-medium">{profile?.created_at ? formatDate(profile.created_at) : '—'}</dd></div>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader><h3 className="text-lg font-semibold text-white">Security</h3></CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Password change functionality requires backend endpoint implementation.</p>
            <Button variant="secondary" disabled>Change Password (Coming Soon)</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}