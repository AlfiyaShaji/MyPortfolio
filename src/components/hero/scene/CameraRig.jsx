import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector3 } from 'three'
import { framing } from './config'

const target = new Vector3()
const offset = new Vector3()

/**
 * Applies the timeline's camera keys with responsive framing:
 * - a projection view offset moves the scene away from the HTML copy
 *   (right of the headline on desktop, above it on portrait screens)
 * - narrow aspect ratios pull the camera back so structures stay in frame
 * - a small pointer parallax on desktop makes the world feel present
 */
export function CameraRig({ journey, tier, parallax }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const sway = useRef({ x: 0, y: 0 })
  const frame = framing[tier] ?? framing.desktop

  useEffect(() => {
    camera.setViewOffset(size.width, size.height, frame.offsetX * size.width, frame.offsetY * size.height, size.width, size.height)
    camera.updateProjectionMatrix()
    return () => camera.clearViewOffset()
  }, [camera, size, frame])

  useFrame((state, delta) => {
    const j = journey
    const aspect = size.width / size.height
    const distance = frame.distance * (aspect < 1.25 ? Math.min(2.5, 1.3 / aspect) : aspect < 1.5 ? 1.5 / aspect : 1)

    if (parallax) {
      const k = 1 - Math.exp(-Math.min(delta, 0.1) * 2.5)
      sway.current.x += (state.pointer.x * 0.35 - sway.current.x) * k
      sway.current.y += (state.pointer.y * 0.2 - sway.current.y) * k
    }

    target.set(j.tgtX, j.tgtY, j.tgtZ)
    offset.set(j.camX - j.tgtX, j.camY - j.tgtY, j.camZ - j.tgtZ).multiplyScalar(distance)
    camera.position.copy(target).add(offset)
    camera.position.x += sway.current.x
    camera.position.y += sway.current.y
    camera.lookAt(target)
  })

  return null
}
