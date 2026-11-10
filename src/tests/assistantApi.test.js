import { apiClient } from '../api/apiClient';
import {
  deleteConversation,
  getConversation,
  getConversations,
  sendMessage,
} from '../api/assistantApi';

jest.mock('../api/apiClient', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

test('lists conversations and unwraps paginated results', async () => {
  apiClient.get.mockResolvedValueOnce({ data: [{ id: 'c1' }] });
  await expect(getConversations()).resolves.toEqual([{ id: 'c1' }]);
  expect(apiClient.get).toHaveBeenCalledWith('/assistant/conversations/');

  apiClient.get.mockResolvedValueOnce({ data: { results: [{ id: 'c2' }] } });
  await expect(getConversations()).resolves.toEqual([{ id: 'c2' }]);
});

test('sends a message with the conversation id and a longer timeout', async () => {
  apiClient.post.mockResolvedValue({ data: { response: 'ok', conversation_id: 'c1' } });

  await sendMessage({ message: 'Create a board', conversationId: 'c1' });
  expect(apiClient.post).toHaveBeenCalledWith(
    '/assistant/chat/',
    { message: 'Create a board', conversation_id: 'c1' },
    { timeout: 90000 },
  );

  await sendMessage({ message: 'Hello' });
  expect(apiClient.post).toHaveBeenLastCalledWith(
    '/assistant/chat/',
    { message: 'Hello' },
    { timeout: 90000 },
  );
});

test('loads a conversation with its messages and deletes it', async () => {
  apiClient.get.mockResolvedValue({ data: { id: 'c1', messages: [] } });

  await getConversation('c1');
  expect(apiClient.get).toHaveBeenCalledWith('/assistant/conversations/c1/');

  apiClient.delete.mockResolvedValue({});
  await deleteConversation('c1');
  expect(apiClient.delete).toHaveBeenCalledWith('/assistant/conversations/c1/');
});
