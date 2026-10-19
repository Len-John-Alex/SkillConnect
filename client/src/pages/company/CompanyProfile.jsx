import { useState, useEffect } from 'react';
import { companiesApi } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { LoadingSpinner } from '../../components/ui/Loading';

export default function CompanyProfile() {
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
      setSuccess('Company profile updated successfully');
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
      <><PageHeader title="Company Profile" subtitle="Manage your company profile" />
        <Card variant="elevated"><CardContent><LoadingSpinner size="lg" className="mx-auto" /></CardContent></Card>
      </>
    );
  }

  return (
    <><PageHeader title="Company Profile" subtitle="Manage your company profile and public information" />
      {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl" role="alert">{error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl" role="status">{success}</div>}

      <Card variant="elevated" className="mb-6">
        <CardHeader><h3 className="text-lg font-semibold text-white">Company Information</h3></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Company Name" name="company_name" value={formData.company_name} onChange={handleChange} required placeholder="Your Company Name" />
            <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe your company, mission, culture, and what makes you unique..." rows={4} />
            <Input label="Website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://yourcompany.com" />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" loading={saving}>Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader><h3 className="text-lg font-semibold text-white">Public Profile Preview</h3></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div><p className="text-sm text-gray-500">Company Name</p><p className="text-white font-medium">{profile?.company_name || 'Not set'}</p></div>
            <div><p className="text-sm text-gray-500">Description</p><p className="text-white">{profile?.description || 'Not set'}</p></div>
            <div>
              <p className="text-sm text-gray-500">Website</p>
              {profile?.website ? (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-indigo-400 hover:text-indigo-300 font-medium inline-block mt-0.5"
                >
                  {profile.website}
                </a>
              ) : (
                <p className="text-white">Not set</p>
              )}
            </div>
            <div className="pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-500">This is how students will see your company profile.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}