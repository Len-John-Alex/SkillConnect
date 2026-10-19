import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { companiesApi, opportunitiesApi, applicationsApi } from '../../api/client';
import { PageHeader } from '../../components/layout';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner, Skeleton } from '../../components/ui/Loading';
import { formatDate, formatRelativeTime, getStatusColor, getOpportunityTypeLabel } from '../../utils';

export default function CompanyOverview() {
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [profileRes, oppRes, appRes] = await Promise.all([
          companiesApi.getProfile(),
          opportunitiesApi.myList(),
          applicationsApi.list({ limit: 10 }),
        ]);
        setProfile(profileRes.profile);
        setOpportunities(profileRes.profile?.open_opportunities ? oppRes.opportunities || [] : oppRes.opportunities || []);
        setApplications(appRes.applications || []);
      } catch (err) {
        console.error('Failed to load overview:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <><PageHeader title="Overview" subtitle="Company dashboard" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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

  if (error) {
    return (
      <><PageHeader title="Overview" subtitle="Company dashboard" />
        <div className="text-center py-12">
          <p className="text-red-400">Failed to load dashboard: {error}</p>
        </div>
      </>
    );
  }

  const recentApps = applications.slice(0, 5);
  const totalApps = applications.length;
  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const shortlistedApps = applications.filter(a => a.status === 'shortlisted').length;

  return (
    <><PageHeader title="Overview" subtitle="Your company dashboard" actions={
        <Link to="/company/opportunities">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
            Post Opportunity
          </button>
        </Link>
      } />
      {/* Welcome & Stats */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center">
            <span className="text-3xl">🏢</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome, {profile?.company_name || profile?.name}!</h2>
            <p className="text-gray-400 text-sm">Manage your opportunities and review applications</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-400">{opportunities.length}</p>
                <p className="text-gray-500 text-sm">Active Opportunities</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <span className="text-2xl">💼</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-amber-400">{totalApps}</p>
                <p className="text-gray-500 text-sm">Total Applications</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-yellow-400">{pendingApps}</p>
                <p className="text-gray-500 text-sm">Pending Review</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-400">{shortlistedApps}</p>
                <p className="text-gray-500 text-sm">Shortlisted</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Opportunities */}
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Your Opportunities</h3>
              <Link to="/company/opportunities" className="text-sm text-blue-400 hover:text-blue-300">View all →</Link>
            </div>
            {opportunities.length > 0 ? (
              <div className="space-y-3">
                {opportunities.slice(0, 5).map(opp => (
                  <Link key={opp.id} to={`/company/opportunities/${opp.id}`} className="block p-3 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{opp.title}</p>
                        <p className="text-xs text-gray-400">{getOpportunityTypeLabel(opp.opportunity_type)} • {formatRelativeTime(opp.created_at)}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(opp.status)}>
                        {opp.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No opportunities posted yet</p>
                <Link to="/company/opportunities" className="text-blue-400 hover:text-blue-300 mt-2 inline-block">Create your first opportunity</Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Applications</h3>
              <Link to="/company/applicants" className="text-sm text-blue-400 hover:text-blue-300">View all →</Link>
            </div>
            {recentApps.length > 0 ? (
              <div className="space-y-3">
                {recentApps.map(app => (
                  <div key={app.id} className="p-3 bg-gray-800/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{app.title}</p>
                        <p className="text-xs text-gray-400">{app.student_name} • {app.student_email}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(app.status)}>
                        {app.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Applied {formatRelativeTime(app.applied_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No applications yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}