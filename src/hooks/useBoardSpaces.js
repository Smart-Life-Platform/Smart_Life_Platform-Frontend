import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTaskContext } from '../context/TaskContext';
import { boardSpaceGroups, groupMembersByBoard, resolveBoardSpace } from '../utils/boardSpace';

/**
 * Personal / public / other space for every board the signed-in user can see.
 *
 * Membership rows are loaded once by the task store (`boardMembers`), so the
 * sidebar switcher and the board header share one request instead of asking for
 * the same list twice.
 */
export function useBoardSpaces() {
  const { user } = useAuth();
  const { boards, activeBoard, boardMembers } = useTaskContext();
  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;

  return useMemo(() => {
    const membersByBoard = groupMembersByBoard(boardMembers);
    const spaceFor = (board) => resolveBoardSpace(board, {
      userId,
      userEmail,
      members: board ? membersByBoard.get(String(board.id)) ?? [] : [],
    });

    return {
      membersByBoard,
      spaceFor,
      groups: boardSpaceGroups(boards, { userId, userEmail, membersByBoard }),
      // No board selected yet: the sidebar still shows the user's own (personal) space.
      activeSpace: spaceFor(activeBoard),
    };
  }, [boards, activeBoard, boardMembers, userId, userEmail]);
}
