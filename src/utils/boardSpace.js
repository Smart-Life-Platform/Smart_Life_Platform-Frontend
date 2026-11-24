/**
 * Which "space" a board lives in, as seen by the signed-in user.
 *
 * The sidebar switcher used to call every board "Personal space of <name>" — also
 * boards that belong to somebody else. A board is now classified as:
 *   personal — the user owns it and nobody else has access;
 *   public   — the user owns it and other people were invited (editor / viewer);
 *   other    — the board belongs to somebody else, the user is an editor or viewer.
 *
 * Owner and membership data arrive in different shapes (`user` / `owner` /
 * `owner_id`, `board-members` rows, optional `members_count`), so every lookup
 * below accepts the variants the API and the mocks already use.
 */

export const SPACE_PERSONAL = 'personal';
export const SPACE_PUBLIC = 'public';
export const SPACE_OTHER = 'other';

/** Display order of the groups in the switcher. */
export const SPACE_ORDER = [SPACE_PERSONAL, SPACE_PUBLIC, SPACE_OTHER];

export const SPACE_LABELS = {
  [SPACE_PERSONAL]: 'Personal space',
  [SPACE_PUBLIC]: 'Public space',
  [SPACE_OTHER]: 'Other space',
};

const ACCESS_LABELS = {
  owner: 'Can manage',
  editor: 'Can edit',
  viewer: 'Can view',
};

const idOf = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') return idOf(value.id ?? value.user_id ?? value.uuid ?? null);
  return value;
};

const sameId = (first, second) =>
  first !== null && first !== undefined && second !== null && second !== undefined && String(first) === String(second);

const textOf = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

const roleOf = (member) => textOf(member?.role)?.toLowerCase() ?? null;

/** Board owner: `owner_id` / `owner` / `user_id` / `user`, id or embedded object. */
export const boardOwnerId = (board) =>
  idOf(board?.owner_id ?? board?.owner ?? board?.user_id ?? board?.user);

/** `board-members` rows expose `user_id` / `board_id` (snake case) — support both shapes. */
export const memberUserId = (member) => idOf(member?.user_id ?? member?.user);
export const memberBoardId = (member) => idOf(member?.board_id ?? member?.board);

/** Members grouped by board id (`String(boardId)` → rows), for one-shot lookups. */
export function groupMembersByBoard(members) {
  const list = Array.isArray(members) ? members : members?.results || [];
  const grouped = new Map();

  list.forEach((member) => {
    const boardId = memberBoardId(member);
    if (boardId === null) return;
    const key = String(boardId);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(member);
  });

  return grouped;
}

/** A member row already carries `full_name` / `email`; the profile lookup is optional. */
function memberDisplayName(member) {
  const name = textOf(member?.full_name, member?.user_name, member?.username, member?.name);
  if (name) return name;
  const email = textOf(member?.email);
  return email ? email.split('@')[0] : null;
}

function detailFor(kind, { otherPeople, ownerName, accessLabel }) {
  if (kind === SPACE_PUBLIC) {
    return otherPeople === 1 ? 'Shared with 1 person' : `Shared with ${otherPeople} people`;
  }
  if (kind === SPACE_OTHER) {
    const owner = ownerName ? `Owned by ${ownerName}` : 'Owned by another member';
    return accessLabel ? `${owner} · ${accessLabel}` : owner;
  }
  return 'Only you have access';
}

/**
 * Classifies one board. `members` are that board's membership rows; when they are
 * missing the board object itself (`members`, `members_count`, `role`) is used.
 */
export function resolveBoardSpace(board, { userId, members } = {}) {
  const currentUserId = idOf(userId);

  if (!board) {
    return {
      kind: SPACE_PERSONAL,
      label: SPACE_LABELS[SPACE_PERSONAL],
      isOwner: true,
      ownerId: currentUserId,
      ownerName: null,
      role: 'owner',
      accessLabel: null,
      otherPeople: 0,
      memberCount: 0,
      detail: '',
      boardId: null,
    };
  }

  const provided = Array.isArray(members) ? members.filter(Boolean) : [];
  const embedded = Array.isArray(board.members) ? board.members.filter(Boolean) : [];
  const rows = provided.length ? provided : embedded;

  const ownerRow = rows.find((member) => roleOf(member) === 'owner') ?? null;
  const ownerId = boardOwnerId(board) ?? memberUserId(ownerRow);
  const selfRow = rows.find((member) => sameId(memberUserId(member), currentUserId)) ?? null;
  const declaredRole = roleOf({ role: board.role ?? board.permission ?? board.access });

  const isOwner = ownerId !== null
    ? sameId(ownerId, currentUserId)
    : declaredRole !== null
      ? declaredRole === 'owner'
      : true;

  // "Other people" = everyone on the board apart from its owner.
  const others = rows.filter((member) => {
    const memberId = memberUserId(member);
    if (memberId === null) return false;
    if (ownerId !== null) return !sameId(memberId, ownerId);
    return !sameId(memberId, currentUserId);
  });

  const declaredCount = Number(
    board.members_count ?? board.member_count ?? (Array.isArray(board.members) ? board.members.length : NaN)
  );
  const otherPeople = rows.length || !Number.isFinite(declaredCount)
    ? others.length
    : Math.max(0, declaredCount - (isOwner ? 1 : 0));

  const kind = !isOwner ? SPACE_OTHER : otherPeople > 0 ? SPACE_PUBLIC : SPACE_PERSONAL;
  const role = isOwner ? 'owner' : roleOf(selfRow) ?? declaredRole;
  const accessLabel = ACCESS_LABELS[role] ?? null;
  const ownerName = textOf(board.owner_name, board.owner_full_name) ?? memberDisplayName(ownerRow);

  return {
    kind,
    label: SPACE_LABELS[kind],
    isOwner,
    ownerId,
    ownerName,
    role,
    accessLabel,
    otherPeople,
    memberCount: Math.max(rows.length, Number.isFinite(declaredCount) ? declaredCount : 0),
    detail: detailFor(kind, { otherPeople, ownerName, accessLabel }),
    boardId: idOf(board.id),
  };
}

/**
 * Boards grouped into the order the switcher lists them: personal, public, other.
 * Boards keep their incoming order inside a group.
 */
export function boardSpaceGroups(boards, { userId, membersByBoard } = {}) {
  const grouped = membersByBoard instanceof Map ? membersByBoard : groupMembersByBoard(membersByBoard);
  const groups = new Map(SPACE_ORDER.map((kind) => [kind, { kind, label: SPACE_LABELS[kind], boards: [] }]));

  (Array.isArray(boards) ? boards : []).forEach((board) => {
    if (!board) return;
    const space = resolveBoardSpace(board, {
      userId,
      members: grouped.get(String(board.id)) ?? [],
    });
    groups.get(space.kind).boards.push({ board, space });
  });

  return SPACE_ORDER.map((kind) => groups.get(kind)).filter((group) => group.boards.length > 0);
}

/** Tooltip text for the switcher: space, board and who else can reach it. */
export function spaceTitle(space, board) {
  if (!space) return '';
  return [space.label, textOf(board?.name), space.detail].filter(Boolean).join(' · ');
}
