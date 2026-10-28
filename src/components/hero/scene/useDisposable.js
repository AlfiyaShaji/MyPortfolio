import { useEffect, useMemo } from 'react'

// useMemo for Three.js resources we create by hand (geometries, materials,
// textures). Everything in the returned object (or in arrays inside it) that
// has dispose() is released on unmount or when deps change.
export function useDisposable(factory, deps) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resources = useMemo(factory, deps)
  useEffect(
    () => () => {
      for (const r of Object.values(resources).flat()) {
        if (r && typeof r.dispose === 'function') r.dispose()
      }
    },
    [resources],
  )
  return resources
}
