const FORBIDDEN_EN = [
  'delve', 'harness', 'tapestry', 'leverage', 'unleash', 'foster', 'landscape',
  'cutting-edge', 'game-changer', 'synergy', 'deep dive', 'robust', 'seamless',
  'holistic', 'paradigm', 'innovative', 'revolutionary', 'transformative',
  'empower', 'elevate', 'unlock', 'streamline', 'optimize', 'pivotal',
  'cornerstone', 'spearhead', 'unpack', 'unravel', 'nuance', 'multifaceted',
  'intricate', 'realm', 'navigate', 'embark', 'journey', 'beacon', 'pinnacle',
  'commendable', 'noteworthy', 'testament', 'underscore', 'arguably',
  'essentially', 'furthermore', 'moreover', 'in essence', "it's worth noting",
  'interestingly enough',
]

const FORBIDDEN_DE = [
  'meistern', 'entfesseln', 'synergie', 'nahtlos', 'ganzheitlich', 'maßgeblich',
  'wegweisend', 'richtungsweisend', 'bahnbrechend', 'revolutionär', 'paradigmenwechsel',
  'leuchtturmprojekt', 'auf den punkt gebracht', 'im grunde genommen',
  'es sei erwähnt', 'nicht zuletzt', 'darüber hinaus sei gesagt', 'zweifellos',
  'in der heutigen schnelllebigen welt',
]

const ALL_FORBIDDEN = [...FORBIDDEN_EN, ...FORBIDDEN_DE]

export function checkBrandVoice(text: string): { violations: string[]; clean: boolean } {
  const lower = text.toLowerCase()
  const violations = ALL_FORBIDDEN.filter(w => lower.includes(w.toLowerCase()))
  return { violations, clean: violations.length === 0 }
}

export function buildBrandVoiceConstraint(): string {
  return `Verbotene englische Wörter (NIEMALS verwenden): ${FORBIDDEN_EN.join(', ')}

Verbotene deutsche Wörter (NIEMALS verwenden): ${FORBIDDEN_DE.join(', ')}

Stilregeln: Locker, direkt, kurze Sätze. Kein Hype. Deutsch als Primärsprache. Du-Ansprache.`
}
