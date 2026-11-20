import { useEffect, useState } from 'react';
import { UilCopy, UilTrashAlt, UilTimes } from '@iconscout/react-unicons';
import { addBoardMember, getBoardMembers, removeBoardMember, updateBoardMember } from '../../api/boardsApi';
import { getUserProfile } from '../../api/usersApi';
import { MemberAvatar, memberBoardId, memberUserId } from './MemberAvatar';

const INVITE_ROLES = [
  { value: 'viewer', label: 'Can view' },
  { value: 'editor', label: 'Can edit' },
];


const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());



export default function ShareBoardModal({ board, onClose, onMembersChanged }) {
  const [members, setMembers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [form, setForm] = useState({ email: '', role: 'viewer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const boardLink = `${window.location.origin}/kanban?board=${board?.id ?? ''}`;

  useEffect(() => {
    let cancelled = false;
    getBoardMembers(board?.id)
      .then(async (list) => {
        if (cancelled) return;
        const scoped = list.filter((member) => !board?.id || String(memberBoardId(member)) === String(board.id));
        setMembers(scoped);

        const resolved = await Promise.all(
          scoped.map(async (member) => [memberUserId(member), await getUserProfile(memberUserId(member))])
        );
        if (cancelled) return;
        setProfiles(Object.fromEntries(resolved));
      })
      .catch((loadError) => { if (!cancelled) setError(loadError.message); });
    return () => { cancelled = true; };
  }, [board?.id]);

  async function invite(event) {
    event.preventDefault();
    const email = form.email.trim();
    if (!isEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      // The API accepts user_id (uuid) for an already registered account and also
      // understands email, so both are sent — whichever the serializer exposes wins.
      let created;
      const base = { board: board.id, board_id: board.id, role: form.role };
      try {
        created = await addBoardMember({ ...base, email, user_id: email, user: email });
      } catch (firstError) {
        created = await addBoardMember({ ...base, user: email, user_id: email });
        if (!created && firstError) throw firstError;
      }

      setMembers((current) => [...current.filter((member) => member.id !== created.id), created]);
      onMembersChanged?.();

      const createdUserId = memberUserId(created);
      const profile = await getUserProfile(createdUserId);
      if (profile) setProfiles((current) => ({ ...current, [createdUserId]: profile }));
      setForm({ email: '', role: form.role });
    } catch (inviteError) {
      setError(inviteError.message);
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(member, role) {
    setError('');
    try {
      const updated = await updateBoardMember(member.id, { role });
      setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, ...updated } : item)));
      onMembersChanged?.();
    } catch (roleError) {
      setError(roleError.message);
    }
  }

  async function remove(member) {
    setError('');
    try {
      await removeBoardMember(member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
      onMembersChanged?.();
    } catch (removeError) {
      setError(removeError.message);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(boardLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Could not copy the link — copy it manually.');
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="task-modal share-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header className="share-header">
          <div>
            <h2>Share board</h2>
            <strong className="share-board-name">{board?.name || 'Board'}</strong>
            <p className="share-board-description">
              {board?.description || 'Plan, delegate, and share progress with your team.'}
            </p>
          </div>
          <button type="button" className="close-button" aria-label="Close" onClick={onClose}><UilTimes size="20" /></button>
        </header>

        <form className="share-invite" onSubmit={invite}>
          <label>
            Invite people
            <input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="Enter email address"
              type="email"
              aria-label="Invite by email"
            />
          </label>
          <label>
            Access
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} aria-label="Access level">
              {INVITE_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
          </label>
          <button type="submit" className="primary-button" disabled={busy || !form.email.trim()}>
            {busy ? 'Inviting…' : 'Invite'}
          </button>
        </form>

        {error && <p className="form-error">{error}</p>}

        <h3 className="share-section-title">People with access</h3>
        <ul className="share-members">
          {members.length === 0 && <li className="share-empty">Only you have access so far.</li>}
          {members.map((member) => {
            const profile = profiles[memberUserId(member)];
            const name = profile?.full_name || profile?.name || profile?.username || member.user_name || member.name || `User ${member.user}`;
            const email = profile?.email || member.email || '';

            return (
              <li key={member.id}>
                <MemberAvatar profile={profile} name={name} size={32} />
                <span className="share-member-copy">
                  <strong>{name}</strong>
                  {email && <small>{email}</small>}
                </span>
                {member.role === 'owner' ? (
                  <span className="share-role">Owner</span>
                ) : (
                  <>
                    <select
                      className="share-role-select"
                      value={member.role}
                      onChange={(event) => changeRole(member, event.target.value)}
                      aria-label={`Access for ${name}`}
                    >
                      {INVITE_ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                    </select>
                    <button type="button" className="share-remove" onClick={() => remove(member)} aria-label={`Remove ${name}`}>
                      <UilTrashAlt size="14" />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <footer className="share-footer">
          <div>
            <span className="share-link-label">Board link · Only invited people can access</span>
            <code className="share-link">{boardLink}</code>
          </div>
          <div className="share-footer-actions">
            <button type="button" className="ghost-button" onClick={onClose}>Cancel</button>
            <button type="button" className="primary-button" onClick={copyLink}>
              <UilCopy size="15" /> {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
