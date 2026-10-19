import { useState, useEffect } from 'react';
import { studentsApi, institutionsApi, authApi } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/Loading';
import { formatDate } from '../../utils';

const GRADUATION_YEARS = Array.from({ length: 25 }, (_, i) => 2020 + i);

export default function StudentSettings() {
  const [profile, setProfile] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    institution_id: '',
    degree: '',
    branch: '',
    graduation_year: '',
    bio: '',
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const [profileRes, instRes] = await Promise.all([
          studentsApi.getProfile(),
          institutionsApi.list(),
        ]);
        setProfile(profileRes.profile);
        setInstitutions(instRes.institutions || []);
        setFormData({
          institution_id: profileRes.profile?.institution_id || '',
          degree: profileRes.profile?.degree || '',
          branch: profileRes.profile?.branch || '',
          graduation_year: profileRes.profile?.graduation_year ? String(profileRes.profile.graduation_year) : '',
          bio: profileRes.profile?.bio || '',
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
      const payload = {
        ...formData,
        institution_id: formData.institution_id || null,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year, 10) : null,
      };
      await studentsApi.updateProfile(payload);
      setSuccess('Profile updated successfully');
      // Refresh profile to get institution name
      const res = await studentsApi.getProfile();
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
      <><PageHeader title="Settings" subtitle="Manage your profile and account settings" />
        <Card variant="elevated">
          <CardContent>
            <LoadingSpinner size="lg" className="mx-auto" />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <><PageHeader title="Settings" subtitle="Manage your profile and account settings" />
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl" role="alert">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl" role="status">
          {success}
        </div>
      )}

      {/* Profile Settings */}
      <Card variant="elevated" className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Profile Information</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Institution"
                name="institution_id"
                options={[
                  { value: '', label: 'Select Institution' },
                  ...institutions.map(inst => ({
                    value: inst.id,
                    label: `${inst.name}${inst.location ? ` (${inst.location})` : ''}`,
                  })),
                ]}
                value={formData.institution_id}
                onChange={handleChange}
              />
              <Input
                label="Degree"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                placeholder="B.Tech, M.Tech, PhD, etc."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Branch / Major"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="Computer Science, Data Science, etc."
              />
              <Select
                label="Expected Graduation Year"
                name="graduation_year"
                options={[{ value: '', label: 'Select Year' }, ...GRADUATION_YEARS.map(y => ({ value: String(y), label: String(y) }))]}
                value={formData.graduation_year}
                onChange={handleChange}
              />
            </div>
            <Textarea
              label="Bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about yourself, your interests, and career goals..."
              rows={4}
            />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card variant="elevated" className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Account Information</h3>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm text-gray-500">Name</dt>
                <dd className="text-white font-medium">{profile?.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="text-white font-medium">{profile?.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Role</dt>
                <dd className="text-white font-medium capitalize">{profile?.role}</dd>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-800">
              <div>
                <dt className="text-sm text-gray-500">Institution</dt>
                <dd className="text-white font-medium">{profile?.institution_name || 'Not set'}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Member Since</dt>
                <dd className="text-white font-medium">{profile?.created_at ? formatDate(profile.created_at) : '—'}</dd>
              </div>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Password Change (placeholder - would need backend support) */}
      <Card variant="elevated">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Security</h3>
        </CardHeader>
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