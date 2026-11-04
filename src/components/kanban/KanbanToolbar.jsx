import {
  UilBars,
  UilCalendarAlt,
  UilFileAlt,
  UilSearch,
} from '@iconscout/react-unicons';

export default function KanbanToolbar({
  filters,
  onFilterChange,
  statuses = [],
  categories = [],
  priorities = [],
}) {
  return (
    <div className="board-tabs">
      <button type="button" className="selected">
        <UilBars size="16" /> Board
      </button>
      <button type="button">
        <UilFileAlt size="16" /> List
      </button>
      <a href="/planner?view=calendar">
        <UilCalendarAlt size="16" /> Calendar
      </a>

      <div className="board-tools">
        <label className="board-search">
          <UilSearch size="15" />
          <input
            className="board-control"
            value={filters.search}
            onChange={onFilterChange('search')}
            placeholder="Search tasks"
          />
        </label>

        <select
          className="board-control"
          value={filters.status}
          onChange={onFilterChange('status')}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {statuses.map((status) => (
            <option value={status.id} key={status.id}>
              {status.name}
            </option>
          ))}
        </select>

        <select
          className="board-control"
          value={filters.category}
          onChange={onFilterChange('category')}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option value={category.id} key={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          className="board-control"
          value={filters.priority}
          onChange={onFilterChange('priority')}
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          {priorities.map((priority) => (
            <option value={priority} key={priority}>
              {priority}
            </option>
          ))}
        </select>

        <select
          className="board-control"
          value={filters.ordering}
          onChange={onFilterChange('ordering')}
          aria-label="Sort tasks"
        >
          <option value="position">Sort</option>
          <option value="due_date">Due date</option>
          <option value="-created_at">Newest</option>
        </select>

        <span>Group by: Status</span>
      </div>
    </div>
  );
}

