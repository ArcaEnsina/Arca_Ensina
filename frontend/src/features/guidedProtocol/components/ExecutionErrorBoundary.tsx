import { Component, type ReactNode } from 'react';
import { Link } from 'react-router';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ExecutionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error) {
    // Log structured — no PII
    console.error('[ExecutionErrorBoundary]', error.message);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h2 className="text-lg font-semibold">
            Ocorreu um erro na execução do protocolo
          </h2>
          <p className="text-sm text-muted-foreground">
            Tente recarregar a página. Se o problema persistir, selecione o
            protocolo novamente.
          </p>
          <Link
            to="/guided-protocol"
            className="text-sm font-medium text-blue-700 underline underline-offset-4"
          >
            Voltar para protocolos
          </Link>
        </div>
      );
    }

    return this.props.children;
  }
}
