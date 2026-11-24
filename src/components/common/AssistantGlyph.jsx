/**
 * The assistant mark used in the sidebar (src/assets/icons/assistant.svg).
 *
 * Rendered as a masked box instead of an <img> so it inherits `currentColor` and stays
 * crisp at every size — the SVG file carries a fixed grey stroke.
 */
export default function AssistantGlyph({ size = 17, className = '' }) {
  return (
    <span
      className={`assistant-glyph${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
