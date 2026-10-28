import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { stages } from '../../content/hero'
import { HeroFallbackArt, JourneyList } from './HeroFallback'
import { HeroOverlay } from './HeroOverlay'
import { createJourneyState, SCROLL_PER_UNIT, stageAnchor, TIMELINE_LENGTH } from './journey'
import { scrollPositionFor, useHeroTimeline } from './useHeroTimeline'
import { useHeroEnvironment } from './useHeroEnvironment'

const HeroScene = lazy(() => import('./scene/HeroScene'))

class SceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    this.props.onError(error)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function SceneLoader({ visible }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute top-[24%] left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 transition-opacity duration-700 lg:top-1/2 lg:left-[67%] ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <span className="relative h-px w-24 overflow-hidden bg-white/10">
        <span className="hero-loading-bar absolute inset-y-0 left-0 w-1/3 bg-electric/70" />
      </span>
      <span className="font-mono text-[0.65rem] tracking-[0.25em] text-fg-faint uppercase">Rendering scene</span>
    </div>
  )
}

/**
 * The hero: a tall scroll range with a sticky full-viewport stage.
 * - journey mode: WebGL scene + master ScrollTrigger timeline
 * - static mode (reduced motion, no WebGL, or scene failure): static art and
 *   the full journey as readable content, no scroll-jacking
 */
export function HeroSection() {
  const env = useHeroEnvironment()
  const [sceneFailed, setSceneFailed] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)
  const [stage, setStage] = useState(0)
  const [visible, setVisible] = useState(true)
  const [loadScene, setLoadScene] = useState(false)
  const sectionRef = useRef(null)
  const journey = useMemo(createJourneyState, [])

  const mode = !env.reducedMotion && env.webgl && !sceneFailed ? 'journey' : 'static'
  const animated = mode === 'journey'

  const trigger = useHeroTimeline({
    sectionRef,
    journey,
    enabled: animated,
    scrub: env.tier === 'mobile' ? 0.5 : 0.85,
    onStageChange: setStage,
  })

  // Start downloading three.js only once the page has loaded and the main
  // thread is idle, so the HTML hero is interactive first.
  useEffect(() => {
    if (!animated || loadScene) return undefined
    let idle = 0
    const start = () => {
      idle = window.requestIdleCallback
        ? window.requestIdleCallback(() => setLoadScene(true), { timeout: 1500 })
        : window.setTimeout(() => setLoadScene(true), 300)
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })
    return () => {
      window.removeEventListener('load', start)
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle)
      window.clearTimeout(idle)
    }
  }, [animated, loadScene])

  // Stop rendering WebGL while the hero is off-screen.
  useEffect(() => {
    if (!animated) return undefined
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '10% 0px' })
    io.observe(sectionRef.current)
    return () => io.disconnect()
  }, [animated])

  const onSceneError = useCallback((error) => {
    console.warn('[hero] 3D scene unavailable, using static hero.', error)
    setSceneFailed(true)
  }, [])
  const onSceneReady = useCallback(() => setSceneReady(true), [])

  const scrollToProgress = useCallback(
    (progress) => {
      const top = scrollPositionFor(trigger.current, progress)
      if (top != null) window.scrollTo({ top, behavior: 'smooth' })
    },
    [trigger],
  )

  const scrollToElement = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: env.reducedMotion ? 'auto' : 'smooth', block: 'start' })
  }

  const onExplore = () => (animated ? scrollToProgress(stageAnchor(0)) : scrollToElement('journey'))
  // Scrolls to the end of the hero, where the projects section will follow.
  const onViewWork = () => (animated ? scrollToProgress(1) : scrollToElement('work'))
  const onJump = (i) => (animated ? scrollToProgress(i === 0 ? 0 : stageAnchor(i)) : scrollToElement(`stage-${stages[i].id}`))

  const scrollLength = TIMELINE_LENGTH * (SCROLL_PER_UNIT[env.tier] ?? SCROLL_PER_UNIT.desktop) * 100

  return (
    <section
      id="top"
      ref={sectionRef}
      aria-label="Introduction"
      className={animated ? 'hero-journey relative' : 'relative'}
      style={animated ? { '--hero-scroll': scrollLength.toFixed(1) } : undefined}
    >
      <div className={`hero-stage relative h-svh min-h-[34rem] overflow-hidden ${animated ? 'sticky top-0' : ''}`}>
        <div aria-hidden="true" className="hero-backdrop absolute inset-0" />
        <div aria-hidden="true" data-hero-wash="blue" className="hero-wash-blue absolute inset-0" />
        <div aria-hidden="true" data-hero-wash="violet" className="hero-wash-violet absolute inset-0 opacity-25" />

        {animated ? (
          <>
            <div className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${sceneReady ? 'opacity-100' : 'opacity-0'}`}>
              <SceneBoundary onError={onSceneError}>
                {loadScene && (
                  <Suspense fallback={null}>
                    <HeroScene
                      journey={journey}
                      tier={env.tier}
                      lowPower={env.lowPower}
                      active={visible}
                      onReady={onSceneReady}
                      onError={onSceneError}
                    />
                  </Suspense>
                )}
              </SceneBoundary>
            </div>
            <SceneLoader visible={!sceneReady} />
          </>
        ) : (
          <HeroFallbackArt />
        )}

        <div aria-hidden="true" className="hero-vignette pointer-events-none absolute inset-0" />
        <div aria-hidden="true" className="hero-scrim pointer-events-none absolute inset-0" />

        <HeroOverlay animated={animated} stage={stage} onExplore={onExplore} onViewWork={onViewWork} onJump={onJump} />
      </div>

      {!animated && <JourneyList />}
      {/* End of the hero: the future projects section will start here. */}
      <div id="work" aria-hidden="true" className="h-px" />
    </section>
  )
}
