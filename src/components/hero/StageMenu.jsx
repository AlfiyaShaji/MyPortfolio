import { useEffect, useId, useRef, useState } from 'react'
import { stages } from '../../content/hero'

/**
 * Compact navigation for the journey: shows the current stage and lets
 * keyboard, mouse and touch users jump straight to any stage, so the scroll
 * animation is never the only way to reach the hero's content.
 */
export function StageMenu({ stage, onJump }) {
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const button = useRef(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    const onPointer = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  const current = stages[stage]

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="group flex h-11 items-center gap-3 rounded-full border border-white/12 bg-ink/40 pl-4 pr-3 text-sm text-fg backdrop-blur-sm transition-colors hover:border-white/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-electric"
      >
        <span className="font-mono text-xs tracking-wider text-fg-muted">
          <span className="text-fg">{current.index}</span> / {String(stages.length).padStart(2, '0')}
        </span>
        <span className="hidden sm:inline">Journey</span>
        <span aria-hidden="true" className="flex w-4 flex-col gap-[5px]">
          <span className={`h-px bg-current transition-transform duration-300 ${open ? 'translate-y-[3px] rotate-45' : ''}`} />
          <span className={`h-px bg-current transition-transform duration-300 ${open ? '-translate-y-[3px] -rotate-45' : ''}`} />
        </span>
        <span className="sr-only">{open ? 'Close journey menu' : 'Open journey menu'}</span>
      </button>

      <nav
        id={listId}
        aria-label="Career journey"
        hidden={!open}
        className="absolute right-0 top-[calc(100%+0.6rem)] w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-ink-2/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-md"
      >
        <ol>
          {stages.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                aria-current={i === stage ? 'step' : undefined}
                onClick={() => {
                  setOpen(false)
                  onJump(i)
                }}
                className="flex min-h-12 w-full items-center gap-4 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-electric aria-[current=step]:bg-white/[0.06]"
              >
                <span className={`font-mono text-xs ${i === stage ? 'text-electric' : 'text-fg-faint'}`}>{s.index}</span>
                <span className={i === stage ? 'text-fg' : 'text-fg-muted'}>{s.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
