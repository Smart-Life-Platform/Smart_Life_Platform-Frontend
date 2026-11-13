export default function SaveStatus({ status, error }) {
  if (status === 'saving') return <p className="save-status" role="status">Saving…</p>;
  if (status === 'saved') return <p className="save-status saved" role="status">Saved</p>;
  if (status === 'error') return <p className="settings-error" role="alert">{error || 'Could not save.'}</p>;
  return null;
}