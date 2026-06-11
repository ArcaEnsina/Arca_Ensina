import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { toast } from 'sonner'
import { UpdatePromptToast } from './UpdatePromptToast'

const mockUpdateServiceWorker = vi.fn()
const mockSetNeedRefresh = vi.fn()
let needRefreshValue = false

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [needRefreshValue, mockSetNeedRefresh],
    updateServiceWorker: mockUpdateServiceWorker,
  }),
}))

vi.mock('sonner', () => ({
  toast: vi.fn(),
}))

describe('UpdatePromptToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    needRefreshValue = false
  })

  it('renders nothing', () => {
    const { container } = render(<UpdatePromptToast />)
    expect(container.firstChild).toBeNull()
  })

  it('shows toast when needRefresh is true', () => {
    needRefreshValue = true
    render(<UpdatePromptToast />)
    expect(toast).toHaveBeenCalledWith('Nova versão disponível', expect.objectContaining({
      duration: Infinity,
      action: expect.objectContaining({ label: 'Atualizar' }),
      cancel: expect.objectContaining({ label: 'Depois' }),
    }))
  })

  it('does not show toast when needRefresh is false', () => {
    needRefreshValue = false
    render(<UpdatePromptToast />)
    expect(toast).not.toHaveBeenCalled()
  })

  it('calls updateServiceWorker(true) when Atualizar is clicked', () => {
    needRefreshValue = true
    render(<UpdatePromptToast />)
    const action = (toast as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].action
    action.onClick()
    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('calls setNeedRefresh(false) when Depois is clicked', () => {
    needRefreshValue = true
    render(<UpdatePromptToast />)
    const cancel = (toast as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].cancel
    cancel.onClick()
    expect(mockSetNeedRefresh).toHaveBeenCalledWith(false)
  })

  it('only shows toast once even if re-rendered with needRefresh true', () => {
    needRefreshValue = true
    const { rerender } = render(<UpdatePromptToast />)
    rerender(<UpdatePromptToast />)
    expect(toast).toHaveBeenCalledTimes(1)
  })
})
