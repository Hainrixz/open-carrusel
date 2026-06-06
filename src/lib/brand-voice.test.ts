import { describe, it, expect } from 'vitest'
import { checkBrandVoice, buildBrandVoiceConstraint } from './brand-voice'

describe('checkBrandVoice', () => {
  it('passes clean German gaming text', () => {
    const result = checkBrandVoice('Dein Reservoir ist zu klein für die Trockenzeit.')
    expect(result.clean).toBe(true)
    expect(result.violations).toHaveLength(0)
  })

  it('catches forbidden English word', () => {
    const result = checkBrandVoice('This will leverage your strategy.')
    expect(result.clean).toBe(false)
    expect(result.violations).toContain('leverage')
  })

  it('catches forbidden German word', () => {
    const result = checkBrandVoice('Damit kannst du deine Basis meistern.')
    expect(result.clean).toBe(false)
    expect(result.violations).toContain('meistern')
  })

  it('is case-insensitive', () => {
    const result = checkBrandVoice('LEVERAGE your skills and HARNESS the power')
    expect(result.violations).toContain('leverage')
    expect(result.violations).toContain('harness')
  })

  it('detects multi-word phrases', () => {
    const result = checkBrandVoice('This is a deep dive into the topic.')
    expect(result.violations).toContain('deep dive')
  })

  it('returns all violations in one call', () => {
    const result = checkBrandVoice('leverage the synergy to meistern this.')
    expect(result.violations.length).toBeGreaterThanOrEqual(3)
  })
})

describe('buildBrandVoiceConstraint', () => {
  it('returns a non-empty string with forbidden words listed', () => {
    const constraint = buildBrandVoiceConstraint()
    expect(constraint.length).toBeGreaterThan(100)
    expect(constraint).toContain('leverage')
    expect(constraint).toContain('meistern')
  })
})
