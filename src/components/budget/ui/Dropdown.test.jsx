import { render, screen, fireEvent } from '@testing-library/react';
import Dropdown from './Dropdown';

jest.mock('@iconscout/react-unicons', () => new Proxy({}, { get: () => () => null }));

const options = [{ value: 'all', label: 'All Types' }, { value: 'expense', label: 'Expense' }, { value: 3, label: 'Numeric' }];
const setup = (props = {}) => {
  const onChange = jest.fn();
  render(<Dropdown ariaLabel="Type" value="all" options={options} onChange={onChange} {...props} />);
  return onChange;
};

describe('Dropdown', () => {
  it('показує підпис вибраного значення і закритий список', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Type' }).textContent).toBe('All Types');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('показує placeholder, якщо значення не вибране', () => {
    setup({ value: '', placeholder: 'Select…' });
    expect(screen.getByRole('button', { name: 'Type' }).textContent).toBe('Select…');
  });

  it('відкривається по кліку й позначає вибраний пункт', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Type' }));
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: 'All Types' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('option', { name: 'Expense' }).getAttribute('aria-selected')).toBe('false');
  });

  it('вибір пункту викликає onChange і закриває список', () => {
    const onChange = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Type' }));
    fireEvent.click(screen.getByRole('option', { name: 'Expense' }));
    expect(onChange).toHaveBeenCalledWith('expense');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('повторний вибір того самого пункту не викликає onChange', () => {
    const onChange = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Type' }));
    fireEvent.click(screen.getByRole('option', { name: 'All Types' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('значення порівнюються як рядки (id категорії може бути числом)', () => {
    setup({ value: '3' });
    expect(screen.getByRole('button', { name: 'Type' }).textContent).toBe('Numeric');
  });

  it('закривається по Escape і по кліку поза списком', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Type' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Type' }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
