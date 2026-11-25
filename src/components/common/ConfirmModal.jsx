import { useState } from 'react';
import { UilTimes } from '@iconscout/react-unicons';

export default function ConfirmModal({
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = 'Delete',
  busyLabel = 'Deleting…',
  danger = true,
  eyebrow = 'CONFIRM ACTION',
}) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="task-modal confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id="confirm-modal-title">{title}</h2>
          </div>
          <button type="button" className="close-button" aria-label="Close" onClick={onClose} disabled={submitting}>
            <UilTimes size="20" />
          </button>
        </div>
        <p className="confirm-modal-message">{message}</p>
        <div className="dialog-actions">
          <button type="button" className="ghost-button" onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            type="button"
            className={danger ? 'danger-button' : 'primary-button'}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? busyLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
