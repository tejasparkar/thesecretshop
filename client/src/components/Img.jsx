import { useState } from 'react';

/** Image with a branded gradient fallback when the source fails to load. */
export default function Img({ src, alt = '', className = '', ...rest }) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <div className={`img-fallback ${className}`} role="img" aria-label={alt}>
        <span>{alt?.split(' ').slice(0, 2).join(' ')}</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} {...rest} />;
}
