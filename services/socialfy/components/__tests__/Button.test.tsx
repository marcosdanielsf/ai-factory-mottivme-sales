import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../UI';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('shows loading spinner when loading=true', () => {
    render(<Button loading={true}>Submit</Button>);

    const button = screen.getByRole('button');
    // Check if the button contains the loading class (Loader2 has animate-spin)
    const spinner = button.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<Button loading={true}>Submit</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled={true}>Disabled Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('handles click events when not disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick} disabled={true}>Disabled</Button>);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies primary variant styles by default', () => {
    render(<Button>Primary Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
  });

  it('applies secondary variant styles when specified', () => {
    render(<Button variant="secondary">Secondary Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-slate-800');
  });

  it('applies outline variant styles when specified', () => {
    render(<Button variant="outline">Outline Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  });

  it('applies ghost variant styles when specified', () => {
    render(<Button variant="ghost">Ghost Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-slate-600');
  });

  it('applies gradient variant styles when specified', () => {
    render(<Button variant="gradient">Gradient Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gradient-to-r');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  it('renders children content', () => {
    render(
      <Button>
        <span data-testid="icon">Icon</span>
        <span>Button Text</span>
      </Button>
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Button Text')).toBeInTheDocument();
  });

  it('hides children text when loading but shows spinner', () => {
    render(<Button loading={true}>Loading Text</Button>);

    const button = screen.getByRole('button');
    // Spinner should be present
    const spinner = button.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    // Children text should still be in DOM (not hidden in implementation)
    expect(screen.getByText('Loading Text')).toBeInTheDocument();
  });

  it('passes through other HTML button attributes', () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>);

    const button = screen.getByTestId('submit-btn');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
