import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AssistantPage from '../pages/AssistantPage';
import { deleteConversation, getConversation, getConversations, sendMessage } from '../api/assistantApi';

jest.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { username: 'Test' } }) }));
jest.mock('../context/TaskContext', () => ({
  useTaskContext: () => ({ loadTasks: jest.fn(), loadMetadata: jest.fn() }),
}));
jest.mock('../components/common/Avatar', () => ({ getDisplayName: () => 'Test' }));
jest.mock('../api/assistantApi', () => ({
  getConversations: jest.fn(), getConversation: jest.fn(),
  sendMessage: jest.fn(), deleteConversation: jest.fn(),
}));

function renderPage() {
  return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AssistantPage />
  </MemoryRouter>);
}

beforeEach(() => {
  jest.resetAllMocks();
  getConversations.mockResolvedValue([{ id: 'a', title: 'Chat A' }, { id: 'b', title: 'Chat B' }]);
  getConversation.mockResolvedValue({ messages: [] });
});

test('late initial conversation cannot overwrite the chat selected afterwards', async () => {
  let finishOld;
  getConversation.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }))
    .mockResolvedValueOnce({ messages: [{ id: 2, content: 'Current reply' }] });
  renderPage();
  fireEvent.click(await screen.findByTitle('Chat B'));
  await screen.findByText('Current reply');
  await act(async () => { finishOld({ messages: [{ id: 1, content: 'Stale reply' }] }); });
  expect(screen.queryByText('Stale reply')).not.toBeInTheDocument();
  expect(screen.getByText('Current reply')).toBeInTheDocument();
});

test('new chat stays empty when the previous conversation arrives late', async () => {
  let finishOld;
  getConversation.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }));
  renderPage();
  await screen.findByTitle('Chat A');
  fireEvent.click(screen.getByRole('button', { name: /New chat/ }));
  await act(async () => { finishOld({ messages: [{ id: 1, content: 'Stale reply' }] }); });
  expect(screen.queryByText('Stale reply')).not.toBeInTheDocument();
  expect(screen.getByText('How can I help, Test?')).toBeInTheDocument();
});

test('one in-flight message prevents duplicates and conversation switching', async () => {
  let finishSend;
  sendMessage.mockImplementation(() => new Promise(resolve => { finishSend = resolve; }));
  renderPage();
  const input = screen.getByLabelText('Message the assistant');
  await waitFor(() => expect(input).toBeEnabled());
  fireEvent.change(input, { target: { value: 'Hello' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  fireEvent.change(input, { target: { value: 'Another question' } });
  fireEvent.keyDown(input, { key: 'Enter' });
  expect(sendMessage).toHaveBeenCalledTimes(1);
  expect(screen.getByTitle('Chat B')).toBeDisabled();
  expect(screen.getByRole('button', { name: /New chat/ })).toBeDisabled();
  await act(async () => { finishSend({ response: 'Done', conversation_id: 'a', action: 'chat' }); });
  expect(screen.getByText('Done')).toBeInTheDocument();
  expect(screen.getByTitle('Chat B')).toBeEnabled();
});

test('a failed send restores the question and permits another attempt', async () => {
  sendMessage.mockRejectedValueOnce(new Error('Assistant unavailable'));
  renderPage();
  const input = screen.getByLabelText('Message the assistant');
  await waitFor(() => expect(input).toBeEnabled());
  fireEvent.change(input, { target: { value: 'Keep my question' } });
  fireEvent.click(screen.getByLabelText('Send message'));
  await screen.findByRole('alert');
  expect(input).toHaveValue('Keep my question');
  expect(screen.getByLabelText('Send message')).toBeEnabled();
});

test('deleting an old chat does not clear the chat selected while deletion was pending', async () => {
  let finishDelete;
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  deleteConversation.mockImplementation(() => new Promise(resolve => { finishDelete = resolve; }));
  getConversation.mockResolvedValueOnce({ messages: [] })
    .mockResolvedValueOnce({ messages: [{ id: 2, content: 'Keep this reply' }] });
  try {
    renderPage();
    await waitFor(() => expect(screen.getByLabelText('Message the assistant')).toBeEnabled());
    fireEvent.click(screen.getByLabelText('Delete Chat A'));
    fireEvent.click(screen.getByTitle('Chat B'));
    await screen.findByText('Keep this reply');
    await act(async () => { finishDelete(); });
    expect(screen.getByText('Keep this reply')).toBeInTheDocument();
    expect(screen.queryByTitle('Chat A')).not.toBeInTheDocument();
  } finally {
    confirm.mockRestore();
  }
});
