import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TaperingTable } from './TaperingTable';
import type { TaperingDay } from '../types';

const schedule: TaperingDay[] = [
  { day: 1, dose: '10.0 mg', applied: false },
  { day: 2, dose: '7.5 mg', applied: false },
  { day: 3, dose: '5.0 mg', applied: false },
];

const partialSchedule: TaperingDay[] = [
  { day: 1, dose: '10.0 mg', applied: true },
  { day: 2, dose: '7.5 mg', applied: false },
  { day: 3, dose: '5.0 mg', applied: false },
];

const completedSchedule: TaperingDay[] = [
  { day: 1, dose: '10.0 mg', applied: true },
  { day: 2, dose: '7.5 mg', applied: true },
  { day: 3, dose: '5.0 mg', applied: true },
];

describe('TaperingTable', () => {
  it('renders all days in the schedule', () => {
    const onToggle = vi.fn();
    render(<TaperingTable schedule={schedule} onToggleApplied={onToggle} />);

    expect(screen.getByText('Dia 1')).toBeInTheDocument();
    expect(screen.getByText('Dia 2')).toBeInTheDocument();
    expect(screen.getByText('Dia 3')).toBeInTheDocument();
    expect(screen.getByText('10.0 mg')).toBeInTheDocument();
    expect(screen.getByText('7.5 mg')).toBeInTheDocument();
    expect(screen.getByText('5.0 mg')).toBeInTheDocument();
  });

  it('shows pending status for unapplied days', () => {
    const onToggle = vi.fn();
    render(<TaperingTable schedule={schedule} onToggleApplied={onToggle} />);

    const pendingBadges = screen.getAllByText('Pendente');
    expect(pendingBadges).toHaveLength(3);
  });

  it('shows applied status for completed days', () => {
    const onToggle = vi.fn();
    render(<TaperingTable schedule={completedSchedule} onToggleApplied={onToggle} />);

    const appliedBadges = screen.getAllByText('Aplicada');
    expect(appliedBadges).toHaveLength(3);
  });

  it('shows completion message when all days applied', () => {
    const onToggle = vi.fn();
    render(<TaperingTable schedule={completedSchedule} onToggleApplied={onToggle} />);

    expect(screen.getByText('Desmame concluído')).toBeInTheDocument();
  });

  it('shows progress when some days applied', () => {
    const onToggle = vi.fn();
    render(<TaperingTable schedule={partialSchedule} onToggleApplied={onToggle} />);

    expect(
      screen.getByText(/Em andamento — 1 de 3 dias aplicados/),
    ).toBeInTheDocument();
  });

  it('calls onToggleApplied when button is clicked', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<TaperingTable schedule={schedule} onToggleApplied={onToggle} />);

    const markButtons = screen.getAllByRole('button', { name: /marcar/i });
    await user.click(markButtons[0]);

    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it('has accessible aria-labels on toggle buttons', () => {
    const onToggle = vi.fn();
    render(<TaperingTable schedule={schedule} onToggleApplied={onToggle} />);

    expect(
      screen.getByRole('button', { name: /marcar dia 1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /marcar dia 2/i }),
    ).toBeInTheDocument();
  });

  it('allows toggling back from applied to unapplied', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<TaperingTable schedule={completedSchedule} onToggleApplied={onToggle} />);

    const unmarkButtons = screen.getAllByRole('button', { name: /desmarcar/i });
    await user.click(unmarkButtons[0]);

    expect(onToggle).toHaveBeenCalledWith(1);
  });
});
