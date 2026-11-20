import { useState } from 'react';
import { UilBars, UilFileAlt, UilFilter, UilSort } from '@iconscout/react-unicons';

export default function KanbanToolbar({
  view = 'board',
  onViewChange,
  filters,
  onFilterChange,
  statuses = [],
  categories = [],
  priorities = [],
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const activeFilters = [filters.status, filters.category, filters.priority, filters.search].filter(Boolean).length;

  return (
    <div className="board-tabs">
      <button
        type="button"
        className={view === 'board' ? 'selected' : ''}
        onClick={() => onViewChange?.('board')}
      >
        <UilBars size="16" /> Board
      </button>
      <button
        type="button"
        className={view === 'list' ? 'selected' : ''}
        onClick={() => onViewChange?.('list')}
      >
        <UilFileAlt size="16" /> List
      </button>

      <div className="board-tools">
        <div className="board-menu">
          <button
            type="button"
            className={`ghost-button${activeFilters ? ' is-active' : ''}`}
            aria-expanded={filtersOpen}
            onClick={() => { setFiltersOpen((open) => !open); setSortOpen(false); }}
          >
            <UilFilter size="15" /> Filter{activeFilters ? ` (${activeFilters})` : ''}
          </button>
          {filtersOpen && (
            <div className="board-menu-list board-filter-list">
              <label>
                Search
                <input className="board-control" value={filters.search} onChange={onFilterChange('search')} placeholder="Search tasks" />
              </label>
              <label>
                Status
                <select className="board-control" value={filters.status} onChange={onFilterChange('status')}>
                  <option value="">All statuses</option>
                  {statuses.map((status) => <option value={status.id} key={status.id}>{status.name}</option>)}
                </select>
              </label>
              <label>
                Category
                <select className="board-control" value={filters.category} onChange={onFilterChange('category')}>
                  <option value="">All categories</option>
                  {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label>
                Priority
                <select className="board-control" value={filters.priority} onChange={onFilterChange('priority')}>
                  <option value="">All priorities</option>
                  {priorities.map((priority) => <option value={priority} key={priority}>{priority}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="board-menu">
          <button
            type="button"
            className="ghost-button"
            aria-expanded={sortOpen}
            onClick={() => { setSortOpen((open) => !open); setFiltersOpen(false); }}
          >
            <UilSort size="15" /> Sort
          </button>
          {sortOpen && (
            <div className="board-menu-list" role="menu">
              <button type="button" onClick={() => { onFilterChange('ordering')({ target: { value: 'position' } }); setSortOpen(false); }}>Manual</button>
              <button type="button" onClick={() => { onFilterChange('ordering')({ target: { value: 'due_date' } }); setSortOpen(false); }}>Due date</button>
              <button type="button" onClick={() => { onFilterChange('ordering')({ target: { value: '-created_at' } }); setSortOpen(false); }}>Newest</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
