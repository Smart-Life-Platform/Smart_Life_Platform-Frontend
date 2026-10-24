export default function TaskFilters({ filters, onChange, statuses, categories, priorities }) {
  const setFilter = (field) => (event) => onChange({ ...filters, [field]: event.target.value });

  return (
    <>
      <div className="search-box">
        <span aria-hidden="true">⌕</span>
        <input value={filters.search} onChange={setFilter('search')} placeholder="Search tasks…" aria-label="Search tasks" />
      </div>
      <div className="filter-grid">
        <select aria-label="Filter status" value={filters.status} onChange={setFilter('status')}>
          <option value="">All statuses</option>
          {statuses.map((status) => <option key={status.id} value={status.id}>{status.name}</option>)}
        </select>
        <select aria-label="Filter category" value={filters.category} onChange={setFilter('category')}>
          <option value="">All categories</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <select aria-label="Filter priority" value={filters.priority} onChange={setFilter('priority')}>
          <option value="">All priorities</option>
          {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
        </select>
        <select aria-label="Sort tasks" value={filters.ordering} onChange={setFilter('ordering')}>
          <option value="due_date">Sort by date</option>
          <option value="priority">Sort by priority</option>
          <option value="created_at">Sort by creation date</option>
          <option value="-created_at">Newest first</option>
        </select>
      </div>
    </>
  );
}