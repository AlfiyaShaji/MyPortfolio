import { hero, identity, stages } from '../../content/hero'
import { StageMenu } from './StageMenu'

function Headline() {
  const lines = hero.headline
  return (
    <h1 className="text-[2.3rem] leading-[1.02] font-semibold tracking-[-0.035em] text-fg sm:text-[3rem] md:text-[3.5rem] lg:text-[4.4rem] xl:text-[5.35rem] 2xl:text-[6.1rem]">
      {lines.map((line, i) => {
        const accent = hero.headlineAccent
        const isLast = i === lines.length - 1
        if (isLast && accent && line.endsWith(accent)) {
          return (
            <span key={i} data-hero-line className="block">
              {line.slice(0, -accent.length).trim()}{' '}
              <span className="hero-accent block pb-[0.08em]">{accent}</span>
            </span>
          )
        }
        return (
          <span key={i} data-hero-line className="block">
            {line}
          </span>
        )
      })}
    </h1>
  )
}

function Caption({ stage }) {
  return (
    <div data-hero-caption className="invisible opacity-0 [grid-area:1/1]">
      <p className="font-mono text-[0.7rem] tracking-[0.22em] text-electric uppercase">
        {stage.index} — {stage.label}
      </p>
      {stage.roles ? (
        <p className="mt-2.5 text-xl leading-tight font-semibold tracking-[-0.02em] text-fg sm:text-2xl lg:text-[1.75rem]">
          {stage.roles[0]} <span className="text-violet">·</span> {stage.roles[1]}
        </p>
      ) : (
        <p className="mt-2.5 text-lg leading-snug font-medium tracking-[-0.01em] text-fg lg:text-xl">{stage.title}</p>
      )}
      <p className={`mt-1.5 max-w-[30rem] text-sm leading-relaxed text-fg-muted lg:text-[0.95rem] ${stage.project ? "max-sm:sr-only" : ""}`}>{stage.body}</p>
      {stage.project && (
        <p className="mt-3 max-w-[30rem] border-l border-electric/50 pl-3 text-sm leading-relaxed text-fg-muted">
          <span className="font-semibold text-fg">{stage.project.name}</span> — {stage.project.summary}
        </p>
      )}
    </div>
  )
}

function ArrowDown() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 2.5v11M3.5 9 8 13.5 12.5 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * All hero copy and controls, in accessible HTML above the canvas.
 * `animated` adds the stage captions and progress UI driven by the timeline.
 */
export function HeroOverlay({ animated, stage, onExplore, onViewWork, onJump }) {
  const current = stages[stage]
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col">
      <header className="pointer-events-auto flex items-center justify-between px-4 pt-4 sm:px-8 sm:pt-6 lg:px-12 lg:pt-8">
        <a
          href="#top"
          className="flex items-center gap-3 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-electric"
        >
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-full border border-white/15 font-mono text-[0.7rem] tracking-wider text-fg">
            {identity.monogram}
          </span>
          <span className="text-sm font-medium tracking-[-0.01em] text-fg">{identity.name}</span>
        </a>
        <StageMenu stage={stage} onJump={onJump} />
      </header>

      <div className="flex flex-1 flex-col justify-end px-4 pb-6 sm:px-8 lg:justify-center lg:px-12 lg:pb-0">
        <div className="pointer-events-auto max-w-[44rem] lg:max-w-[min(46rem,52vw)]">
          <p className="mb-3 flex items-center gap-2.5 text-[0.68rem] sm:mb-4 font-medium tracking-[0.2em] text-fg-muted uppercase sm:text-xs lg:mb-6">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-electric shadow-[0_0_10px_2px_rgb(76_201_255/0.6)]" />
            {hero.role}
          </p>
          <Headline />

          <div className="mt-4 grid sm:mt-5 lg:mt-7">
            <p data-hero-intro className="max-w-[30rem] text-[0.95rem] leading-relaxed text-fg-muted [grid-area:1/1] lg:text-base">
              {hero.description}
            </p>
            {animated && stages.map((s) => <Caption key={s.id} stage={s} />)}
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5 sm:gap-3 lg:mt-8">
            <button
              type="button"
              onClick={onExplore}
              className="inline-flex h-12 items-center gap-2.5 rounded-full bg-fg px-5 text-sm sm:px-6 font-semibold text-ink transition-[background-color,transform] duration-200 hover:bg-white active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-electric"
            >
              {hero.primaryCta}
              <ArrowDown />
            </button>
            <button
              type="button"
              onClick={onViewWork}
              className="inline-flex h-12 items-center rounded-full border border-white/20 px-5 text-sm sm:px-6 font-medium text-fg transition-[border-color,background-color,transform] duration-200 hover:border-white/45 hover:bg-white/[0.05] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-electric"
            >
              {hero.secondaryCta}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 px-4 pb-4 sm:px-8 sm:pb-6 lg:px-12 lg:pb-8">
        <div data-hero-hint className="hidden items-center gap-3 text-xs text-fg-faint sm:flex" aria-hidden="true">
          <span className="relative h-8 w-px overflow-hidden bg-white/15">
            <span className="hero-scroll-dot absolute inset-x-0 top-0 h-3 bg-electric" />
          </span>
          {hero.scrollHint}
        </div>
        {animated && (
          <div className="ml-auto flex items-center gap-4" aria-hidden="true">
            <p className="text-right text-xs text-fg-muted">
              <span className="font-mono text-fg">{current.index}</span>
              <span className="font-mono"> / {String(stages.length).padStart(2, '0')}</span>
              <span className="ml-3 hidden sm:inline">{current.label}</span>
            </p>
            <span className="relative h-px w-20 overflow-hidden bg-white/15 sm:w-28">
              <span data-hero-progress className="absolute inset-0 origin-left scale-x-0 bg-linear-to-r from-electric to-violet" />
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
