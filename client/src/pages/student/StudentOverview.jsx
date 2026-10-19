import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { studentsApi, opportunitiesApi, applicationsApi, skillsApi } from '../../api/client';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { LoadingSpinner, Skeleton } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/States';
import { formatDate, formatRelativeTime, getStatusColor, getProficiencyLabel, getProficiencyColor, getOpportunityTypeLabel } from '../../utils';

export default function StudentOverview() {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [skillProgress, setSkillProgress] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [
          profileRes,
          skillsRes,
          opportunitiesRes,
          applicationsRes,
          progressRes,
          projectsRes,
        ] = await Promise.all([
          studentsApi.getProfile(),
          studentsApi.listSkills(),
          opportunitiesApi.list({ limit: 5, status: 'open' }),
          applicationsApi.list({ limit: 5 }),
          studentsApi.getSkillProgress(),
          studentsApi.listProjects(),
        ]);
        
        setProfile(profileRes.profile);
        setSkills(profileRes.profile?.skills || []);
        setOpportunities(opportunitiesRes.opportunities || []);
        setApplications(applicationsRes.applications || []);
        setSkillProgress(progressRes.progress || []);
        setProjects(projectsRes.projects || []);
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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} variant="elevated">
            <CardContent>
              <Skeleton variant="card" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState 
        icon="⚠️" 
        title="Failed to load dashboard" 
        description={error}
        action={{ onClick: () => window.location.reload(), children: 'Retry' }}
      />
    );
  }

  const topSkills = skills.slice(0, 5);
  const recentApplications = applications.slice(0, 5);
  const inProgressSkills = skillProgress.filter(p => p.status === 'in_progress').slice(0, 3);
  const recentProjects = projects.slice(0, 3);

  return (
    <div>
      {/* Welcome & Stats */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <span className="text-3xl">🎓</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome back, {profile?.name?.split(' ')[0] || 'Student'}!</h2>
            <p className="text-gray-400 text-sm">Here's what's happening with your learning journey</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-400">{skills.length}</p>
                <p className="text-gray-500 text-sm">Skills Tracked</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-400">{opportunities.length}</p>
                <p className="text-gray-500 text-sm">Open Opportunities</p>
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
                <p className="text-3xl font-bold text-amber-400">{applications.length}</p>
                <p className="text-gray-500 text-sm">Applications</p>
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
                <p className="text-3xl font-bold text-purple-400">{projects.length}</p>
                <p className="text-gray-500 text-sm">Projects</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Skills */}
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Top Skills</h3>
              <Link to="/student/skills" className="text-sm text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            {topSkills.length > 0 ? (
              <div className="space-y-3">
                {topSkills.map((skill) => (
                  <div key={skill.id || skill.skill_id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{skill.category === 'Programming' ? '💻' : skill.category === 'Frontend' ? '🎨' : skill.category === 'Backend' ? '⚙️' : skill.category === 'Database' ? '🗄️' : skill.category === 'AI/ML' ? '🤖' : skill.category === 'Data Science' ? '📊' : skill.category === 'DevOps' ? '☁️' : '🛠️'}</span>
                      <div>
                        <p className="font-medium text-white">{skill.name}</p>
                        <p className="text-xs text-gray-500">{skill.category}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={getProficiencyColor(skill.proficiency_level)}>
                      {getProficiencyLabel(skill.proficiency_level)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon="🎯" 
                title="No skills yet" 
                description="Start building your skill passport"
                action={{ to: "/student/skills", children: "Add Skills" }}
              />
            )}
          </CardContent>
        </Card>

        {/* Skill Progress */}
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Learning Progress</h3>
              <Link to="/student/skills" className="text-sm text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            {inProgressSkills.length > 0 ? (
              <div className="space-y-4">
                {inProgressSkills.map((progress) => (
                  <div key={progress.skill_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{progress.name}</span>
                      <Badge variant="outline" className={getStatusColor(progress.status)}>
                        {progress.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          progress.status === 'completed' ? 'bg-emerald-500' :
                          progress.status === 'in_progress' ? 'bg-blue-500' :
                          'bg-gray-600'
                        }`}
                        style={{ width: `${progress.status === 'completed' ? 100 : progress.status === 'in_progress' ? 50 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon="📚" 
                title="No active learning" 
                description="Track your progress on skills"
                action={{ to: "/student/learning", children: "Browse Resources" }}
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Opportunities */}
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recommended Opportunities</h3>
              <Link to="/student/opportunities" className="text-sm text-indigo-400 hover:text-indigo-300">Browse all →</Link>
            </div>
            {opportunities.length > 0 ? (
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <Link key={opp.id} to={`/student/opportunities/${opp.id}`} className="block p-3 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{opp.title}</p>
                        <p className="text-xs text-gray-400">{opp.company_display_name || opp.company_name} • {getOpportunityTypeLabel(opp.opportunity_type)}</p>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/20 text-emerald-300 text-xs">
                        Open
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {opp.skills?.slice(0, 3).map((s) => (
                        <Badge key={s.id} variant="outline" size="sm" className="bg-gray-700 text-gray-400">
                          {s.name}
                        </Badge>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon="💼" 
                title="No open opportunities" 
                description="Check back later for new postings"
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Applications</h3>
              <Link to="/student/applications" className="text-sm text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            {recentApplications.length > 0 ? (
              <div className="space-y-3">
                {recentApplications.map((app) => (
                  <div key={app.id} className="p-3 bg-gray-800/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{app.title}</p>
                        <p className="text-xs text-gray-400">{app.company_display_name || app.company_name}</p>
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
              <EmptyState 
                icon="📋" 
                title="No applications yet" 
                description="Apply to opportunities to see them here"
                action={{ to: "/student/opportunities", children: "Browse Opportunities" }}
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Recent Projects</h3>
              <Link to="/student/projects" className="text-sm text-indigo-400 hover:text-indigo-300">View all →</Link>
            </div>
            {recentProjects.length > 0 ? (
              <div className="space-y-3">
                {recentProjects.map((proj) => (
                  <Link key={proj.id} to="/student/projects" className="block p-3 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors">
                    <p className="font-medium text-white">{proj.title}</p>
                    {proj.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{proj.description}</p>}
                    <p className="text-xs text-gray-500 mt-2">Updated {formatRelativeTime(proj.created_at)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState 
                icon="🚀" 
                title="No projects yet" 
                description="Showcase your work"
                action={{ to: "/student/projects", children: "Add Project" }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}