import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// TaskForm now imports subtasksApi → apiClient → supabase; mock to avoid missing env vars in tests
jest.mock('../api/apiClient', () => ({
  apiClient: {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    patch: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

import TaskForm from '../components/tasks/TaskForm';

const props = { date: '2026-10-31', statuses: [{ id: 1, name: 'Todo' }], categories: [], onClose: jest.fn() };

test('rejects a title containing only spaces', () => {
  const onSubmit = jest.fn();
  render(<TaskForm {...props} onSubmit={onSubmit} />);
  fireEvent.change(screen.getByLabelText('Task title'), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create task' }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText('Enter a task title.')).toBeInTheDocument();
});

test('keeps a UUID assignee when editing a task', () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  const uuid = '8d1f2c34-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

  render(
    <TaskForm
      {...props}
      task={{ id: 9, title: 'Existing task', status_id: 1, assignee_id: uuid }}
      assignees={[{ id: uuid, name: 'Casey One' }]}
      onSubmit={onSubmit}
    />
  );

  // The assignee dropdown resolves the user id instead of falling back to "Unassigned".
  expect(screen.getByRole('button', { name: 'Assignee' })).toHaveTextContent('Casey One');

  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(onSubmit.mock.calls[0][0].assignee_id).toBe(uuid);
});

test('blocks duplicate submissions and allows retry after an error', async () => {
  let rejectRequest;
  const onSubmit = jest.fn(() => new Promise((resolve, reject) => { rejectRequest = reject; }));
  render(<TaskForm {...props} onSubmit={onSubmit} />);
  fireEvent.change(screen.getByLabelText('Task title'), { target: { value: ' Test task ' } });
  const form = screen.getByRole('button', { name: 'Create task' }).closest('form');
  fireEvent.submit(form);
  fireEvent.submit(form);
  expect(onSubmit).toHaveBeenCalledTimes(1);
  expect(onSubmit.mock.calls[0][0].title).toBe('Test task');
  expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
  rejectRequest(new Error('Request failed'));
  await waitFor(() => expect(screen.getByText('Request failed')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Create task' })).toBeEnabled();
});
