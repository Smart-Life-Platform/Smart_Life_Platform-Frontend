import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TaskForm from '../components/tasks/TaskForm';

const props = { date: '2026-10-31', statuses: [{ id: 1, name: 'Todo' }], categories: [], onClose: jest.fn() };

test('rejects a title containing only spaces', () => {
  const onSubmit = jest.fn();
  render(<TaskForm {...props} onSubmit={onSubmit} />);
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create task' }));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(screen.getByText('Enter a task title.')).toBeInTheDocument();
});

test('blocks duplicate submissions and allows retry after an error', async () => {
  let rejectRequest;
  const onSubmit = jest.fn(() => new Promise((resolve, reject) => { rejectRequest = reject; }));
  render(<TaskForm {...props} onSubmit={onSubmit} />);
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: ' Test task ' } });
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
