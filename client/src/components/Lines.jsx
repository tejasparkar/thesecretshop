/** Masked text lines for slide-up reveals. Pass an array of strings (one per line). */
export default function Lines({ lines, as: Tag = 'h2', className = '' }) {
  return (
    <Tag className={className} data-reveal="lines">
      {lines.map((line, i) => (
        <span className="line" key={i}>
          <span className="line-inner">{line}</span>
        </span>
      ))}
    </Tag>
  );
}

/** Split a string into per-character spans (for hero letter animations). */
export function Chars({ text, className = '' }) {
  return (
    <span className={className} aria-label={text}>
      {[...text].map((ch, i) => (
        <span className="char" key={i} aria-hidden="true">
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}
