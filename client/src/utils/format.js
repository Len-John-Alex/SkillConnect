export function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export function truncate(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getProficiencyLabel(level) {
  const labels = {
    1: 'Beginner',
    2: 'Novice',
    3: 'Intermediate',
    4: 'Advanced',
    5: 'Expert',
  };
  return labels[level] || 'Unknown';
}

export function getProficiencyColor(level) {
  const colors = {
    1: 'bg-red-500/20 text-red-300',
    2: 'bg-amber-500/20 text-amber-300',
    3: 'bg-blue-500/20 text-blue-300',
    4: 'bg-indigo-500/20 text-indigo-300',
    5: 'bg-emerald-500/20 text-emerald-300',
  };
  return colors[level] || 'bg-gray-500/20 text-gray-300';
}

export function getStatusColor(status) {
  const colors = {
    pending: 'bg-amber-500/20 text-amber-300',
    shortlisted: 'bg-blue-500/20 text-blue-300',
    accepted: 'bg-emerald-500/20 text-emerald-300',
    rejected: 'bg-red-500/20 text-red-300',
    withdrawn: 'bg-gray-500/20 text-gray-300',
    draft: 'bg-gray-500/20 text-gray-300',
    open: 'bg-emerald-500/20 text-emerald-300',
    closed: 'bg-blue-500/20 text-blue-300',
    cancelled: 'bg-red-500/20 text-red-300',
    not_started: 'bg-gray-500/20 text-gray-300',
    in_progress: 'bg-blue-500/20 text-blue-300',
    completed: 'bg-emerald-500/20 text-emerald-300',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-300';
}

export function getOpportunityTypeLabel(type) {
  const labels = {
    internship: 'Internship',
    project: 'Project',
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
  };
  return labels[type] || type;
}

export function getResourceTypeIcon(type) {
  const icons = {
    video: '🎥',
    article: '📄',
    course: '📚',
    book: '📖',
    tool: '🔧',
    other: '📎',
  };
  return icons[type] || '📎';
}

export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}