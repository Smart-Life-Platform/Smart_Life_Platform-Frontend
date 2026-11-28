import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import ShareBoardModal from '../components/board/ShareBoardModal';
import { getBoardMembers, removeBoardMember, updateBoardMember } from '../api/boardsApi';

let mockUser = { id: 'me' };

jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: mockUser }) }));
jest.mock('../lib/supabase', () => ({ supabase: {} }));
jest.mock('../api/boardsApi', () => ({
  getBoardMembers: jest.fn(),
  addBoardMember: jest.fn(),
  updateBoardMember: jest.fn(),
  removeBoardMember: jest.fn(),
}));
jest.mock('../api/usersApi', () => ({ getUserProfile: jest.fn().mockResolvedValue(null) }));

const board = { id: 7, name: 'Work Board 1', description: 'My work tasks', user: 'boss' };

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { id: 'me' };
});

test('an editor cannot invite, change roles or remove people', async () => {
  getBoardMembers.mockResolvedValueOnce([
    { id: 1, board: 7, user: 'boss', role: 'owner', full_name: 'John Doe', email: 'user@example.com' },
    { id: 2, board: 7, user: 'me', role: 'editor', full_name: 'Oleksandr Zabolotnyi', email: 'z@example.com' },
  ]);

  render(<ShareBoardModal board={board} onClose={jest.fn()} />);

  expect(await screen.findByText('Only the board owner can change who has access.')).toBeInTheDocument();
  expect(screen.getByLabelText('Invite by email')).toBeDisabled();
  expect(screen.getByLabelText('Access level')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Invite' })).toBeDisabled();
  expect(screen.getByLabelText('Access for Oleksandr Zabolotnyi')).toBeDisabled();
  expect(screen.queryByLabelText('Remove Oleksandr Zabolotnyi')).not.toBeInTheDocument();
});

test('the owner keeps the invite form and the member controls active', async () => {
  getBoardMembers.mockResolvedValueOnce([
    { id: 1, board: 7, user: 'me', role: 'owner', full_name: 'Oleksandr Zabolotnyi', email: 'z@example.com' },
    { id: 2, board: 7, user: 'boss', role: 'viewer', full_name: 'John Doe', email: 'user@example.com' },
  ]);

  render(<ShareBoardModal board={{ ...board, user: 'me' }} onClose={jest.fn()} />);

  expect(await screen.findByLabelText('Access for John Doe')).toBeEnabled();
  expect(screen.getByLabelText('Invite by email')).toBeEnabled();
  expect(screen.getByLabelText('Access level')).toBeEnabled();
  expect(screen.getByLabelText('Remove John Doe')).toBeInTheDocument();
  expect(screen.queryByText('Only the board owner can change who has access.')).not.toBeInTheDocument();
});

test('ownership can also come from the member rows when the board row has no owner', async () => {
  getBoardMembers.mockResolvedValueOnce([
    { id: 1, board: 7, user: 'me', role: 'owner', full_name: 'Oleksandr Zabolotnyi' },
  ]);

  render(<ShareBoardModal board={{ id: 7, name: 'Work Board 1' }} onClose={jest.fn()} />);

  // Wait for the member rows; ownership is derived from them in the same render.
  expect(await screen.findByText('Oleksandr Zabolotnyi')).toBeInTheDocument();
  expect(screen.getByLabelText('Invite by email')).toBeEnabled();
});

test('the owner keeps access when Supabase and backend ids differ (matched by email)', async () => {
  mockUser = { id: 'supabase-id', email: 'owner@example.com' };
  getBoardMembers.mockResolvedValueOnce([
    { id: 1, board: 7, user: 'django-id', role: 'owner', full_name: 'Owner', email: 'owner@example.com' },
    { id: 2, board: 7, user: 'other-id', role: 'editor', full_name: 'Someone Else', email: 'someone@example.com' },
  ]);

  render(<ShareBoardModal board={{ id: 7, name: 'Work Board 1' }} onClose={jest.fn()} />);

  expect(await screen.findByLabelText('Access for Someone Else')).toBeEnabled();
  expect(screen.getByLabelText('Invite by email')).toBeEnabled();
  expect(screen.getByLabelText('Remove Someone Else')).toBeInTheDocument();
  expect(screen.queryByText('Only the board owner can change who has access.')).not.toBeInTheDocument();
});

test('a member matched by email is still blocked from changing access', async () => {
  mockUser = { id: 'supabase-id', email: 'someone@example.com' };
  getBoardMembers.mockResolvedValueOnce([
    { id: 1, board: 7, user: 'django-id', role: 'owner', full_name: 'Owner', email: 'owner@example.com' },
    { id: 2, board: 7, user: 'other-id', role: 'editor', full_name: 'Someone Else', email: 'someone@example.com' },
  ]);

  render(<ShareBoardModal board={{ id: 7, name: 'Work Board 1' }} onClose={jest.fn()} />);

  expect(await screen.findByText('Only the board owner can change who has access.')).toBeInTheDocument();
  expect(screen.getByLabelText('Invite by email')).toBeDisabled();
  expect(screen.getByLabelText('Access for Someone Else')).toBeDisabled();
  expect(screen.queryByLabelText('Remove Someone Else')).not.toBeInTheDocument();
});

test('the access picker is the app dropdown, not a native select', async () => {
  getBoardMembers.mockResolvedValueOnce([
    { id: 1, board: 7, user: 'me', role: 'owner', full_name: 'Oleksandr Zabolotnyi', email: 'me@example.com' },
  ]);

  render(<ShareBoardModal board={{ id: 7, name: 'Work Board 1', user: 'me' }} onClose={jest.fn()} />);

  // Wait for the member rows: the controls unlock once ownership is known.
  expect(await screen.findByText('Oleksandr Zabolotnyi')).toBeInTheDocument();
  const access = screen.getByLabelText('Access level');
  expect(access.tagName).toBe('BUTTON');
  expect(access).toBeEnabled();
  expect(screen.queryByRole('combobox', { name: 'Access level' })).not.toBeInTheDocument();

  fireEvent.click(access);
  fireEvent.click(screen.getByRole('option', { name: 'Can edit' }));
  expect(access).toHaveTextContent('Can edit');
});

test('a member role is changed through the same dropdown', async () => {
  getBoardMembers.mockResolvedValueOnce([
    { id: 1, board: 7, user: 'me', role: 'owner', full_name: 'Oleksandr Zabolotnyi', email: 'me@example.com' },
    { id: 2, board: 7, user: 'boss', role: 'editor', full_name: 'John Doe', email: 'user@example.com' },
  ]);
  updateBoardMember.mockResolvedValueOnce({ id: 2, role: 'viewer' });

  render(<ShareBoardModal board={{ id: 7, name: 'Work Board 1', user: 'me' }} onClose={jest.fn()} />);

  const control = await screen.findByLabelText('Access for John Doe');
  fireEvent.click(control);
  fireEvent.click(screen.getByRole('option', { name: 'Can view' }));

  await waitFor(() => expect(updateBoardMember).toHaveBeenCalledWith(2, { role: 'viewer' }));
});

test('removing a member asks for confirmation before calling the API', async () => {
  getBoardMembers.mockResolvedValueOnce([
    { id: 1, board: 7, user: 'me', role: 'owner', full_name: 'Oleksandr Zabolotnyi', email: 'me@example.com' },
    { id: 2, board: 7, user: 'boss', role: 'editor', full_name: 'John Doe', email: 'user@example.com' },
  ]);
  removeBoardMember.mockResolvedValueOnce({});

  render(<ShareBoardModal board={{ id: 7, name: 'Work Board 1', user: 'me' }} onClose={jest.fn()} />);

  fireEvent.click(await screen.findByLabelText('Remove John Doe'));

  const dialog = screen.getByRole('dialog', { name: 'Remove from board?' });
  expect(within(dialog).getByText(/will lose access to/)).toBeInTheDocument();
  expect(removeBoardMember).not.toHaveBeenCalled();

  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
  expect(removeBoardMember).not.toHaveBeenCalled();
  expect(screen.getByText('John Doe')).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText('Remove John Doe'));
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Remove from board?' })).getByRole('button', { name: 'Delete' }));

  await waitFor(() => expect(removeBoardMember).toHaveBeenCalledWith(2));
  await waitFor(() => expect(screen.queryByText('John Doe')).not.toBeInTheDocument());
});
