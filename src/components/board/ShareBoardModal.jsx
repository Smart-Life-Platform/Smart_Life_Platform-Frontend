import { useEffect, useState } from 'react';
import { UilTrashAlt, UilTimes } from '@iconscout/react-unicons';
import { addBoardMember, getBoardMembers, removeBoardMember, updateBoardMember } from '../../api/boardsApi';
import { getUserProfile } from '../../api/usersApi';
import { useAuth } from '../../context/AuthContext';
import { resolveBoardSpace } from '../../utils/boardSpace';
import ConfirmModal from '../common/ConfirmModal';
import Dropdown from '../common/Dropdown';
import { MemberAvatar, memberBoardId, memberName, memberRowResolved, memberUserId } from './MemberAvatar';

const INVITE_ROLES = [
  { value: 'viewer', label: 'Can view' },
  { value: 'editor', label: 'Can edit' },
];


const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());



export default function ShareBoardModal({ board, onClose, onMembersChanged }) {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [form, setForm] = useState({ email: '', role: 'viewer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  // Only the board owner may change access. Until the member list is known the controls
  // stay disabled — an editor used to click "Invite" and receive a 403 instead.
  // Supabase ids and backend ids can differ, so rows are also matched by email.
  const ownershipRows = members.map((member) => {
    const key = memberUserId(member);
    const email = member.email || profiles[key]?.email || '';
    return email ? { ...member, email } : member;
  });
  const canManage = membersLoaded && resolveBoardSpace(board, {
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    members: ownershipRows,
  }).isOwner;

  const boardLink = `${window.location.origin}/kanban?board=${board?.id ?? ''}`;

  useEffect(() => {
    let cancelled = false;
    getBoardMembers(board?.id)
      .then(async (list) => {
        if (cancelled) return;
        const scoped = list.filter((member) => !board?.id || String(memberBoardId(member)) === String(board.id));
        setMembers(scoped);
        // Ownership is known as soon as the rows arrive; profile photos can follow.
        setMembersLoaded(true);

        // Rows already contain email / full_name / avatar_url — fetch profiles only
        // for members that arrived without them.
        const resolved = await Promise.all(
          scoped.map(async (member) => {
            const key = memberUserId(member);
            if (!key || memberRowResolved(member)) return [key, null];
            return [key, await getUserProfile(key)];
          })
        );
        if (cancelled) return;
        setProfiles(Object.fromEntries(resolved.filter(([key, profile]) => key && profile)));
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(loadError.message);
        // Without rows the board row still tells whether the user is the owner.
        setMembersLoaded(true);
      });
    return () => { cancelled = true; };
  }, [board?.id]);

  async function invite(event) {
    event.preventDefault();
    if (!canManage) return;
    const email = form.email.trim();
    if (!isEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      // Boards_Members.md: POST /api/tasks/board-members/ takes
      // { board_id, email, role }; a user_id containing "@" is treated as an email.
      let created;
      try {
        created = await addBoardMember({ board_id: board.id, email, role: form.role });
      } catch (firstError) {
        created = await addBoardMember({ board_id: board.id, user_id: email, role: form.role });
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
    if (!canManage) return;
    setError('');
    try {
      const updated = await updateBoardMember(member.id, { role });
      setMembers((current) => current.map((item) => (item.id === member.id ? { ...item, ...updated } : item)));
      onMembersChanged?.();
    } catch (roleError) {
      setError(roleError.message);
    }
  }

  async function confirmRemove() {
    const member = memberToRemove;
    if (!member || !canManage) return;
    setError('');
    try {
      await removeBoardMember(member.id);
      setMembers((current) => current.filter((item) => item.id !== member.id));
      onMembersChanged?.();
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setMemberToRemove(null);
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

        <form className={`share-invite${canManage ? '' : ' is-readonly'}`} onSubmit={invite}>
          <label>
            Invite people
            <input
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="Enter email address"
              type="email"
              aria-label="Invite by email"
              disabled={!canManage}
            />
          </label>
          <label>
            Access
            <Dropdown
              value={form.role}
              options={INVITE_ROLES}
              onChange={(role) => setForm({ ...form, role })}
              ariaLabel="Access level"
              disabled={!canManage}
            />
          </label>
          <button type="submit" className="primary-button" disabled={!canManage || busy || !form.email.trim()}>
            {busy ? 'Inviting…' : 'Invite'}
          </button>
        </form>

        {!canManage && membersLoaded && (
          <p className="share-readonly">Only the board owner can change who has access.</p>
        )}

        {error && <p className="form-error">{error}</p>}

        <h3 className="share-section-title">People with access</h3>
        <ul className="share-members">
          {members.length === 0 && (
            <li className="share-empty">
              {canManage ? 'Only you have access so far.' : 'No one has been added to this board yet.'}
            </li>
          )}
          {members.map((member) => {
            const key = memberUserId(member);
            const profile = profiles[key];
            const name = memberName(profile, member);
            const email = member.email || profile?.email || '';

            return (
              <li key={member.id}>
                <MemberAvatar profile={profile} member={member} name={name} size={32} />
                <span className="share-member-copy">
                  <strong>{name}</strong>
                  {email && <small>{email}</small>}
                </span>
                {member.role === 'owner' ? (
                  <span className="share-role">Owner</span>
                ) : (
                  <>
                    <Dropdown
                      className="share-role-dropdown"
                      value={member.role}
                      options={INVITE_ROLES}
                      onChange={(role) => changeRole(member, role)}
                      ariaLabel={`Access for ${name}`}
                      disabled={!canManage}
                    />
                    {canManage && (
                      <button type="button" className="share-remove" onClick={() => setMemberToRemove(member)} aria-label={`Remove ${name}`}>
                        <UilTrashAlt size="14" />
                      </button>
                    )}
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
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </footer>

        {memberToRemove && (
          <ConfirmModal
            title="Remove from board?"
            message={`${memberName(profiles[memberUserId(memberToRemove)], memberToRemove)} will lose access to “${board?.name || 'this board'}”. You can invite them again later.`}
            onClose={() => setMemberToRemove(null)}
            onConfirm={confirmRemove}
          />
        )}
      </section>
    </div>
  );
}
