/**
 * PageHeader — lightweight title/subtitle/actions bar for use inside pages.
 * Unlike DashboardLayout, this renders NO sidebar or topbar chrome.
 */
export function PageHeader({ title, subtitle, actions }) {
  if (!title && !actions) return null;

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        {title && <h1 className="text-2xl font-bold text-white">{title}</h1>}
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
