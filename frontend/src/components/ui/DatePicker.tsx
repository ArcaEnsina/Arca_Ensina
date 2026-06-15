import { useState } from 'react'
import { createPortal } from 'react-dom'
import { format, parse, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  id?: string
  'aria-invalid'?: boolean
}
export default function DatePicker({ value, onChange, id, 'aria-invalid': ariaInvalid }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(
    value ? format(new Date(value + 'T00:00:00'), 'dd/MM/yyyy') : ''
  )

  let selected: Date | undefined
  if (value) {
    selected = new Date(value + 'T00:00:00')
  } else {
    selected = undefined
  }

  function handleInputChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    let formatted = digits
    if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2)
    if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
    setInputValue(formatted)

    if (digits.length === 8) {
      const parsed = parse(formatted, 'dd/MM/yyyy', new Date())
      if (isValid(parsed)) {
        onChange(format(parsed, 'yyyy-MM-dd'))
      }
    }
  }

  function handleDaySelect(day: Date | undefined) {
    if (!day) return
    onChange(format(day, 'yyyy-MM-dd'))
    setInputValue(format(day, 'dd/MM/yyyy'))
    setOpen(false)
  }

  return (
    <div className="relative">
      <Input
        id={id}
        value={inputValue}
        placeholder="DD/MM/AAAA"
        inputMode="numeric"
        aria-invalid={ariaInvalid}
        onChange={(e) => handleInputChange(e.target.value)}
        className="pr-10"
      />
      <button
        type="button"
        aria-label="Abrir calendário"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(true)}
      >
        <CalendarIcon className="size-4" />
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          role="presentation"
        >
          <section
            className="bg-background border border-border rounded-xl shadow-lg p-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Calendar
              mode="single"
              selected={selected}
              onSelect={handleDaySelect}
              defaultMonth={selected}
              locale={ptBR}
              captionLayout="dropdown"
              startMonth={new Date(1900, 0)}
              endMonth={new Date()}
            />
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => handleDaySelect(new Date())}
              >
                Hoje
              </Button>
            </div>
          </section>
        </div>,
        document.body
      )}
    </div>
  )
}
