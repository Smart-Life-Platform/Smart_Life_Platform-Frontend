import { getAvatarUrl } from '../../api/avatarApi';

const idOf = (value) => (value && typeof value === 'object' ? value.id : value);

/** `board-members` rows expose `user_id` / `board_id` (snake case) — support both shapes. */
export const memberUserId = (member) => idOf(member?.user_id ?? member?.user) ?? null;
export const memberBoardId = (member) => idOf(member?.board_id ?? member?.board) ?? null;
export const memberKey = (member) => memberUserId(member) ?? member?.id;

/**
 * `/api/auth/users/{id}/` returns `{ id, email, is_admin, username }` — `username`
 * is the display name ("John Doe"), so it wins over everything else. Falling back
 * to the email local part and finally to the id keeps the UI readable even when a
 * profile cannot be loaded.
 */
export function memberName(profile, member) {
  const name = profile?.username
    || profile?.full_name
    || profile?.name
    || member?.user_name
    || member?.username
    || member?.name;
  if (name) return String(name).trim();

  const email = profile?.email || member?.email;
  if (email) return email.split('@')[0];

  const id = idOf(member?.user) ?? member?.id;
  return id ? `User ${id}` : 'Member';
}

export function memberEmail(profile, member) {
  return profile?.email || member?.email || '';
}

/** Avatar URL from a profile: absolute `avatar_url`, or a Supabase storage path. */
export function memberPhoto(profile) {
  const url = profile?.avatar_url || profile?.photo_url || profile?.picture;
  if (url) return url;
  if (profile?.avatar_path) return getAvatarUrl({ user_metadata: { avatar_path: profile.avatar_path } });
  return null;
}

export function MemberAvatar({ profile, name, size = 32, className = '' }) {
  const photo = memberPhoto(profile);
  const initials = String(name || 'U')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';

  if (photo) {
    return (
      <img
        className={`member-avatar ${className}`.trim()}
        src={photo}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      className={`member-avatar member-avatar-initials ${className}`.trim()}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/** Overlapping avatar stack for the board header (one per real member). */
export function MemberAvatars({ members = [], profiles = {}, max = 4, size = 26 }) {
  if (!members.length) return null;

  const visible = members.slice(0, max);
  const rest = members.length - visible.length;

  return (
    <div className="board-collaborators" aria-label={`${members.length} board members`}>
      {visible.map((member) => {
        const key = memberKey(member);
        const profile = profiles[key];
        const name = memberName(profile, member);
        return (
          <span className="board-collaborator" key={member.id || key} title={`${name}${memberEmail(profile, member) ? ` · ${memberEmail(profile, member)}` : ''}`}>
            <MemberAvatar profile={profile} name={name} size={size} />
          </span>
        );
      })}
      {rest > 0 && <span className="board-collaborator board-collaborator-more">+{rest}</span>}
    </div>
  );
}
