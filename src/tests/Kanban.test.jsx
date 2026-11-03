import { render, screen, fireEvent, act } from '@testing-library/react';
import KanbanBoard from '../components/kanban/KanbanBoard';
import KanbanColumn from '../components/kanban/KanbanColumn';
import TaskCard from '../components/kanban/TaskCard';
import TaskDetailsPopover from '../components/kanban/TaskDetailsPopover';
import DropZone from '../components/kanban/DropZone';
import MetadataModal from '../components/kanban/MetadataModal';
import { getBoardStatuses, createBoardStatus } from '../api/boardStatusesApi';
import {
  taskBelongsToBoard,
  statusBelongsToBoard,
  categoryBelongsToBoard,
  setStoredTaskBoard,
  setStoredStatusBoard,
  setStoredCategoryBoard,
} from '../utils/boardScope';

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

    render(
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
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Edit'));
    expect(handleEdit).toHaveBeenCalledWith(mockTask);

    fireEvent.click(screen.getByLabelText('Delete task'));
    expect(handleDelete).toHaveBeenCalledWith(mockTask);

    fireEvent.click(screen.getByLabelText('Task details'));
    expect(handleDetails).toHaveBeenCalledWith(mockTask);
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

    render(
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
    render(
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

  test('second board statuses API returns empty array initially, and only its own statuses when added', async () => {
    window.localStorage.setItem('avenor_boards', JSON.stringify([
      { id: 1, name: 'Board 1' },
      { id: 2, name: 'Board 2' },
    ]));

    // Board 2 initially has NO statuses
    const board2Statuses = await getBoardStatuses(2);
    expect(board2Statuses).toEqual([]);

    // Board 1 gets default statuses
    const board1Statuses = await getBoardStatuses(1);
    expect(board1Statuses.length).toBeGreaterThan(0);

    // When status is created on Board 2, only Board 2 has it
    await createBoardStatus({ board_id: 2, name: 'Backlog', position: 1 });
    const updatedBoard2Statuses = await getBoardStatuses(2);
    expect(updatedBoard2Statuses.length).toBe(1);
    expect(updatedBoard2Statuses[0].name).toBe('Backlog');
  });
});
