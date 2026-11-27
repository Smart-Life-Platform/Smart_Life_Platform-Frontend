import { render, screen, fireEvent, within } from '@testing-library/react';
import TransactionList from './TransactionList';

jest.mock('@iconscout/react-unicons', () => new Proxy({}, { get: () => () => null }));

const categories = [{ id: 1, name: 'Groceries', icon: 'basket', color: '#6b5bd2' }, { id: 2, name: 'Salary', icon: 'work', color: '#4a8f73' }];
const records = [
  { id: 1, type: 'expense', amount: 2150, category_id: 1, date: '2026-10-16', description: 'Weekly' },
  { id: 2, type: 'income', amount: 25000, category_id: 2, date: '2026-10-05', description: '' },
];

describe('TransactionList', () => {
  it('показує порожній стан', () => {
    render(<TransactionList records={[]} categories={categories} onDelete={jest.fn()} />);
    expect(screen.getByText('No transactions found')).toBeTruthy();
  });

  it('сортує від новіших до старіших і показує знак суми', () => {
    render(<TransactionList records={[...records].reverse()} categories={categories} onDelete={jest.fn()} />);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0].textContent).toMatch(/Groceries/);
    expect(rows[0].textContent).toMatch(/−/);
    expect(rows[1].textContent).toMatch(/\+/);
  });

  it('видалення вимагає підтвердження: назва категорії у вікні, Cancel нічого не видаляє', () => {
    const onDelete = jest.fn();
    render(<TransactionList records={records} categories={categories} onDelete={onDelete} />);
    fireEvent.click(screen.getAllByLabelText('Delete')[0]);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Delete transaction?')).toBeTruthy();
    expect(within(dialog).getByText('Groceries')).toBeTruthy();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('Delete у вікні викликає onDelete з id запису', () => {
    const onDelete = jest.fn();
    render(<TransactionList records={records} categories={categories} onDelete={onDelete} />);
    fireEvent.click(screen.getAllByLabelText('Delete')[1]);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith(2);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
