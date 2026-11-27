/**
 * The five board colours of the design system. Swatches take their paint from the CSS
 * variables, the stored value is the hex the API expects.
 */
export const PALETTE = [
  { name: 'Purple', value: '#6558C8', variable: '--color-accent' },
  { name: 'Green', value: '#4A9B79', variable: '--color-green' },
  { name: 'Yellow', value: '#B68B2A', variable: '--color-yellow' },
  { name: 'Blue', value: '#5980B6', variable: '--color-blue' },
  { name: 'Red', value: '#B64C59', variable: '--color-red' },
];

/** True when `value` is one of the palette colours (case-insensitive, #rrggbb). */
export const isPaletteColor = (value) => PALETTE.some(
  (color) => String(color.value).toLowerCase() === String(value || '').toLowerCase()
);

export default function ColorPalette({ value, onChange, label = 'Color' }) {
  return (
    <div className="color-field">
      <span className="color-field-label">{label}</span>
      <div className="color-palette" role="radiogroup" aria-label={label}>
        {PALETTE.map((color) => {
          const selected = String(color.value).toLowerCase() === String(value || '').toLowerCase();
          return (
            <button
              key={color.name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={color.name}
              title={color.name}
              className={`color-swatch${selected ? ' is-selected' : ''}`}
              style={{ background: `var(${color.variable})` }}
              onClick={() => onChange(color.value)}
            />
          );
        })}
      </div>
    </div>
  );
}
