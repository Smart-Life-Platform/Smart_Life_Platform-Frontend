import { useEffect, useRef, useState } from 'react';
import { UilFileAlt, UilFilter, UilSort } from '@iconscout/react-unicons';
import { priorityName } from '../../utils/priority';

const SORT_OPTIONS = [
  { value: 'due_date', label: 'Due date — earliest first' },
  { value: '-due_date', label: 'Due date — latest first' },
  { value: '-priority', label: 'Priority — highest first' },
  { value: 'priority', label: 'Priority — lowest first' },
  { value: '-created_at', label: 'Date created — newest first' },
  { value: 'created_at', label: 'Date created — oldest first' },
  { value: 'title', label: 'Alphabetical — A to Z' },
  { value: '-title', label: 'Alphabetical — Z to A' },
];

const DUE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
  { value: 'next_week', label: 'Next week' },
  { value: 'none', label: 'No due date' },
];

const EMPTY_FILTERS = { status: [], category: [], priority: [], assignee: [], due: [] };

const asList = (value) => (Array.isArray(value) ? value : value ? [String(value)] : []);

const toggleValue = (list, value) => (
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
);

const uniqueBy = (items, keyOf) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyOf(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function KanbanToolbar({
  view = 'board',
  onViewChange,
  filters = {},
  onApplyFilters,
  onResetFilters,
  onOrderingChange,
  statuses = [],
  categories = [],
  tasks = [],
  assignees = [],
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const rootRef = useRef(null);

  const activeFilters = ['status', 'category', 'priority', 'assignee', 'due']
    .reduce((total, key) => total + asList(filters[key]).length, 0);

  useEffect(() => {
    if (!filterOpen && !sortOpen) return undefined;
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setFilterOpen(false);
        setSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [filterOpen, sortOpen]);

  useEffect(() => {
    if (!filterOpen) return;
    setDraft({
      status: asList(filters.status),
      category: asList(filters.category),
      priority: asList(filters.priority),
      assignee: asList(filters.assignee),
      due: asList(filters.due),
    });
  }, [filterOpen, filters]);

  // Options come from what the tasks actually contain.
  const taskStatusIds = new Set(tasks.map((task) => String(task.status_id ?? task.status?.id ?? task.status ?? '')));
  const statusOptions = (taskStatusIds.size
    ? statuses.filter((status) => taskStatusIds.has(String(status.id)))
    : statuses
  ).map((status) => ({ value: String(status.id), label: status.name }));

  const taskPriorities = uniqueBy(tasks.map((task) => priorityName(task.priority)).filter(Boolean), (value) => value);
  const priorityOptions = (taskPriorities.length
    ? ['low', 'medium', 'high', 'critical'].filter((priority) => taskPriorities.includes(priority))
    : ['low', 'medium', 'high', 'critical']
  ).map((priority) => ({ value: priority, label: priority.charAt(0).toUpperCase() + priority.slice(1) }));

  const taskCategoryIds = new Set(tasks.map((task) => String(task.category_id ?? task.category?.id ?? task.category ?? '')));
  const categoryOptions = (taskCategoryIds.size
    ? categories.filter((category) => taskCategoryIds.has(String(category.id)))
    : categories
  ).map((category) => ({ value: String(category.id), label: category.name }));

  const assigneeNames = new Map(assignees.map((member) => [String(member.id), member.name]));
  const taskAssigneeIds = uniqueBy(
    tasks.map((task) => {
      const id = task.assignee_id ?? task.assignee?.id ?? task.assignee;
      return id === null || id === undefined || id === '' ? '' : String(id);
    }),
    (value) => value
  );
  const assigneeOptions = (taskAssigneeIds.length ? taskAssigneeIds : [''])
    .map((id) => ({ value: id || 'unassigned', label: id ? (assigneeNames.get(id) || 'Assigned') : 'Unassigned' }));

  const applyFilters = () => {
    onApplyFilters?.(draft);
    setFilterOpen(false);
  };

  const resetFilters = () => {
    setDraft(EMPTY_FILTERS);
    onResetFilters?.();
    setFilterOpen(false);
  };

  const chooseSort = (value) => {
    onOrderingChange?.(value);
    setSortOpen(false);
  };

  return (
    <div className="board-tabs" ref={rootRef}>
      <button
        type="button"
        className={`board-tab${view === 'board' ? ' selected' : ''}`}
        onClick={() => onViewChange?.('board')}
      >
        <span className="nav-icon icon-task-board" aria-hidden="true" /> Board
      </button>
      <button
        type="button"
        className={`board-tab${view === 'list' ? ' selected' : ''}`}
        onClick={() => onViewChange?.('list')}
      >
        <UilFileAlt size="16" /> List
      </button>

      <div className="board-tools">
        <div className="board-menu">
          <button
            type="button"
            className={`board-tool-button${activeFilters ? ' is-active' : ''}`}
            aria-expanded={filterOpen}
            onClick={() => { setFilterOpen((open) => !open); setSortOpen(false); }}
          >
            <UilFilter size="14" /> Filter{activeFilters ? ` (${activeFilters})` : ''}
          </button>
          {filterOpen && (
            <div className="board-popover filter-surface" role="dialog" aria-label="Filter tasks">
              <h3>Filter tasks</h3>
              {[
                { key: 'status', title: 'Status', options: statusOptions },
                { key: 'priority', title: 'Priority', options: priorityOptions },
                { key: 'category', title: 'Category', options: categoryOptions },
                { key: 'assignee', title: 'Assignee', options: assigneeOptions },
                { key: 'due', title: 'Due date', options: DUE_OPTIONS },
              ].map(({ key, title, options }) => (
                <div className="filter-section" key={key}>
                  <h4>{title}</h4>
                  <div className="filter-options">
                    {options.length === 0 && <span className="filter-empty">No values yet</span>}
                    {options.map((option) => {
                      const checked = draft[key].includes(option.value);
                      return (
                        <button
                          type="button"
                          key={option.value}
                          className={`filter-option${checked ? ' is-checked' : ''}`}
                          aria-pressed={checked}
                          onClick={() => setDraft((current) => ({
                            ...current,
                            [key]: toggleValue(current[key], option.value),
                          }))}
                        >
                          <span className="filter-check" aria-hidden="true">{checked ? '✓' : ''}</span>
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="filter-actions">
                <button type="button" className="filter-reset" onClick={resetFilters}>Reset filters</button>
                <button type="button" className="primary-button filter-apply" onClick={applyFilters}>
                  Apply filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="board-menu">
          <button
            type="button"
            className="board-tool-button"
            aria-expanded={sortOpen}
            onClick={() => { setSortOpen((open) => !open); setFilterOpen(false); }}
          >
            <UilSort size="14" /> Sort
          </button>
          {sortOpen && (
            <div className="board-popover sort-surface" role="menu" aria-label="Sort tasks">
              {SORT_OPTIONS.map((option) => {
                const selected = String(filters.ordering || 'position') === option.value;
                return (
                  <button
                    type="button"
                    key={option.value}
                    role="menuitemradio"
                    aria-checked={selected}
                    className={`sort-option${selected ? ' is-selected' : ''}`}
                    onClick={() => chooseSort(option.value)}
                  >
                    {option.label}
                    <span className="sort-check" aria-hidden="true">{selected ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
