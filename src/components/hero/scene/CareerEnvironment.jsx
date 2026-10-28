import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AIStage } from './AIStage'
import { CameraRig } from './CameraRig'
import { CodeStage } from './CodeStage'
import { FullStackStage } from './FullStackStage'
import { buildBarLayouts } from './layouts'
import { ParticleField } from './ParticleField'
import { WebDevelopmentStage } from './WebDevelopmentStage'

/**
 * One world, one coordinate system. The stack group (code -> browser ->
 * full-stack layers) yaws and tilts with the timeline; the neural network
 * shares the yaw so its links stay attached to the frontend layer.
 */
export function CareerEnvironment({ journey, tier, budget, projectName }) {
  const yawGroup = useRef()
  const tiltGroup = useRef()
  const layout = useMemo(() => buildBarLayouts(budget.bars), [budget.bars])

  useFrame(() => {
    yawGroup.current.rotation.y = journey.yaw
    tiltGroup.current.rotation.x = journey.tilt
  })

  return (
    <>
      <CameraRig journey={journey} tier={tier} parallax={budget.parallax} />
      <ParticleField journey={journey} count={budget.particles} />
      <group ref={yawGroup}>
        <group ref={tiltGroup}>
          <WebDevelopmentStage journey={journey} showDevices={budget.devices} />
          <FullStackStage journey={journey} pulseCount={Math.round(budget.pulses * 0.5)} showLabels={budget.labels} projectName={projectName} />
          <CodeStage journey={journey} layout={layout} />
        </group>
        <AIStage journey={journey} rings={budget.rings} pulseCount={budget.pulses} />
      </group>
    </>
  )
}
