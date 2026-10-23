export default function LimitsSettings({ categories, onChange }) {
  return (
    <div className="limits-settings">
      {categories.filter((c) => c.type === 'expense').map((c) => (
        <label key={c.id} className="limits-settings__row">
          <span>{c.name}</span>
          <input
            type="number"
            min="0"
            value={c.monthly_limit}
            onChange={(e) => onChange(c.id, Math.max(0, Number(e.target.value)))}
          />
        </label>
      ))}
    </div>
  );
}
