import { render, screen, fireEvent, within } from '@testing-library/react';
import ShoppingList from './ShoppingList';

jest.mock('@iconscout/react-unicons', () => new Proxy({}, { get: () => () => null }));

const lists = [
  {
    id: 1,
    title: 'Magazine',
    items: [
      { id: 10, name: 'Tomato', quantity: 4, unit: 'pcs', is_purchased: true },
      { id: 11, name: 'Flour', quantity: 1.5, unit: 'kg', is_purchased: false },
    ],
  },
  { id: 2, title: 'Supermarket', items: [] },
];

const setup = (props = {}) => {
  const handlers = {
    onToggle: jest.fn(), onAddItem: jest.fn().mockResolvedValue(true), onEditItem: jest.fn().mockResolvedValue(true),
    onDeleteItem: jest.fn(), onAddList: jest.fn(), onDeleteList: jest.fn(),
  };
  render(<ShoppingList lists={lists} {...handlers} {...props} />);
  return handlers;
};
const dialog = () => screen.getByRole('dialog');

describe('ShoppingList', () => {
  it('показує списки, кількість з одиницею та лічильник купленого', () => {
    setup();
    expect(screen.getByText('Magazine')).toBeTruthy();
    expect(screen.getByText('4 pcs')).toBeTruthy();
    expect(screen.getByText('1.5 kg')).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();
    expect(screen.getByText('0 / 0')).toBeTruthy();
  });

  it('показує повідомлення, коли списків немає', () => {
    setup({ lists: [] });
    expect(screen.getByText('No shopping lists yet')).toBeTruthy();
  });

  it('створює список із обрізаним заголовком, а порожню назву ігнорує', () => {
    const { onAddList } = setup();
    const input = screen.getByPlaceholderText('New list name');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form'));
    expect(onAddList).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '  Pharmacy  ' } });
    fireEvent.submit(input.closest('form'));
    expect(onAddList).toHaveBeenCalledWith('Pharmacy');
    expect(input.value).toBe('');
  });

  it('кнопка + відкриває вікно Add item з уже введеною назвою', () => {
    setup();
    const [nameInput] = screen.getAllByPlaceholderText('New position');
    fireEvent.change(nameInput, { target: { value: ' Tomato ' } });
    fireEvent.submit(nameInput.closest('form'));
    expect(within(dialog()).getByText('Add item', { selector: 'h3' })).toBeTruthy();
    expect(within(dialog()).getByLabelText('Product name').value).toBe('Tomato');
    expect(nameInput.value).toBe('');
  });

  it('додає позицію: 4 томати в штуках', async () => {
    const { onAddItem } = setup();
    const [nameInput] = screen.getAllByPlaceholderText('New position');
    fireEvent.change(nameInput, { target: { value: 'Tomato' } });
    fireEvent.submit(nameInput.closest('form'));
    fireEvent.change(within(dialog()).getByLabelText('Quantity'), { target: { value: '4' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Add item' }));
    await screen.findByText('Magazine');
    expect(onAddItem).toHaveBeenCalledWith(1, { name: 'Tomato', quantity: 4, unit: 'pcs' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('обирає одиницю виміру зі списку', async () => {
    const { onAddItem } = setup();
    const [nameInput] = screen.getAllByPlaceholderText('New position');
    fireEvent.change(nameInput, { target: { value: 'Flour' } });
    fireEvent.submit(nameInput.closest('form'));
    fireEvent.change(within(dialog()).getByLabelText('Quantity'), { target: { value: '1.5' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Unit' }));
    fireEvent.click(screen.getByRole('option', { name: 'kg' }));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Add item' }));
    await screen.findByText('Magazine');
    expect(onAddItem).toHaveBeenCalledWith(1, { name: 'Flour', quantity: 1.5, unit: 'kg' });
  });

  it.each([['', 'Quantity must be greater than 0'], ['0', 'Quantity must be greater than 0'], ['-2', 'Quantity must be greater than 0']])(
    'не зберігає позицію з кількістю "%s"',
    (qty, message) => {
      const { onAddItem } = setup();
      const [nameInput] = screen.getAllByPlaceholderText('New position');
      fireEvent.change(nameInput, { target: { value: 'Salt' } });
      fireEvent.submit(nameInput.closest('form'));
      fireEvent.change(within(dialog()).getByLabelText('Quantity'), { target: { value: qty } });
      fireEvent.click(within(dialog()).getByRole('button', { name: 'Add item' }));
      expect(within(dialog()).getByText(message)).toBeTruthy();
      expect(onAddItem).not.toHaveBeenCalled();
    }
  );

  it('не зберігає позицію без назви', () => {
    const { onAddItem } = setup();
    const [nameInput] = screen.getAllByPlaceholderText('New position');
    fireEvent.submit(nameInput.closest('form'));
    fireEvent.change(within(dialog()).getByLabelText('Quantity'), { target: { value: '2' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Add item' }));
    expect(within(dialog()).getByText('Enter a product name')).toBeTruthy();
    expect(onAddItem).not.toHaveBeenCalled();
  });

  it('вікно залишається відкритим, якщо збереження не вдалось', async () => {
    const onAddItem = jest.fn().mockResolvedValue(false);
    setup({ onAddItem });
    const [nameInput] = screen.getAllByPlaceholderText('New position');
    fireEvent.change(nameInput, { target: { value: 'Salt' } });
    fireEvent.submit(nameInput.closest('form'));
    fireEvent.change(within(dialog()).getByLabelText('Quantity'), { target: { value: '1' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Add item' }));
    await new Promise((r) => setTimeout(r, 0)); // дати завершитись асинхронному збереженню
    expect(onAddItem).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('клік по позиції відкриває Edit item із її даними і зберігає зміни', async () => {
    const { onEditItem } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Flour' }));
    expect(within(dialog()).getByText('Edit item', { selector: 'h3' })).toBeTruthy();
    expect(within(dialog()).getByLabelText('Product name').value).toBe('Flour');
    expect(within(dialog()).getByLabelText('Quantity').value).toBe('1.5');
    fireEvent.change(within(dialog()).getByLabelText('Quantity'), { target: { value: '3' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Magazine');
    expect(onEditItem).toHaveBeenCalledWith(1, 11, { name: 'Flour', quantity: 3, unit: 'kg' });
  });

  it('Cancel закриває вікно без збереження', () => {
    const { onAddItem, onEditItem } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Edit Flour' }));
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onAddItem).not.toHaveBeenCalled();
    expect(onEditItem).not.toHaveBeenCalled();
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
