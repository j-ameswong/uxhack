// ============================================================
//  InputOverlay.jsx
//  Pixel-art styled input prompt when snake captures a field.
// ============================================================

import { useState, useEffect, useRef } from 'react'

const VALIDATORS = {
  Name: (v) => (v.trim().length > 0 ? null : 'Name is required'),
  Email: (v) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(v.trim()) ? null : 'Enter a valid email'
  },
}

/**
 * Progressive password rules — revealed one at a time.
 * Each rule is { test, message }.
 */
const PASSWORD_RULES = [
  {
    test: (v) => v.length >= 8,
    message: 'Must be at least 8 characters',
  },
  {
    test: (v) => /[A-Z]/.test(v),
    message: 'Must include an uppercase letter',
  },
  {
    test: (v) => {
      const digits = v.match(/\d/g)
      if (!digits) return false
      const sum = digits.reduce((s, d) => s + Number(d), 0)
      return sum >= 25
    },
    message: 'The digits in your password must add up to 25',
  },
  {
    test: (v) => /[\u{1F600}-\u{1F9FF}]/u.test(v),
    message: 'Must contain an emoji',
  },
  {
    test: (v) => {
      const nums = v.match(/\d+/g)
      if (!nums) return false
      return nums.some(n => {
        const num = parseInt(n, 10)
        if (num < 2) return false
        for (let i = 2; i <= Math.sqrt(num); i++) {
          if (num % i === 0) return false
        }
        return true
      })
    },
    message: 'Must contain a prime number',
  },
]

export function InputOverlay({ field, onConfirm, onCancel, onCharTyped, onFailedValidation, storedPassword }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(null)
  const [passwordLevel, setPasswordLevel] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [field])

  // Reset state when a new field is captured
  useEffect(() => {
    setValue('')
    setError(null)
    if (field?.label === 'Password') {
      setPasswordLevel(0)
    }
  }, [field])

  function handleChange(e) {
    const newVal = e.target.value
    // Detect added characters (typed, not deleted)
    if (newVal.length > value.length) {
      const added = newVal.slice(value.length)
      for (const ch of added) {
        onCharTyped?.(ch)
      }
    }
    setValue(newVal)
    setError(null)
  }

  function handleConfirm() {
    const isVerify = field?.label === 'Verify Password'
    const isPassword = field?.label === 'Password'

    if (isVerify) {
      const err = value === storedPassword ? null : 'Passwords do not match'
      setError(err)
      if (!err) {
        onConfirm?.(field, value.trim())
        setValue('')
        setError(null)
      } else {
        onFailedValidation?.()
      }
      return
    }

    if (isPassword) {
      // Check all rules up to and including the current level
      for (let i = 0; i <= passwordLevel; i++) {
        const rule = PASSWORD_RULES[i]
        if (!rule.test(value)) {
          setError(`Rule ${i + 1}: ${rule.message}`)
          onFailedValidation?.()
          return
        }
      }
      // Current level passed — reveal next rule or accept
      if (passwordLevel < PASSWORD_RULES.length - 1) {
        const nextLevel = passwordLevel + 1
        const nextRule = PASSWORD_RULES[nextLevel]
        if (!nextRule.test(value)) {
          setPasswordLevel(nextLevel)
          setError(`Rule ${nextLevel + 1}: ${nextRule.message}`)
          onFailedValidation?.()
          return
        }
        // Might pass multiple new rules at once — keep checking
        let level = nextLevel
        while (level < PASSWORD_RULES.length - 1) {
          level++
          if (!PASSWORD_RULES[level].test(value)) {
            setPasswordLevel(level)
            setError(`Rule ${level + 1}: ${PASSWORD_RULES[level].message}`)
            onFailedValidation?.()
            return
          }
        }
        // All rules passed
        setPasswordLevel(PASSWORD_RULES.length - 1)
      }
      // All rules passed — confirm
      onConfirm?.(field, value.trim())
      setValue('')
      setError(null)
      setPasswordLevel(0)
      return
    }

    // Name / Email
    const validator = VALIDATORS[field?.label]
    const err = validator ? validator(value) : null
    setError(err)
    if (!err) {
      onConfirm?.(field, value.trim())
      setValue('')
      setError(null)
    } else {
      onFailedValidation?.()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
    if (e.key === 'Escape') {
      setError(null)
      onCancel?.()
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      onCharTyped?.()
    }
  }

  if (!field) return null

  const isPassword = field.label === 'Password'
  const rulesRevealed = isPassword ? passwordLevel + 1 : 0

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
      <div className="pixel-bevel min-w-[320px]" style={{ backgroundColor: '#25253e' }}>
        {/* Title bar */}
        <div className="flex items-center px-3 py-1.5" style={{
          backgroundColor: '#6366f1',
          borderBottom: '3px solid #3730a3',
        }}>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem', color: '#e0e0e0' }}>
            ENTER {field.label.toUpperCase()}
          </span>
          {isPassword && (
            <span className="ml-auto" style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.4rem', color: '#e0e0e0' }}>
              RULES: {rulesRevealed}/{PASSWORD_RULES.length}
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          <label className="block text-primary" style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.625rem' }}>
            Enter your {field.label}:
          </label>
          <div className="pixel-bevel-inset p-2" style={{ backgroundColor: '#1a1a2e' }}>
            <input
              ref={inputRef}
              type={field.label === 'Password' || field.label === 'Verify Password' ? 'password' : 'text'}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={
                field.label === 'Password'
                  ? 'good luck...'
                  : field.label === 'Verify Password'
                    ? 're-enter password'
                    : ''
              }
              className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.625rem' }}
              aria-invalid={!!error}
            />
          </div>

          {/* Revealed password rules checklist */}
          {isPassword && rulesRevealed > 0 && (
            <div className="space-y-1">
              {PASSWORD_RULES.slice(0, rulesRevealed).map((rule, i) => {
                const passed = rule.test(value)
                return (
                  <div key={i} className="flex items-center gap-2" style={{
                    fontFamily: 'var(--font-pixel)',
                    fontSize: '0.4rem',
                    color: passed ? '#4ade80' : '#ef4444',
                  }}>
                    <span>{passed ? '[x]' : '[ ]'}</span>
                    <span>{rule.message}</span>
                  </div>
                )
              })}
            </div>
          )}

          {error && (
            <p className="text-destructive" style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.5rem' }}>
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-2 px-4 pixel-bevel cursor-pointer font-bold"
            style={{
              fontFamily: 'var(--font-pixel)',
              fontSize: '0.625rem',
              backgroundColor: '#4ade80',
              color: '#1a1a2e',
            }}
          >
            CONFIRM [ENTER]
          </button>
        </div>
      </div>
    </div>
  )
}
