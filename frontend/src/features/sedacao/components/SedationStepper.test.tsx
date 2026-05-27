import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SedationStepper } from './SedationStepper';

describe('SedationStepper', () => {
  it('renders all four phases', () => {
    render(<SedationStepper currentPhase="select" />);

    expect(screen.getByText('Seleção')).toBeInTheDocument();
    expect(screen.getByText('Conversão')).toBeInTheDocument();
    expect(screen.getByText('Desmame')).toBeInTheDocument();
    expect(screen.getByText('Revisão')).toBeInTheDocument();
  });

  it('sets aria-current="step" on the active phase', () => {
    const { rerender } = render(<SedationStepper currentPhase="convert" />);

    const phases = ['Seleção', 'Conversão', 'Desmame', 'Revisão'];
    for (const label of phases) {
      const li = screen.getByText(label).closest('li');
      if (label === 'Conversão') {
        expect(li).toHaveAttribute('aria-current', 'step');
      } else {
        expect(li).not.toHaveAttribute('aria-current');
      }
    }

    rerender(<SedationStepper currentPhase="review" />);
    const reviewLi = screen.getByText('Revisão').closest('li');
    expect(reviewLi).toHaveAttribute('aria-current', 'step');
  });

  it('shows checkmark for completed steps', () => {
    render(<SedationStepper currentPhase="taper" />);

    // Check icons are rendered as SVG with aria-hidden
    const svgs = document.querySelectorAll('svg.lucide-check');
    // 2 phases completed: select (0) and convert (1) before taper (2)
    expect(svgs.length).toBe(2);
  });

  it('shows step numbers for incomplete future steps', () => {
    render(<SedationStepper currentPhase="select" />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('has accessible nav label', () => {
    render(<SedationStepper currentPhase="select" />);

    const nav = screen.getByLabelText('Progresso do painel de sedação');
    expect(nav).toBeInTheDocument();
  });
});
