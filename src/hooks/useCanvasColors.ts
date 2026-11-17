import { useEffect, useState } from 'react'

const NAMES = [
  'bg', 'panel', 'panel-2', 'line', 'ink', 'muted',
  'accent', 'accent-2', 'grid', 'wall', 'label',
  'strong', 'fair', 'weak', 'heat-blend',
]

function read(): Record<string, string> {
  const s = getComputedStyle(document.documentElement)
  return Object.fromEntries(NAMES.map(n => [n, s.getPropertyValue(`--${n}`).trim()]))
}

export function useCanvasColors() {
  const [colors, setColors] = useState(read)

  useEffect(() => {
    const obs = new MutationObserver(() => setColors(read()))
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => obs.disconnect()
  }, [])

  return colors
}