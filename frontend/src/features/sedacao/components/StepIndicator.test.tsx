import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StepIndicator } from './StepIndicator';

describe('StepIndicator', () => {
  it('renders all four phases', () => {
    render(<StepIndicator currentPhase="select" />);

    expect(screen.getByText('Seleção')).toBeInTheDocument();
    expect(screen.getByText('Cálculo')).toBeInTheDocument();
    expect(screen.getByText('Desmame')).toBeInTheDocument();
    expect(screen.getByText('Revisão')).toBeInTheDocument();
  });

  it('sets aria-current="step" on the active phase', () => {
    const { rerender } = render(<StepIndicator currentPhase="convert" />);

    const phases = ['Seleção', 'Cálculo', 'Desmame', 'Revisão'];
    for (const label of phases) {
      const li = screen.getByText(label).closest('li');
      if (label === 'Cálculo') {
        expect(li).toHaveAttribute('aria-current', 'step');
      } else {
        expect(li).not.toHaveAttribute('aria-current');
      }
    }

    rerender(<StepIndicator currentPhase="review" />);
    const reviewLi = screen.getByText('Revisão').closest('li');
    expect(reviewLi).toHaveAttribute('aria-current', 'step');
  });

  it('shows checkmark for completed steps', () => {
    render(<StepIndicator currentPhase="taper" />);

    const svgs = document.querySelectorAll('svg.lucide-check');
    // 2 phases completed: select (0) and convert (1) before taper (2)
    expect(svgs.length).toBe(2);
  });

  it('shows step numbers for incomplete future steps', () => {
    render(<StepIndicator currentPhase="select" />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('has accessible nav label', () => {
    render(<StepIndicator currentPhase="select" />);

    const nav = screen.getByLabelText('Progresso do painel de sedação');
    expect(nav).toBeInTheDocument();
  });
});
