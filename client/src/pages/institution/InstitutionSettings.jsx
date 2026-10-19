import { useState } from 'react';
import { PageHeader } from '../../components/layout';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';

export default function InstitutionSettings() {
  const [formData, setFormData] = useState({
    name: 'Indian Institute of Technology Bombay',
    code: 'IITB',
    domain: 'iitb.ac.in',
    contactEmail: 'admin@iitb.ac.in',
    address: 'Powai, Mumbai, Maharashtra 400076',
    inviteCode: 'INST_2026_SKILLCONNECT',
  });
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(formData.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage institutional configuration, administrator contact, and student enrollment keys" />

      {saved && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
          Institution profile and settings updated successfully.
        </div>
      )}

      {/* Verification Invite Key */}
      <Card variant="elevated" className="mb-6 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>🔑</span> Institutional Verification Key
              </h3>
              <p className="text-xs text-gray-400 mt-1">Provide this registration code to faculty and students for automatic campus verification</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleCopyCode}>
              {copied ? '✓ Copied!' : 'Copy Code'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-gray-900 rounded-xl font-mono text-purple-300 text-sm tracking-wider flex items-center justify-between border border-gray-800">
            <span>{formData.inviteCode}</span>
            <span className="text-xs text-emerald-400 font-sans font-semibold">Active & Verified</span>
          </div>
        </CardContent>
      </Card>

      {/* Institution Details */}
      <Card variant="elevated">
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Campus Information</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Institution Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <Input
                label="Institution Code / Abbreviation"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Academic Email Domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                placeholder="university.edu"
                required
              />
              <Input
                label="Official Admin Email"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange}
                required
              />
            </div>

            <Textarea
              label="Campus Address & Location"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
            />

            <div className="flex justify-end pt-4">
              <Button type="submit" variant="primary">
                Save Institutional Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
