import { render, screen, fireEvent } from '@testing-library/react';
import LimitsSettings from './LimitsSettings';

const categories = [
  { id: 1, name: 'Food', type: 'expense', monthly_limit: 100 },
  { id: 2, name: 'Salary', type: 'income', monthly_limit: 0 },
  { id: 3, name: 'Transport', type: 'expense', monthly_limit: 0 },
];

const setup = () => {
  const onChange = jest.fn();
  render(<LimitsSettings categories={categories} onChange={onChange} />);
  return { onChange, input: (name) => screen.getByText(name).closest('label').querySelector('input') };
};

describe('LimitsSettings', () => {
  it('показує тільки категорії витрат', () => {
    setup();
    expect(screen.queryByText('Salary')).toBeNull();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
  });

  it('зберігає значення лише після blur, а не на кожну цифру', () => {
    const { onChange, input } = setup();
    fireEvent.change(input('Food'), { target: { value: '250' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(input('Food'));
    expect(onChange).toHaveBeenCalledWith(1, 250);
  });

  it('не викликає onChange, якщо значення не змінилось', () => {
    const { onChange, input } = setup();
    fireEvent.change(input('Food'), { target: { value: '100' } });
    fireEvent.blur(input('Food'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('від’ємне значення стає 0, а сміття — 0', () => {
    const { onChange, input } = setup();
    fireEvent.change(input('Food'), { target: { value: '-20' } });
    fireEvent.blur(input('Food'));
    expect(onChange).toHaveBeenLastCalledWith(1, 0);
  });

  it('blur без редагування нічого не робить', () => {
    const { onChange, input } = setup();
    fireEvent.blur(input('Transport'));
    expect(onChange).not.toHaveBeenCalled();
  });
});
