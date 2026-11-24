import {
  SPACE_OTHER,
  SPACE_PERSONAL,
  SPACE_PUBLIC,
  boardOwnerId,
  boardSpaceGroups,
  groupMembersByBoard,
  resolveBoardSpace,
  spaceTitle,
} from '../utils/boardSpace';

const ME = 'me';

describe('resolveBoardSpace', () => {
  test('a board the user owns with nobody else on it is a personal space', () => {
    const space = resolveBoardSpace(
      { id: 1, name: 'Work', user: ME },
      { userId: ME, members: [{ id: 10, board: 1, user: ME, role: 'owner' }] }
    );

    expect(space.kind).toBe(SPACE_PERSONAL);
    expect(space.label).toBe('Personal space');
    expect(space.isOwner).toBe(true);
    expect(space.otherPeople).toBe(0);
    expect(space.detail).toBe('Only you have access');
  });

  test('the same board becomes a public space once another person is invited', () => {
    const space = resolveBoardSpace(
      { id: 1, name: 'Work', user: ME },
      {
        userId: ME,
        members: [
          { id: 10, board: 1, user: ME, role: 'owner' },
          { id: 11, board: 1, user: 'friend', role: 'editor', full_name: 'Friend' },
        ],
      }
    );

    expect(space.kind).toBe(SPACE_PUBLIC);
    expect(space.label).toBe('Public space');
    expect(space.otherPeople).toBe(1);
    expect(space.detail).toBe('Shared with 1 person');
  });

  test('a board owned by somebody else is an other space, with the viewer role kept', () => {
    const space = resolveBoardSpace(
      { id: 2, name: 'Client board', owner_id: 'boss' },
      {
        userId: ME,
        members: [
          { id: 20, board: 2, user: 'boss', role: 'owner', full_name: 'Boss' },
          { id: 21, board: 2, user: ME, role: 'viewer' },
        ],
      }
    );

    expect(space.kind).toBe(SPACE_OTHER);
    expect(space.label).toBe('Other space');
    expect(space.isOwner).toBe(false);
    expect(space.role).toBe('viewer');
    expect(space.accessLabel).toBe('Can view');
    expect(space.ownerName).toBe('Boss');
    expect(space.detail).toBe('Owned by Boss · Can view');
  });

  test('owner is read from an embedded user object and role falls back to the board row', () => {
    expect(boardOwnerId({ user: { id: 'uuid-1' } })).toBe('uuid-1');

    const space = resolveBoardSpace(
      { id: 3, name: 'Team', user: { id: 'boss' }, role: 'editor' },
      { userId: ME, members: [] }
    );

    expect(space.kind).toBe(SPACE_OTHER);
    expect(space.role).toBe('editor');
    expect(space.detail).toContain('Can edit');
  });

  test('members_count is used when membership rows are unavailable', () => {
    const space = resolveBoardSpace(
      { id: 4, name: 'Shared', user: ME, members_count: 3 },
      { userId: ME, members: [] }
    );

    expect(space.kind).toBe(SPACE_PUBLIC);
    expect(space.otherPeople).toBe(2);
  });

  test('no selected board still reports the user personal space', () => {
    const space = resolveBoardSpace(null, { userId: ME });

    expect(space.kind).toBe(SPACE_PERSONAL);
    expect(space.label).toBe('Personal space');
  });
});

describe('groupMembersByBoard', () => {
  test('groups rows by board id and keeps rows without a board out', () => {
    const grouped = groupMembersByBoard([
      { id: 1, board: 1, user: 'a' },
      { id: 2, board_id: 2, user_id: 'b' },
      { id: 3, user: 'c' },
    ]);

    expect(grouped.get('1')).toHaveLength(1);
    expect(grouped.get('2')).toHaveLength(1);
    expect(grouped.size).toBe(2);
  });
});

describe('boardSpaceGroups', () => {
  test('orders the groups personal, public, other and keeps boards inside', () => {
    const groups = boardSpaceGroups(
      [
        { id: 1, name: 'Mine', user: ME },
        { id: 2, name: 'Shared', user: ME },
        { id: 3, name: 'Boss board', user: 'boss' },
      ],
      {
        userId: ME,
        membersByBoard: groupMembersByBoard([
          { id: 10, board: 2, user: 'friend', role: 'viewer' },
          { id: 11, board: 3, user: ME, role: 'editor' },
        ]),
      }
    );

    expect(groups.map((group) => group.kind)).toEqual([SPACE_PERSONAL, SPACE_PUBLIC, SPACE_OTHER]);
    expect(groups.map((group) => group.label)).toEqual(['Personal space', 'Public space', 'Other space']);
    expect(groups[0].boards.map(({ board }) => board.name)).toEqual(['Mine']);
    expect(groups[2].boards[0].space.role).toBe('editor');
  });

  test('empty boards produce no groups', () => {
    expect(boardSpaceGroups([], { userId: ME })).toEqual([]);
    expect(boardSpaceGroups(undefined, { userId: ME })).toEqual([]);
  });
});

describe('spaceTitle', () => {
  test('joins space, board and access detail for the tooltip', () => {
    const board = { id: 7, name: 'Roadmap', user: 'boss' };
    const space = resolveBoardSpace(board, { userId: ME, members: [] });

    expect(spaceTitle(space, board)).toBe('Other space · Roadmap · Owned by another member');
    expect(spaceTitle(null, board)).toBe('');
  });
});
