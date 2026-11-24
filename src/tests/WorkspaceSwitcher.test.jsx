import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../components/layout/Header';

/**
 * The sidebar switcher must say which kind of space the selected board lives in.
 * It used to print "Personal space of <display name>" for every board — including
 * boards owned by somebody else — and the long name wrapped under the icon.
 */
const mockTaskContext = {
  boards: [],
  activeBoard: null,
  boardMembers: [],
  tasks: [],
  setActiveBoard: jest.fn(),
  createBoardForUser: jest.fn(),
  reloadBoardMembers: jest.fn(),
};

jest.mock('../context/TaskContext', () => ({ useTaskContext: () => mockTaskContext }));
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: 'me', email: 'me@example.com' } }),
}));
// The account menu pulls the avatar helpers, which import the Supabase client at
// module scope; the sidebar test does not need a real client.
jest.mock('../lib/supabase', () => ({ supabase: {} }));

const renderSidebar = () => render(<MemoryRouter><Header /></MemoryRouter>);

beforeEach(() => {
  mockTaskContext.boards = [];
  mockTaskContext.activeBoard = null;
  mockTaskContext.boardMembers = [];
});

function switcherText(container) {
  return {
    space: container.querySelector('.workspace-switcher-space').textContent,
    board: container.querySelector('.workspace-switcher-board').textContent,
  };
}

test('a board only the user can see is a personal space', () => {
  const board = { id: 1, name: 'Work', user: 'me' };
  mockTaskContext.boards = [board];
  mockTaskContext.activeBoard = board;
  mockTaskContext.boardMembers = [{ id: 10, board: 1, user: 'me', role: 'owner' }];

  const { container } = renderSidebar();

  expect(switcherText(container)).toEqual({ space: 'Personal space', board: 'Work' });
});

test('a board of the user shared with other people is a public space', () => {
  const board = { id: 2, name: 'Marketing', user: 'me' };
  mockTaskContext.boards = [board];
  mockTaskContext.activeBoard = board;
  mockTaskContext.boardMembers = [
    { id: 20, board: 2, user: 'me', role: 'owner' },
    { id: 21, board: 2, user: 'friend', role: 'editor', full_name: 'Friend' },
  ];

  const { container } = renderSidebar();

  expect(switcherText(container)).toEqual({ space: 'Public space', board: 'Marketing' });
  expect(container.querySelector('optgroup[label="Public space"]')).not.toBeNull();
});

test('a board owned by somebody else is an other space and keeps the access role', () => {
  const board = { id: 3, name: 'Client board', user: 'boss' };
  mockTaskContext.boards = [board];
  mockTaskContext.activeBoard = board;
  mockTaskContext.boardMembers = [{ id: 30, board: 3, user: 'me', role: 'viewer' }];

  const { container } = renderSidebar();

  expect(switcherText(container)).toEqual({ space: 'Other space', board: 'Client board' });
  expect(container.querySelector('optgroup[label="Other space"]')).not.toBeNull();
  expect(container.querySelector('.workspace-switcher').title).toContain('Can view');
});

test('without boards the switcher still names the personal space', () => {
  const { container } = renderSidebar();

  expect(switcherText(container)).toEqual({ space: 'Personal space', board: 'No boards yet' });
  expect(screen.getByLabelText('Select board (Personal space)')).toBeInTheDocument();
});
