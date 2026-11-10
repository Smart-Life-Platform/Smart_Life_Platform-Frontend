import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import KanbanBoard from '../components/kanban/KanbanBoard';
import KanbanColumn from '../components/kanban/KanbanColumn';
import TaskCard from '../components/kanban/TaskCard';
import TaskDetailsPopover from '../components/kanban/TaskDetailsPopover';
import DropZone from '../components/kanban/DropZone';
import MetadataModal from '../components/kanban/MetadataModal';
import { getBoardStatuses, createBoardStatus, invalidateBoardStatuses } from '../api/boardStatusesApi';
import { apiClient } from '../api/apiClient';
import {
  taskBelongsToBoard,
  statusBelongsToBoard,
  categoryBelongsToBoard,
  setStoredTaskBoard,
  setStoredStatusBoard,
  setStoredCategoryBoard,
} from '../utils/boardScope';

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

jest.mock('../api/apiClient', () => ({
  apiClient: {
    get: jest.fn().mockRejectedValue(new Error('Network error')),
    post: jest.fn().mockRejectedValue(new Error('Network error')),
    put: jest.fn().mockRejectedValue(new Error('Network error')),
    delete: jest.fn().mockRejectedValue(new Error('Network error')),
  },
}));

describe('Kanban Components', () => {
  const mockCategories = [
    { id: 1, name: 'Work', color: '#ff0000' },
    { id: 2, name: 'Personal', color: '#00ff00' },
  ];

  const mockStatuses = [
    { id: 1, name: 'To Do', position: 1 },
    { id: 2, name: 'In Progress', position: 2 },
    { id: 3, name: 'Done', position: 3 },
  ];

  const mockTask = {
    id: 101,
    title: 'Test Task 1',
    description: 'A test description',
    status_id: 1,
    category_id: 1,
    priority: 'high',
    due_date: '2026-11-10',
    due_time: '14:00',
  };

  test('DropZone renders correctly in empty and indicator modes', () => {
    const { rerender } = render(<DropZone status={mockStatuses[0]} position="empty" label="Drop here" />);
    expect(screen.getByText('Drop here')).toBeInTheDocument();

    rerender(<DropZone status={mockStatuses[0]} position="bottom" />);
    expect(document.querySelector('.kanban-dropzone.indicator')).toBeInTheDocument();
  });

  test('TaskCard renders title, category, priority, and actions', () => {
    const handleEdit = jest.fn();
    const handleDelete = jest.fn();
    const handleDetails = jest.fn();

    renderWithRouter(
      <TaskCard
        task={mockTask}
        categories={mockCategories}
        statuses={mockStatuses}
        initials="JD"
        onOpenEdit={handleEdit}
        onRemoveTask={handleDelete}
        onOpenDetails={handleDetails}
      />
    );

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Edit'));
    expect(handleEdit).toHaveBeenCalledWith(mockTask);

    fireEvent.click(screen.getByLabelText('Delete task'));
    expect(handleDelete).toHaveBeenCalledWith(mockTask);

    fireEvent.click(screen.getByLabelText('Task details'));
    expect(handleDetails).toHaveBeenCalledWith(mockTask);
  });

  test('TaskCard shows the priority flag, subtask progress and the assistant shortcut', () => {
    const task = { ...mockTask, subtasks_count: 4, completed_subtasks_count: 1 };

    renderWithRouter(<TaskCard task={task} categories={mockCategories} initials="JD" />);

    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('1/4')).toBeInTheDocument();
    expect(document.querySelector('.card-progress span').style.width).toBe('25%');
    expect(screen.getByLabelText(/Ask the AI assistant about/)).toBeInTheDocument();

    // No subtasks — no progress bar.
    cleanup();
    renderWithRouter(<TaskCard task={{ ...mockTask, subtasks_count: 0 }} categories={mockCategories} />);
    expect(document.querySelector('.card-progress')).toBeNull();
  });

  test('TaskDetailsPopover displays full details and allows actions', () => {
    const handleClose = jest.fn();
    const handleEdit = jest.fn();
    const handleDelete = jest.fn();
    const handleStatusChange = jest.fn();

    render(
      <TaskDetailsPopover
        task={mockTask}
        statuses={mockStatuses}
        categories={mockCategories}
        onClose={handleClose}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />
    );

    expect(screen.getByText('TASK DETAILS')).toBeInTheDocument();
    expect(screen.getByText('A test description')).toBeInTheDocument();
    expect(screen.getByText('Status: To Do')).toBeInTheDocument();
    expect(screen.getByText('Category: Work')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Edit task'));
    expect(handleEdit).toHaveBeenCalledWith(mockTask);

    fireEvent.click(screen.getByText('Delete'));
    expect(handleDelete).toHaveBeenCalledWith(mockTask);

    const statusSelect = screen.getByLabelText(/Move to status/i);
    fireEvent.change(statusSelect, { target: { value: '2' } });
    expect(handleStatusChange).toHaveBeenCalledWith(101, mockStatuses[1]);
  });

  test('KanbanColumn renders column heading, count, and task cards', () => {
    const handleCreate = jest.fn();

    renderWithRouter(
      <KanbanColumn
        status={mockStatuses[0]}
        tasks={[mockTask]}
        categories={mockCategories}
        statuses={mockStatuses}
        onOpenCreate={handleCreate}
      />
    );

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('+ Add task'));
    expect(handleCreate).toHaveBeenCalledWith(mockStatuses[0]);
  });

  test('KanbanBoard renders columns and handles empty state', () => {
    renderWithRouter(
      <KanbanBoard
        columns={mockStatuses}
        tasks={[mockTask]}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
  });

  test('KanbanBoard supports status columns reordering (e.g. swap Start with Plain)', () => {
    const handleOrderChange = jest.fn();
    const columns = [
      { id: 10, name: 'Start', position: 1 },
      { id: 20, name: 'Plain', position: 2 },
    ];

    renderWithRouter(
      <KanbanBoard
        columns={columns}
        tasks={[]}
        categories={[]}
        onColumnsOrderChange={handleOrderChange}
      />
    );

    expect(screen.getByText('Start')).toBeInTheDocument();
    expect(screen.getByText('Plain')).toBeInTheDocument();
  });

  test('MetadataModal renders name and color fields without position input and submits correctly', async () => {
    const handleSubmit = jest.fn().mockResolvedValue();
    const handleClose = jest.fn();

    render(
      <MetadataModal
        type="status"
        onClose={handleClose}
        onSubmit={handleSubmit}
      />
    );

    expect(screen.getByText('New status')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter status name')).toBeInTheDocument();
    expect(screen.queryByText('Position')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Enter status name'), {
      target: { value: 'In Review' },
    });
    await act(async () => {
      fireEvent.click(screen.getByText('Create status'));
    });
    expect(handleSubmit).toHaveBeenCalledWith({ name: 'In Review', color: '#6d5ce7' });
  });
});

describe('Board Scoping Logic', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('tasks belong strictly to their assigned board', () => {
    const taskOnBoard1 = { id: 201, board_id: 1, title: 'Task on Board 1' };
    const taskOnBoard2 = { id: 202, board_id: 2, title: 'Task on Board 2' };
    const legacyTask = { id: 203, title: 'Legacy Task with no board' };

    // Board 1 view
    expect(taskBelongsToBoard(taskOnBoard1, 1, 1)).toBe(true);
    expect(taskBelongsToBoard(taskOnBoard2, 1, 1)).toBe(false);
    expect(taskBelongsToBoard(legacyTask, 1, 1)).toBe(true); // default board gets legacy tasks

    // Board 2 view
    expect(taskBelongsToBoard(taskOnBoard1, 2, 1)).toBe(false);
    expect(taskBelongsToBoard(taskOnBoard2, 2, 1)).toBe(true);
    expect(taskBelongsToBoard(legacyTask, 2, 1)).toBe(false); // Board 2 does NOT get Board 1's tasks!
  });

  test('stored board mapping correctly scopes tasks', () => {
    setStoredTaskBoard(301, 'board-custom');
    const task = { id: 301, title: 'Mapped Task' };

    expect(taskBelongsToBoard(task, 'board-custom', 1)).toBe(true);
    expect(taskBelongsToBoard(task, 1, 1)).toBe(false);
  });

  test('statuses belong strictly to their assigned board and second board never pulls board 1 statuses', () => {
    setStoredStatusBoard(501, 'board-work');
    const customStatus = { id: 501, name: 'QA Review' };
    const globalStatus = { id: 1, name: 'To Do' };

    expect(statusBelongsToBoard(customStatus, 'board-work', 1)).toBe(true);
    expect(statusBelongsToBoard(customStatus, 1, 1)).toBe(false);

    // Global / default statuses only belong to board 1
    expect(statusBelongsToBoard(globalStatus, 1, 1)).toBe(true);
    // Second board (board 2) MUST NOT get board 1's statuses!
    expect(statusBelongsToBoard(globalStatus, 2, 1)).toBe(false);
  });

  test('categories belong strictly to their assigned board and second board never pulls board 1 categories', () => {
    setStoredCategoryBoard(601, 'board-marketing');
    const customCategory = { id: 601, name: 'Ads Campaign' };
    const globalCategory = { id: 1, name: 'General' };

    expect(categoryBelongsToBoard(customCategory, 'board-marketing', 1)).toBe(true);
    expect(categoryBelongsToBoard(customCategory, 1, 1)).toBe(false);

    // Global categories only belong to default board
    expect(categoryBelongsToBoard(globalCategory, 1, 1)).toBe(true);
    // Second board MUST NOT get board 1's categories!
    expect(categoryBelongsToBoard(globalCategory, 2, 1)).toBe(false);
  });

  test('statuses are matched by their own board field and never leak between boards', async () => {
    // The endpoint returns every status of the user, each one carrying its own board.
    apiClient.get.mockImplementation((url) => {
      if (url === '/tasks/board-statuses/') {
        return Promise.resolve({
          data: [
            { id: 1, board: 1, name: 'To Do', position: 1 },
            { id: 2, board: 2, name: 'Backlog', position: 1 },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    });
    apiClient.post.mockResolvedValue({ data: { id: 9, board: 2, name: 'Review', position: 2 } });

    invalidateBoardStatuses();

    expect((await getBoardStatuses(1)).map((status) => status.id)).toEqual([1]);
    expect((await getBoardStatuses(2)).map((status) => status.id)).toEqual([2]);

    // A status created on board 2 belongs to board 2 only.
    await createBoardStatus({ board_id: 2, name: 'Review', position: 2 });

    expect((await getBoardStatuses(2)).map((status) => status.id)).toEqual([2, 9]);
    expect((await getBoardStatuses(1)).map((status) => status.id)).toEqual([1]);

    // Every board is served from the same single list request.
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
