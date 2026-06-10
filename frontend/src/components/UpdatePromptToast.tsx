import { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'

export function UpdatePromptToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const shownRef = useRef(false)

  useEffect(() => {
    if (needRefresh && !shownRef.current) {
      shownRef.current = true

      toast('Nova versão disponível', {
        duration: Infinity,
        action: {
          label: 'Atualizar',
          onClick: () => updateServiceWorker(true),
        },
        cancel: {
          label: 'Depois',
          onClick: () => setNeedRefresh(false),
        },
      })
    }
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  return null
}
