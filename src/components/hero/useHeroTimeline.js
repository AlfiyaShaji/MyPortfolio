import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef } from 'react'
import {
  cameraKeys,
  captionWindows,
  introOut,
  sceneSegments,
  stageFromTime,
  TIMELINE_LENGTH,
} from './journey'

gsap.registerPlugin(ScrollTrigger)
// Mobile address-bar show/hide should not re-measure the whole page.
ScrollTrigger.config({ ignoreMobileResize: true })

/**
 * Builds the single master timeline for the hero and binds it to scroll.
 *
 * It tweens:
 *  - the shared `journey` object read by the WebGL scene each frame
 *  - overlay copy (intro text, stage captions, scroll hint, backdrop washes)
 * and reports progress / stage changes without per-frame React renders.
 *
 * Everything lives inside a gsap.context scoped to the section and is reverted
 * on cleanup, so re-renders and StrictMode never duplicate triggers.
 */
export function useHeroTimeline({ sectionRef, journey, enabled, scrub, onStageChange }) {
  const triggerRef = useRef(null)
  const stageCallback = useRef(onStageChange)
  stageCallback.current = onStageChange

  useLayoutEffect(() => {
    if (!enabled || !sectionRef.current) return undefined
    const section = sectionRef.current
    let currentStage = -1

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section)
      const progressBar = q('[data-hero-progress]')[0]
      const setProgress = progressBar ? gsap.quickSetter(progressBar, 'scaleX') : () => {}

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub,
          onUpdate(self) {
            setProgress(self.progress)
            const stage = stageFromTime(self.progress * TIMELINE_LENGTH)
            if (stage !== currentStage) {
              currentStage = stage
              stageCallback.current?.(stage)
            }
          },
        },
      })

      // Camera path
      for (let i = 1; i < cameraKeys.length; i++) {
        const k = cameraKeys[i]
        const prev = cameraKeys[i - 1]
        tl.to(
          journey,
          {
            camX: k.pos[0], camY: k.pos[1], camZ: k.pos[2],
            tgtX: k.target[0], tgtY: k.target[1], tgtZ: k.target[2],
            duration: k.at - prev.at,
            ease: 'sine.inOut',
          },
          prev.at,
        )
      }

      // Scene parameters
      for (const [param, value, start, end, ease = 'none'] of sceneSegments) {
        tl.to(journey, { [param]: value, duration: end - start, ease }, start)
      }

      // Overlay copy
      tl.to(q('[data-hero-hint]'), { autoAlpha: 0, duration: 0.2 }, 0)
      tl.to(q('[data-hero-intro]'), { autoAlpha: 0, y: -14, duration: introOut[1] - introOut[0] }, introOut[0])
      q('[data-hero-caption]').forEach((el, i) => {
        const w = captionWindows[i]
        if (!w) return
        tl.fromTo(el, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: w.in[1] - w.in[0], ease: 'power2.out' }, w.in[0])
        if (w.out) tl.to(el, { autoAlpha: 0, y: -18, duration: w.out[1] - w.out[0], ease: 'power1.in' }, w.out[0])
      })

      // Backdrop washes: navy -> blue-violet -> purple
      tl.fromTo(q('[data-hero-wash="violet"]'), { opacity: 0.25 }, { opacity: 1, duration: 3, ease: 'sine.inOut' }, 1)
      tl.fromTo(q('[data-hero-wash="blue"]'), { opacity: 0.55, xPercent: 0 }, { opacity: 0.9, xPercent: -12, duration: 2, ease: 'sine.inOut' }, 0.5)

      // Pad to the full length so the end hold is part of the scroll range.
      tl.set({}, {}, TIMELINE_LENGTH)
      triggerRef.current = tl.scrollTrigger
    }, section)

    return () => {
      triggerRef.current = null
      ctx.revert()
    }
  }, [enabled, scrub, journey, sectionRef])

  return triggerRef
}

/** Scroll position (px) for a 0..1 progress through the hero's scroll range. */
export function scrollPositionFor(trigger, progress) {
  if (!trigger) return null
  return trigger.start + (trigger.end - trigger.start) * progress
}
