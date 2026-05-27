import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConversionMatrix } from './ConversionMatrix';
import { sedationFormSchema, type SedationFormData } from '../schemas';
import type { PanelDrugOption, PanelCalculationResult } from '../types';

const drugOptions: PanelDrugOption[] = [
  { id: '1', name: 'Midazolam', route: 'iv' },
  { id: '2', name: 'Diazepam', route: 'oral' },
  { id: '3', name: 'Lorazepam', route: 'sublingual' },
];

const mockOnCalculate = vi.fn();

const mockResult: PanelCalculationResult = {
  totalDaily: { value: '5.0000', unit: 'mg/24h' },
  perDose: { value: '1.2500', unit: 'mg/dose' },
  dosesPerDay: 4,
  frequency: '6/6h',
  recommended: { value: '1.2500', unit: 'mg/dose' },
  formulaApplied: 'dose * 0.5',
  warnings: [],
};

function FormWrapper({
  result = null,
  loading = false,
  drugError = null,
}: {
  result?: PanelCalculationResult | null;
  loading?: boolean;
  drugError?: Error | null;
}) {
  const form = useForm<SedationFormData>({
    resolver: zodResolver(sedationFormSchema),
    mode: 'onBlur',
    defaultValues: {
      sourceDrugId: '',
      targetDrugId: '',
      route: '',
      currentDose: '',
      patientWeight: '',
    },
  });

  return (
    <ConversionMatrix
      form={form}
      drugOptions={drugOptions}
      drugError={drugError}
      result={result}
      loading={loading}
      onCalculate={mockOnCalculate}
    />
  );
}

describe('ConversionMatrix', () => {
  it('renders all form input sections', () => {
    render(<FormWrapper />);

    expect(
      screen.getByRole('combobox', { name: /medicamento de origem/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: /medicamento de destino/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: /via de administração/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /dose atual/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /peso do paciente/i }),
    ).toBeInTheDocument();
  });

  it('shows placeholder when no result', () => {
    render(<FormWrapper />);

    expect(
      screen.getByText(/Preencha todos os campos/i),
    ).toBeInTheDocument();
  });

  it('shows result area with aria-live="polite"', () => {
    render(<FormWrapper result={mockResult} />);

    const liveRegion = screen.getByText('1.2500 mg/dose').closest('[aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(<FormWrapper loading={true} />);

    // Placeholder text is NOT shown while loading
    expect(
      screen.queryByText(/Preencha todos os campos/i),
    ).not.toBeInTheDocument();

    // The right column should exist with aria-live="polite"
    const rightColumn = container.querySelector('[aria-live="polite"]');
    expect(rightColumn).toBeInTheDocument();
  });

  it('displays drug options in select dropdowns', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />);

    // Open the source drug select
    const sourceTrigger = screen.getByRole('combobox', { name: /medicamento de origem/i });
    await user.click(sourceTrigger);

    // Radix UI renders portal content in body.
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Midazolam' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Diazepam' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Lorazepam' })).toBeInTheDocument();
  });

  it('shows validation error on blur for invalid dose', async () => {
    const user = userEvent.setup();
    render(<FormWrapper />);

    const doseInput = screen.getByRole('textbox', { name: /dose atual/i });
    await user.type(doseInput, '0');

    // Move focus away to trigger onBlur validation
    const weightInput = screen.getByRole('textbox', { name: /peso do paciente/i });
    await user.click(weightInput);

    expect(
      screen.getByText(/Dose atual deve ser maior que zero/i),
    ).toBeInTheDocument();
  });

  it('renders "Calcular conversão" button', () => {
    render(<FormWrapper />);

    expect(
      screen.getByRole('button', { name: /calcular conversão/i }),
    ).toBeInTheDocument();
  });

  it('disables calculate button when form is incomplete', () => {
    render(<FormWrapper />);

    const button = screen.getByRole('button', { name: /calcular conversão/i });
    expect(button).toBeDisabled();
  });

  it('calls onCalculate when button is clicked with valid form', async () => {
    const user = userEvent.setup();

    // Use a wrapper that pre-fills valid values
    function ValidFormWrapper() {
      const form = useForm<SedationFormData>({
        resolver: zodResolver(sedationFormSchema),
        defaultValues: {
          sourceDrugId: '1',
          targetDrugId: '2',
          route: 'oral',
          currentDose: '10',
          patientWeight: '22',
        },
      });

      return (
        <ConversionMatrix
          form={form}
          drugOptions={drugOptions}
          result={null}
          loading={false}
          onCalculate={mockOnCalculate}
        />
      );
    }

    render(<ValidFormWrapper />);

    const button = screen.getByRole('button', { name: /calcular conversão/i });
    expect(button).not.toBeDisabled();

    await user.click(button);
    expect(mockOnCalculate).toHaveBeenCalledTimes(1);
  });

  it('shows error message when drug loading fails', () => {
    render(<FormWrapper drugError={new Error('Network error')} />);

    expect(
      screen.getByText(/Erro ao carregar medicamentos/i),
    ).toBeInTheDocument();
  });
});
