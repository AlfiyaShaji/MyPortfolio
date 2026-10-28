import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  ShaderMaterial,
  SRGBColorSpace,
} from 'three'
import { palette } from './config'

// Soft, additive glow points: used for the particle field, data pulses and
// neural-node halos. Size attenuates with distance and is capped per pixel.
export function createGlowPointsMaterial({ size = 1, drift = 0, opacity = 1 } = {}) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uSize: { value: size },
      uPixelRatio: { value: 1 },
      uTime: { value: 0 },
      uDrift: { value: drift },
      uOpacity: { value: opacity },
      uMix: { value: 0 },
      uMixColor: { value: new Color(palette.orchid) },
    },
    vertexShader: /* glsl */ `
      attribute float aScale;
      attribute vec3 aColor;
      uniform float uSize;
      uniform float uPixelRatio;
      uniform float uTime;
      uniform float uDrift;
      uniform float uMix;
      uniform vec3 uMixColor;
      varying vec3 vColor;
      varying float vFade;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.08 + position.y * 0.45) * uDrift;
        p.y += cos(uTime * 0.06 + position.x * 0.35) * uDrift;
        p.z += sin(uTime * 0.05 + position.x * 0.2) * uDrift;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float depth = -mv.z;
        gl_PointSize = min(uSize * aScale * uPixelRatio * (10.0 / max(depth, 0.1)), 40.0 * uPixelRatio);
        vColor = mix(aColor, uMixColor, uMix * step(0.5, fract(aScale * 7.31)));
        vFade = smoothstep(46.0, 12.0, depth) * smoothstep(0.6, 2.6, depth);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vFade;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a *= a;
        gl_FragColor = vec4(vColor, a * uOpacity * vFade);
      }
    `,
  })
}

// Dimensional interface panel: rounded body, glowing edge, faint grid and an
// optional browser chrome (top bar, window dots, address field).
export function createPanelMaterial({ colorHex, width, height, chromeHeight = 0 }) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    premultipliedAlpha: true,
    side: DoubleSide,
    uniforms: {
      uColor: { value: new Color(colorHex) },
      uBase: { value: new Color('#0b1030') },
      uSize: { value: [width, height] },
      uOpacity: { value: 0 },
      uFill: { value: 0.6 },
      uEdge: { value: 1 },
      uGrid: { value: 0 },
      uChrome: { value: 0 },
      uChromeH: { value: chromeHeight },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uBase;
      uniform vec2 uSize;
      uniform float uOpacity;
      uniform float uFill;
      uniform float uEdge;
      uniform float uGrid;
      uniform float uChrome;
      uniform float uChromeH;
      varying vec2 vUv;

      float box(vec2 p, vec2 b, float r) {
        vec2 q = abs(p) - b + r;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
      }

      void main() {
        vec2 p = (vUv - 0.5) * uSize;
        vec2 half_ = uSize * 0.5 - 0.06;
        float d = box(p, half_, 0.08);
        float px = fwidth(d) * 1.2;
        float inside = 1.0 - smoothstep(-px, px, d);
        float edge = 1.0 - smoothstep(0.0, px * 1.6, abs(d));
        float halo = (1.0 - inside) * exp(-max(d, 0.0) * 38.0);

        vec2 g = abs(fract(p * 3.0) - 0.5);
        float gw = fwidth(p.x * 3.0);
        float grid = (1.0 - smoothstep(0.0, gw * 1.5, 0.5 - max(g.x, g.y))) * inside * uGrid;

        vec3 rgb = uBase * inside * uFill;
        float alpha = inside * uFill;

        if (uChrome > 0.0) {
          float top = half_.y;
          float bar = step(top - uChromeH, p.y) * inside;
          float sep = (1.0 - smoothstep(0.0, px * 1.4, abs(p.y - (top - uChromeH)))) * inside;
          float cy = top - uChromeH * 0.5;
          float dots = 0.0;
          for (int i = 0; i < 3; i++) {
            float dx = -half_.x + 0.16 + float(i) * 0.12;
            dots += 1.0 - smoothstep(0.034, 0.034 + px, length(p - vec2(dx, cy)));
          }
          float url = 1.0 - smoothstep(-px, px, box(p - vec2(0.12, cy), vec2(0.9, 0.055), 0.055));
          float chrome = uChrome;
          rgb += uColor * (bar * 0.12 + sep * 0.5 + url * 0.18 + dots * 0.85) * chrome;
          alpha += (bar * 0.12 + sep * 0.5 + url * 0.18 + dots * 0.85) * chrome;
        }

        rgb += uColor * (edge * uEdge + halo * 0.35 * uEdge + grid * 0.16);
        alpha += edge * uEdge + halo * 0.35 * uEdge + grid * 0.16;
        alpha = clamp(alpha, 0.0, 1.0);
        gl_FragColor = vec4(rgb, alpha) * uOpacity;
      }
    `,
  })
}

let glowTexture
// Small procedural radial gradient shared by every glow sprite.
export function getGlowTexture() {
  if (glowTexture) return glowTexture
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  g.addColorStop(0.6, 'rgba(255,255,255,0.08)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  glowTexture = new CanvasTexture(canvas)
  glowTexture.colorSpace = SRGBColorSpace
  return glowTexture
}

const FONT_STACK = '"Sora", ui-sans-serif, system-ui, sans-serif'

// Renders a short label to a canvas texture at runtime, so the text itself
// stays in content/hero.js. Redraws once web fonts have loaded.
export function createTextTexture(text, { size = 64, weight = 600, color = '#e6e9f5', tracking = 0 } = {}) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace

  const baseDispose = texture.dispose.bind(texture)
  const draw = () => {
    const font = `${weight} ${size}px ${FONT_STACK}`
    ctx.font = font
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${tracking}px`
    const w = Math.ceil(ctx.measureText(text).width + size * 0.6)
    const h = Math.ceil(size * 1.5)
    // GPU textures are immutable in size: release the old one before resizing.
    if (texture.userData.aspect && canvas.width !== w) baseDispose()
    canvas.width = w
    canvas.height = h
    ctx.font = font
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${tracking}px`
    ctx.fillStyle = color
    ctx.textBaseline = 'middle'
    ctx.fillText(text, size * 0.3, h / 2)
    texture.userData.aspect = w / h
    texture.needsUpdate = true
  }
  draw()
  document.fonts?.ready.then(() => {
    if (!texture.userData.disposed) draw()
  })
  texture.dispose = () => {
    texture.userData.disposed = true
    baseDispose()
  }
  return texture
}
