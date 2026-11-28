import { render, screen, fireEvent } from '@testing-library/react';
import ShoppingList from './ShoppingList';

jest.mock('@iconscout/react-unicons', () => ({ UilPlus: () => null, UilTrashAlt: () => null }));

const lists = [
  {
    id: 1,
    title: 'Magazine',
    items: [
      { id: 10, name: 'Tomato', quantity: 4, is_purchased: true },
      { id: 11, name: 'Salt', quantity: 1, is_purchased: false },
    ],
  },
  { id: 2, title: 'Supermarket', items: [] },
];

const setup = (props = {}) => {
  const handlers = { onToggle: jest.fn(), onAddItem: jest.fn(), onDeleteItem: jest.fn(), onAddList: jest.fn(), onDeleteList: jest.fn() };
  render(<ShoppingList lists={lists} {...handlers} {...props} />);
  return handlers;
};

describe('ShoppingList', () => {
  it('показує списки, позиції з кількістю та лічильник купленого', () => {
    setup();
    expect(screen.getByText('Magazine')).toBeTruthy();
    expect(screen.getByText('Tomato')).toBeTruthy();
    expect(screen.getByText('×4')).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();
    expect(screen.getByText('0 / 0')).toBeTruthy();
  });

  it('показує повідомлення, коли списків немає', () => {
    setup({ lists: [] });
    expect(screen.getByText('No shopping lists yet')).toBeTruthy();
  });

  it('створює список із обрізаним заголовком і чистить поле', () => {
    const { onAddList } = setup();
    const input = screen.getByPlaceholderText('New list name');
    fireEvent.change(input, { target: { value: '  Pharmacy  ' } });
    fireEvent.submit(input.closest('form'));
    expect(onAddList).toHaveBeenCalledWith('Pharmacy');
    expect(input.value).toBe('');
  });

  it('не створює список із порожньою назвою', () => {
    const { onAddList } = setup();
    const input = screen.getByPlaceholderText('New list name');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form'));
    expect(onAddList).not.toHaveBeenCalled();
  });

  it('додає позицію з кількістю 4', () => {
    const { onAddItem } = setup();
    const [nameInput] = screen.getAllByPlaceholderText('New position');
    const [qtyInput] = screen.getAllByLabelText('Quantity');
    fireEvent.change(nameInput, { target: { value: ' Tomato ' } });
    fireEvent.change(qtyInput, { target: { value: '4' } });
    fireEvent.submit(nameInput.closest('form'));
    expect(onAddItem).toHaveBeenCalledWith(1, 'Tomato', 4);
    expect(nameInput.value).toBe('');
    expect(qtyInput.value).toBe('');
  });

  it.each([['', 1], ['0', 1], ['-3', 1], ['abc', 1], ['5000', 999]])(
    'порожня або некоректна кількість "%s" перетворюється на %i',
    (raw, expected) => {
      const { onAddItem } = setup();
      const [nameInput] = screen.getAllByPlaceholderText('New position');
      const [qtyInput] = screen.getAllByLabelText('Quantity');
      fireEvent.change(nameInput, { target: { value: 'Salt' } });
      fireEvent.change(qtyInput, { target: { value: raw } });
      fireEvent.submit(nameInput.closest('form'));
      expect(onAddItem).toHaveBeenCalledWith(1, 'Salt', expected);
    }
  );

  it('не додає позицію без назви', () => {
    const { onAddItem } = setup();
    const [nameInput] = screen.getAllByPlaceholderText('New position');
    fireEvent.submit(nameInput.closest('form'));
    expect(onAddItem).not.toHaveBeenCalled();
  });

  it('чернетки списків незалежні одна від одної', () => {
    const { onAddItem } = setup();
    const [first, second] = screen.getAllByPlaceholderText('New position');
    fireEvent.change(second, { target: { value: 'Bread' } });
    expect(first.value).toBe('');
    fireEvent.submit(second.closest('form'));
    expect(onAddItem).toHaveBeenCalledWith(2, 'Bread', 1);
  });

  it('перемикає позицію, видаляє позицію і список', () => {
    const { onToggle, onDeleteItem, onDeleteList } = setup();
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    expect(onToggle).toHaveBeenCalledWith(1, 11);
    fireEvent.click(screen.getAllByLabelText('Delete')[0]);
    expect(onDeleteItem).toHaveBeenCalledWith(1, 10);
    fireEvent.click(screen.getAllByLabelText('Delete list')[1]);
    expect(onDeleteList).toHaveBeenCalledWith(2);
  });
});
