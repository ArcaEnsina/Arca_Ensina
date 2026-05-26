import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OfflineIndicator } from '../OfflineIndicator'

describe('OfflineIndicator', () => {
  it('renders nothing when online', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: true, writable: true, configurable: true })
    const { container } = render(<OfflineIndicator />)
    expect(container.firstChild).toBeNull()
  })

  it('renders banner when offline', () => {
    Object.defineProperty(window.navigator, 'onLine', { value: false, writable: true, configurable: true })
    render(<OfflineIndicator />)
    expect(screen.getByRole('status')).toHaveTextContent(/offline/i)
  })
})
