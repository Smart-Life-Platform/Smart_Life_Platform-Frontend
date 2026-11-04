export default function TaskDetailsBadges({
  status,
  category,
  priority = 'medium',
}) {
  return (
    <div className="task-popover-badges">
      {status && (
        <span
          className="task-popover-badge"
          style={{ borderLeft: '3px solid var(--color-accent)' }}
        >
          Status: {status.name}
        </span>
      )}
      {category && (
        <span
          className="task-popover-badge"
          style={{ borderLeft: `3px solid ${category.color || 'var(--color-secondary)'}` }}
        >
          Category: {category.name}
        </span>
      )}
      <span className={`task-popover-badge priority-${priority}`}>
        Priority: {priority}
      </span>
    </div>
  );
}

