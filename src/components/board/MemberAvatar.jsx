import { getAvatarUrl } from '../../api/avatarApi';

const idOf = (value) => (value && typeof value === 'object' ? value.id : value);

/** `board-members` rows expose `user_id` / `board_id` (snake case) — support both shapes. */
export const memberUserId = (member) => idOf(member?.user_id ?? member?.user) ?? null;
export const memberBoardId = (member) => idOf(member?.board_id ?? member?.board) ?? null;
export const memberKey = (member) => memberUserId(member) ?? member?.id;

/**
 * Board member rows are already enriched by the backend with
 * `email`, `full_name` and `avatar_url` (see Boards_Members.md), so those win.
 * The `/api/auth/users/{id}/` profile is only a fallback.
 */
export function memberName(profile, member) {
  const name = member?.full_name
    || member?.user_name
    || member?.username
    || member?.name
    || profile?.username
    || profile?.full_name
    || profile?.name;
  if (name) return String(name).trim();

  const email = member?.email || profile?.email;
  if (email) return email.split('@')[0];

  const id = memberUserId(member) ?? member?.id;
  return id ? `User ${id}` : 'Member';
}

export function memberEmail(profile, member) {
  return member?.email || profile?.email || '';
}

export function memberPhoto(profile, member) {
  const url = member?.avatar_url
    || member?.user?.avatar_url
    || profile?.avatar_url
    || profile?.photo_url
    || profile?.picture
    || profile?.user_metadata?.avatar_url
    || profile?.user_metadata?.picture;
  if (url) return url;

  const path = member?.avatar_path || profile?.avatar_path || profile?.user_metadata?.avatar_path;
  if (path) return getAvatarUrl({ user_metadata: { avatar_path: path } });
  return null;
}

/** True when the row already carries everything needed to render the member. */
export const memberRowResolved = (member) => Boolean(member?.full_name || member?.email || member?.avatar_url);

export function MemberAvatar({ profile, member, name, size = 32, className = '' }) {
  const photo = memberPhoto(profile, member);
  const label = name || memberName(profile, member);
  const initials = String(label || 'U')
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
      style={{ width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.36)) }}
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
        const key = memberUserId(member) ?? member.id;
        const profile = profiles[key];
        const name = memberName(profile, member);
        const email = memberEmail(profile, member);
        return (
          <span className="board-collaborator" key={member.id || key} title={`${name}${email ? ` · ${email}` : ''}`}>
            <MemberAvatar profile={profile} member={member} name={name} size={size} />
          </span>
        );
      })}
      {rest > 0 && <span className="board-collaborator board-collaborator-more">+{rest}</span>}
    </div>
  );
}
