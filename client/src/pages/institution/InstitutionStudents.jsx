import { useState, useMemo } from 'react';
import { PageHeader } from '../../components/layout';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';

export default function InstitutionStudents() {
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const studentsList = [
    { id: '1', name: 'Arun Sharma', email: 'arun.sharma@student.iitb.ac.in', degree: 'B.Tech', branch: 'Computer Science', year: 2026, skillsCount: 8, status: 'verified' },
    { id: '2', name: 'Priya Patel', email: 'priya.patel@student.iitb.ac.in', degree: 'B.Tech', branch: 'Information Technology', year: 2025, skillsCount: 6, status: 'verified' },
    { id: '3', name: 'Rohit Kumar', email: 'rohit.kumar@student.iitb.ac.in', degree: 'M.Tech', branch: 'Data Science', year: 2025, skillsCount: 9, status: 'verified' },
    { id: '4', name: 'Ananya Sen', email: 'ananya.sen@student.iitb.ac.in', degree: 'B.Tech', branch: 'Electronics', year: 2026, skillsCount: 4, status: 'pending' },
    { id: '5', name: 'Kavita Reddy', email: 'kavita.reddy@student.iitb.ac.in', degree: 'B.Tech', branch: 'Computer Science', year: 2027, skillsCount: 5, status: 'verified' },
    { id: '6', name: 'Devendra Joshi', email: 'devendra.j@student.iitb.ac.in', degree: 'B.Tech', branch: 'Mechanical', year: 2026, skillsCount: 3, status: 'pending' },
  ];

  const filteredStudents = useMemo(() => {
    return studentsList.filter((s) => {
      const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
      const matchDept = !departmentFilter || s.branch === departmentFilter;
      return matchSearch && matchDept;
    });
  }, [search, departmentFilter]);

  const columns = [
    {
      key: 'name',
      header: 'Student',
      width: '30%',
      render: (row) => (
        <div>
          <p className="font-medium text-white">{row.name}</p>
          <p className="text-xs text-gray-400">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'degree',
      header: 'Degree & Branch',
      width: '25%',
      render: (row) => (
        <div>
          <p className="text-sm text-gray-200">{row.degree} in {row.branch}</p>
          <p className="text-xs text-gray-500">Graduation: Class of {row.year}</p>
        </div>
      ),
    },
    {
      key: 'skills',
      header: 'Skills Verified',
      width: '18%',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-indigo-300 font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          🎯 {row.skillsCount} skills
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '15%',
      render: (row) => (
        <Badge
          variant="outline"
          size="sm"
          className={row.status === 'verified' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}
        >
          {row.status === 'verified' ? 'Verified' : 'Pending Review'}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Students" subtitle="Manage enrolled students, academic credentials, and skill passports" />

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{studentsList.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total Enrolled</p>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {studentsList.filter(s => s.status === 'verified').length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Verified Passports</p>
          </CardContent>
        </Card>
        <Card variant="elevated">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">
              {studentsList.filter(s => s.status === 'pending').length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Pending Verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="elevated" className="mb-6">
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Search Students"
              placeholder="Search by student name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              label="Department / Branch"
              options={[
                { value: '', label: 'All Departments' },
                { value: 'Computer Science', label: 'Computer Science' },
                { value: 'Information Technology', label: 'Information Technology' },
                { value: 'Data Science', label: 'Data Science' },
                { value: 'Electronics', label: 'Electronics' },
                { value: 'Mechanical', label: 'Mechanical' },
              ]}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card variant="elevated">
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={filteredStudents}
            emptyMessage="No students found matching the selected filters"
          />
        </CardContent>
      </Card>
    </>
  );
}
