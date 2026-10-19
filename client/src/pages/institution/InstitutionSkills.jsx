import { useState, useMemo } from 'react';
import { PageHeader } from '../../components/layout';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';

export default function InstitutionSkills() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const catalogSkills = [
    { id: '1', name: 'JavaScript', category: 'Programming', level: 'Core', demand: 'High', coverage: '94%', mappedCourses: 'CS101, CS202' },
    { id: '2', name: 'React', category: 'Frontend', level: 'Advanced', demand: 'High', coverage: '88%', mappedCourses: 'CS305 Web Apps' },
    { id: '3', name: 'Node.js', category: 'Backend', level: 'Intermediate', demand: 'High', coverage: '82%', mappedCourses: 'CS310 Cloud Services' },
    { id: '4', name: 'Python', category: 'Programming', level: 'Core', demand: 'Very High', coverage: '96%', mappedCourses: 'CS102, DS201' },
    { id: '5', name: 'PostgreSQL', category: 'Database', level: 'Intermediate', demand: 'Moderate', coverage: '75%', mappedCourses: 'CS204 DBMS' },
    { id: '6', name: 'Docker', category: 'DevOps', level: 'Advanced', demand: 'High', coverage: '68%', mappedCourses: 'CS401 DevOps' },
    { id: '7', name: 'Machine Learning', category: 'AI & Data', level: 'Advanced', demand: 'Very High', coverage: '72%', mappedCourses: 'AI301 ML Systems' },
    { id: '8', name: 'TypeScript', category: 'Programming', level: 'Intermediate', demand: 'High', coverage: '64%', mappedCourses: 'CS305 Web Apps' },
  ];

  const filteredSkills = useMemo(() => {
    return catalogSkills.filter((s) => {
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !categoryFilter || s.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [search, categoryFilter]);

  const columns = [
    {
      key: 'name',
      header: 'Skill Name',
      width: '25%',
      render: (row) => (
        <div>
          <span className="font-medium text-white">{row.name}</span>
          <p className="text-xs text-gray-500">{row.mappedCourses}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      width: '20%',
      render: (row) => (
        <Badge variant="outline" size="sm" className="bg-gray-800 text-gray-300">
          {row.category}
        </Badge>
      ),
    },
    {
      key: 'level',
      header: 'Curriculum Tier',
      width: '20%',
      render: (row) => (
        <span className="text-sm text-gray-300">{row.level}</span>
      ),
    },
    {
      key: 'demand',
      header: 'Industry Demand',
      width: '18%',
      render: (row) => (
        <Badge
          variant="outline"
          size="sm"
          className={
            row.demand === 'Very High' || row.demand === 'High'
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-blue-500/20 text-blue-300'
          }
        >
          {row.demand}
        </Badge>
      ),
    },
    {
      key: 'coverage',
      header: 'Student Reach',
      width: '17%',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-indigo-400 font-semibold">{row.coverage}</span>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Skills Catalog" subtitle="Institutional curriculum competencies aligned with industry hiring criteria" />

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{catalogSkills.length}</p>
            <p className="text-xs text-gray-400 mt-1">Accredited Skills</p>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {catalogSkills.filter(s => s.demand.includes('High')).length}
            </p>
            <p className="text-xs text-gray-400 mt-1">High-Demand Aligned</p>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-indigo-400">82.3%</p>
            <p className="text-xs text-gray-400 mt-1">Average Student Mastery</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card variant="elevated" className="mb-6">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Search Catalog"
              placeholder="Search skill by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              label="Skill Domain"
              options={[
                { value: '', label: 'All Domains' },
                { value: 'Programming', label: 'Programming' },
                { value: 'Frontend', label: 'Frontend' },
                { value: 'Backend', label: 'Backend' },
                { value: 'Database', label: 'Database' },
                { value: 'DevOps', label: 'DevOps' },
                { value: 'AI & Data', label: 'AI & Data' },
              ]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Skills Table */}
      <Card variant="elevated">
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={filteredSkills}
            emptyMessage="No skills found matching filter criteria"
          />
        </CardContent>
      </Card>
    </>
  );
}
