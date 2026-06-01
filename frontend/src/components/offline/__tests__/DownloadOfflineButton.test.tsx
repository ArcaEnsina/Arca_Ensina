import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DownloadOfflineButton } from '../DownloadOfflineButton'

describe('DownloadOfflineButton', () => {
  it('shows download icon in idle state', () => {
    render(<DownloadOfflineButton onDownload={() => Promise.resolve()} />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-label', 'Baixar para uso offline')
  })

  it('shows check icon when initialCached is true', () => {
    render(<DownloadOfflineButton onDownload={() => Promise.resolve()} initialCached={true} />)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('aria-label', 'Salvo no aparelho')
  })

  it('calls onDownload when clicked', async () => {
    const onDownload = vi.fn(() => Promise.resolve())
    render(<DownloadOfflineButton onDownload={onDownload} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onDownload).toHaveBeenCalled()
  })
})
