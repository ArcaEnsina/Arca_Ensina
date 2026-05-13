import { type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import PatientCreateForm from './PatientCreateForm';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));

// Mock hooks — mutable object so tests can toggle isPending
const mockCreatePatient = {
  mutate: vi.fn(),
  isPending: false,
};
vi.mock('../api', () => ({
  useCreatePatient: () => mockCreatePatient,
  useSymptoms: () => ({ data: [], isLoading: false }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  );
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('PatientCreateForm', () => {
  beforeEach(() => {
    mockCreatePatient.mutate.mockClear();
    mockCreatePatient.isPending = false;
    vi.mocked(toast.error).mockClear();
    vi.mocked(toast.success).mockClear();
  });

  it('renders form fields', () => {
    render(<PatientCreateForm />, { wrapper });

    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data de nasc/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gênero/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/peso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/altura/i)).toBeInTheDocument();
  });

  it('shows validation error when nome is empty', async () => {
    const user = userEvent.setup();
    render(<PatientCreateForm />, { wrapper });

    const submit = screen.getByRole('button', { name: /concluir cadastro/i });
    await user.click(submit);

    await waitFor(() => {
      expect(screen.getByText('Nome obrigatório')).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid peso', async () => {
    const user = userEvent.setup();
    render(<PatientCreateForm />, { wrapper });

    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva');
    await user.type(screen.getByLabelText(/data de nasc/i), '2020-01-15');
    await user.type(screen.getByLabelText(/telefone/i), '5581999999999');
    await user.type(screen.getByLabelText(/peso/i), '-5');

    const submit = screen.getByRole('button', { name: /concluir cadastro/i });
    await user.click(submit);

    await waitFor(() => {
      expect(
        screen.getByText('Peso deve ser maior que zero'),
      ).toBeInTheDocument();
    });
  });

  it('submits with valid data', async () => {
    const user = userEvent.setup();
    mockCreatePatient.mutate.mockImplementation(
      (_data: unknown, opts: { onSuccess?: () => void }) => {
        opts.onSuccess?.();
      },
    );

    render(<PatientCreateForm />, { wrapper });

    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva');
    await user.type(screen.getByLabelText(/data de nasc/i), '2020-01-15');
    await user.type(screen.getByLabelText(/telefone/i), '5581999999999');
    await user.type(screen.getByLabelText(/peso/i), '22.5');
    await user.type(screen.getByLabelText(/altura/i), '110');

    const submit = screen.getByRole('button', { name: /concluir cadastro/i });
    await user.click(submit);

    await waitFor(() => {
      expect(mockCreatePatient.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'João Silva',
          dataNascimento: '2020-01-15',
          genero: 'M',
          telefone: '5581999999999',
          peso: '22.5',
          altura: '110',
          alergias: [],
          sintomas: [],
        }),
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });
  });

  it('shows loading state while pending', () => {
    mockCreatePatient.isPending = true;

    render(<PatientCreateForm />, { wrapper });

    const button = screen.getByRole('button', { name: /salvando/i });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Salvando...');
  });

  it('shows generic error toast on API failure', async () => {
    const user = userEvent.setup();
    mockCreatePatient.mutate.mockImplementation(
      (_data: unknown, opts: { onError?: (e: unknown) => void }) => {
        opts.onError?.({ response: { data: { code: 'unknown_error' } } });
      },
    );

    render(<PatientCreateForm />, { wrapper });

    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva');
    await user.type(screen.getByLabelText(/data de nasc/i), '2020-01-15');
    await user.type(screen.getByLabelText(/telefone/i), '5581999999999');
    await user.type(screen.getByLabelText(/peso/i), '22.5');
    await user.type(screen.getByLabelText(/altura/i), '110');

    const submit = screen.getByRole('button', { name: /concluir cadastro/i });
    await user.click(submit);

    await waitFor(() => {
      expect(mockCreatePatient.mutate).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(
        'Erro inesperado. Tente novamente.',
      );
    });
  });

  it('shows validation error toast on validation_error code', async () => {
    const user = userEvent.setup();
    mockCreatePatient.mutate.mockImplementation(
      (_data: unknown, opts: { onError?: (e: unknown) => void }) => {
        opts.onError?.({ response: { data: { code: 'validation_error' } } });
      },
    );

    render(<PatientCreateForm />, { wrapper });

    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva');
    await user.type(screen.getByLabelText(/data de nasc/i), '2020-01-15');
    await user.type(screen.getByLabelText(/telefone/i), '5581999999999');
    await user.type(screen.getByLabelText(/peso/i), '22.5');
    await user.type(screen.getByLabelText(/altura/i), '110');

    const submit = screen.getByRole('button', { name: /concluir cadastro/i });
    await user.click(submit);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Dados inválidos. Verifique os campos.',
      );
    });
  });
});
