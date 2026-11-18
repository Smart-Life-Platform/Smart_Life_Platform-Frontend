import { useEffect, useState } from 'react';

export default function LimitsSettings({ categories, onChange }) {
  const expense = categories.filter((c) => c.type === 'expense');
  const [drafts, setDrafts] = useState({});

  useEffect(() => setDrafts({}), [categories]);

  const commit = (c) => {
    const raw = drafts[c.id];
    if (raw === undefined) return;
    const value = Math.max(0, Number(raw) || 0);
    setDrafts((d) => {
      const { [c.id]: _removed, ...rest } = d;
      return rest;
    });
    if (value !== c.monthly_limit) onChange(c.id, value);
  };

  return (
    <div className="limits-settings">
      {expense.map((c) => (
        <label key={c.id} className="limits-settings__row">
          <span>{c.name}</span>
          <input
            type="number"
            min="0"
            value={drafts[c.id] ?? c.monthly_limit}
            onChange={(e) => setDrafts({ ...drafts, [c.id]: e.target.value })}
            onBlur={() => commit(c)}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
        </label>
      ))}
    </div>
  );
}
