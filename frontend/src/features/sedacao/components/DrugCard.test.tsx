import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { DrugCard } from './DrugCard';
import type { DrugOption } from '../types';

const mockDrug: DrugOption = {
  id: 'Midazolam IV contínua',
  name: 'Midazolam',
  category: 'Benzodiazepínico',
  route: 'Infusão contínua',
  icon: 'Brain',
  destinations: ['Diazepam VO'],
  doseUnit: 'mg/kg/h',
  dosePlaceholder: '0.1',
  taperType: 'midaz',
  scaleType: 'RASS',
};

describe('DrugCard', () => {
  it('renders drug name, category, and route', () => {
    render(<DrugCard drug={mockDrug} />);

    expect(screen.getByText('Midazolam')).toBeInTheDocument();
    expect(screen.getByText(/Benzodiazepínico/)).toBeInTheDocument();
    expect(screen.getByText(/Infusão contínua/)).toBeInTheDocument();
  });

  it('renders as radio button with aria-checked', () => {
    const { rerender } = render(<DrugCard drug={mockDrug} selected={false} />);
    const button = screen.getByRole('radio');
    expect(button).toHaveAttribute('aria-checked', 'false');

    rerender(<DrugCard drug={mockDrug} selected={true} />);
    expect(button).toHaveAttribute('aria-checked', 'true');
  });

  it('has accessible label', () => {
    render(<DrugCard drug={mockDrug} />);
    expect(
      screen.getByRole('radio', { name: /Midazolam — Benzodiazepínico · Infusão contínua/ }),
    ).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<DrugCard drug={mockDrug} onClick={onClick} />);

    await user.click(screen.getByRole('radio'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows checkmark when selected', () => {
    const { container } = render(<DrugCard drug={mockDrug} selected={true} />);
    expect(container.querySelector('svg.lucide-check')).toBeInTheDocument();
  });

  it('has blue border when selected', () => {
    const { container } = render(<DrugCard drug={mockDrug} selected={true} />);
    const button = container.querySelector('button')!;
    expect(button.className).toContain('border-blue-700');
  });

  it('has min touch target size', () => {
    const { container } = render(<DrugCard drug={mockDrug} />);
    const button = container.querySelector('button')!;
    expect(button.className).toContain('min-h-[44px]');
    expect(button.className).toContain('min-w-[44px]');
  });

  it('is hidden when hidden prop is true', () => {
    const { container } = render(<DrugCard drug={mockDrug} hidden={true} />);
    const button = container.querySelector('button')!;
    expect(button.className).toContain('h-0');
    expect(button.className).toContain('opacity-0');
    expect(button).toHaveAttribute('tabindex', '-1');
  });
});
