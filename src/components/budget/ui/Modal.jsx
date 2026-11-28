import { useEffect } from 'react';

export default function Modal({ title, onClose, children, className = '' }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="b-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`b-dialog ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <h3 className="b-dialog__title">{title}</h3>
        {children}
      </div>
    </div>
  );
}
