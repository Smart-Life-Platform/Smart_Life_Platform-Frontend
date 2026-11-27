import { render, screen, fireEvent, within } from '@testing-library/react';
import LimitsSettings from './LimitsSettings';

const categories = [
  { id: 1, name: 'Food', type: 'expense', monthly_limit: 6000 },
  { id: 2, name: 'Salary', type: 'income', monthly_limit: 0 },
  { id: 3, name: 'Transport', type: 'expense', monthly_limit: 0 },
];
const items = [{ category: categories[0], total: 4250 }];

const setup = (onChange = jest.fn().mockResolvedValue(true)) => {
  render(<LimitsSettings categories={categories} items={items} onChange={onChange} />);
  return onChange;
};
const open = (name) => fireEvent.click(screen.getByRole('button', { name: `Edit limit: ${name}` }));
const dialog = () => screen.getByRole('dialog');
const text = () => dialog().textContent.replace(/\s/g, ' ');

describe('LimitsSettings', () => {
  it('показує тільки категорії витрат з їхніми лімітами', () => {
    setup();
    expect(screen.queryByText('Salary')).toBeNull();
    expect(screen.getByRole('button', { name: 'Edit limit: Food' }).textContent).toBe('6000');
    expect(screen.getByRole('button', { name: 'Edit limit: Transport' }).textContent).toBe('0');
  });

  it('клік по значенню відкриває Edit limit з поточним лімітом і залишком', () => {
    setup();
    open('Food');
    expect(within(dialog()).getByText('Edit limit', { selector: 'h3' })).toBeTruthy();
    expect(text()).toMatch(/Current limit\s+6 000 ₴/);
    expect(text()).toMatch(/1 750 ₴ remaining/); // 6000 - 4250
  });

  it('залишок перераховується під час введення, а перевищення підсвічується', () => {
    setup();
    open('Food');
    fireEvent.change(within(dialog()).getByLabelText('Amount, ₴'), { target: { value: '4000' } });
    expect(text()).toMatch(/250 ₴ over the limit/);
    fireEvent.change(within(dialog()).getByLabelText('Amount, ₴'), { target: { value: '0' } });
    expect(text()).toMatch(/No limit/);
  });

  it('Save зберігає нову суму і закриває вікно', async () => {
    const onChange = setup();
    open('Food');
    fireEvent.change(within(dialog()).getByLabelText('Amount, ₴'), { target: { value: '7000' } });
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save' }));
    await screen.findByText('Food');
    expect(onChange).toHaveBeenCalledWith(1, 7000);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('від’ємна або порожня сума: Save вимкнений', () => {
    const onChange = setup();
    open('Food');
    const save = within(dialog()).getByRole('button', { name: 'Save' });
    fireEvent.change(within(dialog()).getByLabelText('Amount, ₴'), { target: { value: '-5' } });
    expect(save.disabled).toBe(true);
    fireEvent.change(within(dialog()).getByLabelText('Amount, ₴'), { target: { value: '' } });
    expect(save.disabled).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('Cancel і Escape закривають вікно без збереження', () => {
    const onChange = setup();
    open('Food');
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    open('Food');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('вікно лишається відкритим, якщо збереження не вдалось', async () => {
    const onChange = setup(jest.fn().mockResolvedValue(false));
    open('Food');
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Save' }));
    await new Promise((r) => setTimeout(r, 0)); // дати завершитись асинхронному збереженню
    expect(onChange).toHaveBeenCalledWith(1, 6000);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
