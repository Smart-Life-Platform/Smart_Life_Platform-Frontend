import { apiClient } from '../api/apiClient';
import { getAllBoardStatuses, invalidateBoardStatuses } from '../api/boardStatusesApi';

jest.mock('../api/apiClient', () => ({ apiClient: { get: jest.fn() } }));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

beforeEach(() => { invalidateBoardStatuses(); jest.resetAllMocks(); });

test('a temporary failure of both endpoints does not cache an empty list', async () => {
  apiClient.get.mockRejectedValueOnce(new Error('offline'))
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ data: [{ id: 'recovered' }] });
  expect(await getAllBoardStatuses()).toEqual([]);
  expect((await getAllBoardStatuses())[0].id).toBe('recovered');
  expect(apiClient.get).toHaveBeenCalledTimes(3);
});

test('shares concurrent reads and reuses their result', async () => {
  const pending = deferred();
  apiClient.get.mockReturnValue(pending.promise);
  const first = getAllBoardStatuses();
  const second = getAllBoardStatuses();
  expect(apiClient.get).toHaveBeenCalledTimes(1);
  pending.resolve({ data: [{ id: 1, board: 2 }] });
  expect(await first).toEqual(await second);
  await getAllBoardStatuses();
  expect(apiClient.get).toHaveBeenCalledTimes(1);
});

test('a previous account response cannot replace the current cache', async () => {
  const old = deferred();
  apiClient.get.mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce({ data: [{ id: 'new', board: 'new-board' }] });
  const previousRead = getAllBoardStatuses();
  invalidateBoardStatuses();
  await getAllBoardStatuses();
  old.resolve({ data: [{ id: 'old', board: 'old-board' }] });
  expect(await previousRead).toEqual([]);
  expect((await getAllBoardStatuses()).map(item => item.id)).toEqual(['new']);
});

test('a stale request cannot release the newer request lock or start a legacy read', async () => {
  const old = deferred();
  const current = deferred();
  apiClient.get.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
  const oldRead = getAllBoardStatuses();
  invalidateBoardStatuses();
  const currentRead = getAllBoardStatuses();
  old.reject(new Error('old failure'));
  await oldRead;
  const anotherRead = getAllBoardStatuses();
  expect(apiClient.get).toHaveBeenCalledTimes(2);
  current.resolve({ data: [{ id: 'new' }] });
  expect(await currentRead).toEqual(await anotherRead);
});

test('legacy responses from a previous account are discarded too', async () => {
  const legacy = deferred();
  apiClient.get.mockRejectedValueOnce(new Error('missing endpoint')).mockReturnValueOnce(legacy.promise);
  const oldRead = getAllBoardStatuses();
  await Promise.resolve();
  await Promise.resolve();
  expect(apiClient.get).toHaveBeenCalledWith('/tasks/statuses/');
  invalidateBoardStatuses();
  legacy.resolve({ data: [{ id: 'old' }] });
  expect(await oldRead).toEqual([]);
  apiClient.get.mockResolvedValueOnce({ data: [{ id: 'new' }] });
  expect((await getAllBoardStatuses())[0].id).toBe('new');
});
