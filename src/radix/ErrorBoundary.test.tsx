import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RadixErrorBoundary, RouteErrorComponent } from './ErrorBoundary'
import { ErrorFallback } from './ErrorFallback'

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('RadixErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })
  afterEach(() => {
    console.error = originalError
  })

  it('renders children when there is no error', () => {
    render(
      <RadixErrorBoundary>
        <div>Test content</div>
      </RadixErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders error fallback when error is thrown', () => {
    render(
      <RadixErrorBoundary>
        <ThrowError shouldThrow />
      </RadixErrorBoundary>
    )

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
  })

  it('calls onError callback when error is caught', () => {
    const onError = vi.fn()

    render(
      <RadixErrorBoundary onError={onError}>
        <ThrowError shouldThrow />
      </RadixErrorBoundary>
    )

    expect(onError).toHaveBeenCalled()
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error)
    expect(onError.mock.calls[0]?.[0]?.message).toBe('Test error')
  })

  it('calls captureException when error is caught', () => {
    const captureException = vi.fn()

    render(
      <RadixErrorBoundary captureException={captureException}>
        <ThrowError shouldThrow />
      </RadixErrorBoundary>
    )

    expect(captureException).toHaveBeenCalled()
    expect(captureException.mock.calls[0]?.[0]).toBeInstanceOf(Error)
  })

  it('renders custom fallback when provided', () => {
    render(
      <RadixErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError shouldThrow />
      </RadixErrorBoundary>
    )

    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
  })

  it('passes fallbackProps to ErrorFallback', () => {
    render(
      <RadixErrorBoundary
        fallbackProps={{
          title: 'Custom Title',
          message: 'Custom message',
        }}
      >
        <ThrowError shouldThrow />
      </RadixErrorBoundary>
    )

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom message')).toBeInTheDocument()
  })

  it('retry button resets error state', () => {
    const { rerender } = render(
      <RadixErrorBoundary>
        <ThrowError shouldThrow />
      </RadixErrorBoundary>
    )

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()

    // Click retry
    fireEvent.click(screen.getByText('Tentar novamente'))

    // Re-render with no error
    rerender(
      <RadixErrorBoundary>
        <ThrowError shouldThrow={false} />
      </RadixErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })
})

describe('ErrorFallback', () => {
  it('renders with default text', () => {
    render(<ErrorFallback />)

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
  })

  it('renders with custom title and message', () => {
    render(
      <ErrorFallback
        title="Custom Title"
        message="Custom error message"
      />
    )

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom error message')).toBeInTheDocument()
  })

  it('shows retry button when onRetry is provided', () => {
    const onRetry = vi.fn()
    render(<ErrorFallback onRetry={onRetry} />)

    const button = screen.getByText('Tentar novamente')
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(onRetry).toHaveBeenCalled()
  })

  it('hides retry button when onRetry is not provided', () => {
    render(<ErrorFallback />)

    expect(screen.queryByText('Tentar novamente')).not.toBeInTheDocument()
  })

  it('shows error details when showDetails is true', () => {
    const error = new Error('Test error message')
    render(<ErrorFallback error={error} showDetails />)

    expect(screen.getByText('Detalhes do erro (desenvolvimento)')).toBeInTheDocument()
  })

  it('hides error details when showDetails is false', () => {
    const error = new Error('Test error message')
    render(<ErrorFallback error={error} showDetails={false} />)

    expect(screen.queryByText('Detalhes do erro (desenvolvimento)')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ErrorFallback className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('has accessible role and aria-live', () => {
    render(<ErrorFallback />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'assertive')
  })
})

describe('RouteErrorComponent', () => {
  it('renders error fallback with reload button', () => {
    const error = new Error('Route error')
    render(<RouteErrorComponent error={error} />)

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument()
  })
})
