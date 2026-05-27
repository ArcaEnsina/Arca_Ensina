import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ClassificationBadge } from './ClassificationBadge';
import type { PanelCalculationResult } from '../types';

function makeResult(overrides: Partial<PanelCalculationResult> = {}): PanelCalculationResult {
  return {
    totalDaily: { value: '10.5000', unit: 'mg/24h' },
    perDose: { value: '2.6250', unit: 'mg/dose' },
    dosesPerDay: 4,
    frequency: '6/6h',
    recommended: { value: '2.6250', unit: 'mg/dose' },
    formulaApplied: 'dose * fator_conversao',
    warnings: [],
    ...overrides,
  };
}

describe('ClassificationBadge', () => {
  it('renders within_range status with per-dose primary value', () => {
    render(
      <ClassificationBadge result={makeResult()} />,
    );

    expect(screen.getByText('2.6250 mg/dose')).toBeInTheDocument();
    expect(screen.getByText('Total: 10.5000 mg/24h')).toBeInTheDocument();
    expect(screen.getByText('4x ao dia')).toBeInTheDocument();
    expect(screen.getByText('6/6h')).toBeInTheDocument();
    expect(screen.getByText('Dentro do intervalo seguro')).toBeInTheDocument();
    expect(screen.getByText('dose * fator_conversao')).toBeInTheDocument();
  });

  it('renders above_max status with role="alert"', () => {
    const result = makeResult({
      perDose: { value: '40.5000', unit: 'mg/dose' },
      totalDaily: { value: '162.0000', unit: 'mg/24h' },
      warnings: [
        {
          type: 'above_max_recommended',
          drug: 'Diazepam',
          currentDose: '40.5000',
          maxAllowed: '10.0000',
          unit: 'mg',
          message: 'Dose por administração (40.5000 mg/dose) excede o máximo recomendado (10.0000 mg/dose).',
        },
      ],
    });

    render(<ClassificationBadge result={result} />);

    expect(screen.getByText('40.5000 mg/dose')).toBeInTheDocument();
    expect(screen.getByText('Total: 162.0000 mg/24h')).toBeInTheDocument();
    expect(screen.getByText('Acima do máximo recomendado')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('renders below_min status with role="alert"', () => {
    const result = makeResult({
      perDose: { value: '0.5000', unit: 'mg/dose' },
      totalDaily: { value: '2.0000', unit: 'mg/24h' },
      warnings: [
        {
          type: 'below_min_recommended',
          drug: 'Diazepam',
          currentDose: '0.5000',
          maxAllowed: '2.0000',
          unit: 'mg',
          message: 'Dose abaixo do mínimo recomendado.',
        },
      ],
    });

    render(<ClassificationBadge result={result} />);

    expect(screen.getByText('0.5000 mg/dose')).toBeInTheDocument();
    expect(screen.getByText('Total: 2.0000 mg/24h')).toBeInTheDocument();
    expect(screen.getByText('Abaixo do mínimo recomendado')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not have role="alert" when within_range', () => {
    render(<ClassificationBadge result={makeResult()} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('applies correct color classes for each status', () => {
    const { container, rerender } = render(
      <ClassificationBadge result={makeResult()} />,
    );

    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain('green');

    rerender(
      <ClassificationBadge result={makeResult({
        warnings: [{ type: 'above_max_recommended', drug: 'Diazepam', currentDose: '40', maxAllowed: '10', unit: 'mg', message: 'above' }],
      })} />,
    );
    expect(root.className).toContain('red');

    rerender(
      <ClassificationBadge result={makeResult({
        warnings: [{ type: 'below_min_recommended', drug: 'Diazepam', currentDose: '0.5', maxAllowed: '2', unit: 'mg', message: 'below' }],
      })} />,
    );
    expect(root.className).toContain('yellow');
  });

  it('renders recommended dose info when warnings present', () => {
    const result = makeResult({
      perDose: { value: '40.5000', unit: 'mg/dose' },
      recommended: { value: '10.0000', unit: 'mg/dose' },
      warnings: [
        {
          type: 'above_max_recommended',
          drug: 'Diazepam',
          currentDose: '40.5000',
          maxAllowed: '10.0000',
          unit: 'mg',
          message: 'Dose por administração (40.5000 mg/dose) excede o máximo recomendado (10.0000 mg/dose).',
        },
      ],
    });

    render(<ClassificationBadge result={result} />);

    expect(screen.getByText(/Recomendada: 10\.0000 mg\/dose/)).toBeInTheDocument();
  });

  it('shows dose selection buttons when warnings present and onSelectDose provided', () => {
    const onSelectDose = vi.fn();
    const result = makeResult({
      perDose: { value: '40.5000', unit: 'mg/dose' },
      recommended: { value: '10.0000', unit: 'mg/dose' },
      warnings: [
        {
          type: 'above_max_recommended',
          drug: 'Diazepam',
          currentDose: '40.5000',
          maxAllowed: '10.0000',
          unit: 'mg',
          message: 'Dose excede máximo.',
        },
      ],
    });

    render(
      <ClassificationBadge
        result={result}
        selectedDose="calculated"
        onSelectDose={onSelectDose}
      />,
    );

    expect(screen.getByText('Selecione a dose para prescrição:')).toBeInTheDocument();
    expect(screen.getByText('Calculada')).toBeInTheDocument();
    expect(screen.getAllByText('40.5000 mg/dose')).toHaveLength(2); // primary display + button
    expect(screen.getByText('Recomendada')).toBeInTheDocument();
    expect(screen.getByText('10.0000 mg/dose')).toBeInTheDocument();
  });

  it('does not show dose selection when within_range', () => {
    const onSelectDose = vi.fn();
    render(
      <ClassificationBadge
        result={makeResult()}
        selectedDose="calculated"
        onSelectDose={onSelectDose}
      />,
    );

    expect(screen.queryByText('Selecione a dose para prescrição:')).not.toBeInTheDocument();
  });

  it('does not show dose selection when no onSelectDose callback', () => {
    const result = makeResult({
      warnings: [
        {
          type: 'above_max_recommended',
          drug: 'Diazepam',
          currentDose: '40.5000',
          maxAllowed: '10.0000',
          unit: 'mg',
          message: 'above',
        },
      ],
    });

    render(<ClassificationBadge result={result} />);

    expect(screen.queryByText('Selecione a dose para prescrição:')).not.toBeInTheDocument();
  });

  it('calls onSelectDose with "calculated" when calculated button clicked', async () => {
    const user = userEvent.setup();
    const onSelectDose = vi.fn();
    const result = makeResult({
      perDose: { value: '40.5000', unit: 'mg/dose' },
      recommended: { value: '10.0000', unit: 'mg/dose' },
      warnings: [
        {
          type: 'above_max_recommended',
          drug: 'Diazepam',
          currentDose: '40.5000',
          maxAllowed: '10.0000',
          unit: 'mg',
          message: 'above',
        },
      ],
    });

    render(
      <ClassificationBadge
        result={result}
        selectedDose="recommended"
        onSelectDose={onSelectDose}
      />,
    );

    await user.click(screen.getByText('Calculada'));
    expect(onSelectDose).toHaveBeenCalledWith('calculated');
  });

  it('calls onSelectDose with "recommended" when recommended button clicked', async () => {
    const user = userEvent.setup();
    const onSelectDose = vi.fn();
    const result = makeResult({
      perDose: { value: '40.5000', unit: 'mg/dose' },
      recommended: { value: '10.0000', unit: 'mg/dose' },
      warnings: [
        {
          type: 'above_max_recommended',
          drug: 'Diazepam',
          currentDose: '40.5000',
          maxAllowed: '10.0000',
          unit: 'mg',
          message: 'above',
        },
      ],
    });

    render(
      <ClassificationBadge
        result={result}
        selectedDose="calculated"
        onSelectDose={onSelectDose}
      />,
    );

    await user.click(screen.getByText('Recomendada'));
    expect(onSelectDose).toHaveBeenCalledWith('recommended');
  });

  it('highlights calculated button when selectedDose is "calculated"', () => {
    const result = makeResult({
      warnings: [
        {
          type: 'above_max_recommended',
          drug: 'Diazepam',
          currentDose: '40.5000',
          maxAllowed: '10.0000',
          unit: 'mg',
          message: 'above',
        },
      ],
    });

    render(
      <ClassificationBadge
        result={result}
        selectedDose="calculated"
        onSelectDose={vi.fn()}
      />,
    );

    const calculatedBtn = screen.getByText('Calculada').closest('button')!;
    expect(calculatedBtn.className).toContain('bg-red-700');
  });

  it('highlights recommended button when selectedDose is "recommended"', () => {
    const result = makeResult({
      warnings: [
        {
          type: 'above_max_recommended',
          drug: 'Diazepam',
          currentDose: '40.5000',
          maxAllowed: '10.0000',
          unit: 'mg',
          message: 'above',
        },
      ],
    });

    render(
      <ClassificationBadge
        result={result}
        selectedDose="recommended"
        onSelectDose={vi.fn()}
      />,
    );

    const recommendedBtn = screen.getByText('Recomendada').closest('button')!;
    expect(recommendedBtn.className).toContain('bg-blue-700');
  });

  it('renders frequency pill with correct dosesPerDay and frequency', () => {
    const result = makeResult({
      perDose: { value: '16.0000', unit: 'mg/dose' },
      totalDaily: { value: '48.0000', unit: 'mg/24h' },
      dosesPerDay: 3,
      frequency: '8/8h',
    });

    render(<ClassificationBadge result={result} />);

    expect(screen.getByText('3x ao dia')).toBeInTheDocument();
    expect(screen.getByText('8/8h')).toBeInTheDocument();
    expect(screen.getByText('16.0000 mg/dose')).toBeInTheDocument();
    expect(screen.getByText('Total: 48.0000 mg/24h')).toBeInTheDocument();
  });

  it('renders continuous frequency correctly', () => {
    const result = makeResult({
      perDose: { value: '5.0000', unit: 'mg/dose' },
      totalDaily: { value: '5.0000', unit: 'mg/24h' },
      dosesPerDay: 1,
      frequency: 'contínua',
    });

    render(<ClassificationBadge result={result} />);

    expect(screen.getByText('1x ao dia')).toBeInTheDocument();
    expect(screen.getByText('contínua')).toBeInTheDocument();
  });

  it('renders warning message when present', () => {
    const result = makeResult({
      warnings: [
        {
          type: 'above_max_recommended',
          drug: 'Diazepam',
          currentDose: '40.5000',
          maxAllowed: '10.0000',
          unit: 'mg',
          message: 'Dose por administração (40.5000 mg/dose) excede o máximo recomendado (10.0000 mg/dose).',
        },
      ],
    });

    render(<ClassificationBadge result={result} />);

    expect(screen.getByText(/Dose por administração/)).toBeInTheDocument();
  });
});
