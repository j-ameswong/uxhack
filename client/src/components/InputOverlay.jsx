// ============================================================
//  InputOverlay.jsx
//  Pixel-art styled input prompt when snake captures a field.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { cn } from './ui/utils.js'

/**
 * Progressive password rules — revealed one at a time.
 * The secret-animal rule is prepended dynamically inside the component.
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
]

export function InputOverlay({
  field,
  onConfirm,
  onCancel,
  onCharTyped,
  onFailedValidation,
  storedPassword,
  loginName = '',
  loginEmail = '',
  loginSecret = '',
}) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(null)
  const [passwordLevel, setPasswordLevel] = useState(0)
  const [failedOnce, setFailedOnce] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [field])

  // Reset state when a new field is captured
  useEffect(() => {
    setValue('')
    setError(null)
    setFailedOnce(false)
    if (field?.label === 'Password') {
      setPasswordLevel(0)
    }
  }, [field])

  // Build the active password rule set: secret rule prepended if available
  const activePasswordRules = (() => {
    if (!loginSecret) return PASSWORD_RULES
    const reversed = loginSecret.split('').reverse().join('').toLowerCase()
    return [
      {
        test: (v) => v.toLowerCase().includes(reversed),
        message: `Must contain your spirit animal, backwards`,
      },
      ...PASSWORD_RULES,
    ]
  })()

  // Validators for Name and Email — match login form values (case-insensitive)
  function validate(label, v) {
    if (label === 'Name') {
      if (loginName) {
        return v.trim().toLowerCase() === loginName.trim().toLowerCase()
          ? null
          : 'Name does not match'
      }
      return v.trim().length > 0 ? null : 'Name is required'
    }
    if (label === 'Email') {
      if (loginEmail) {
        return v.trim().toLowerCase() === loginEmail.trim().toLowerCase()
          ? null
          : 'Email does not match'
      }
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return re.test(v.trim()) ? null : 'Enter a valid email'
    }
    return null
  }

  function handleChange(e) {
    const newVal = e.target.value
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
        setValue('')
        onFailedValidation?.()
      }
      return
    }

    if (isPassword) {
      // Check all rules up to and including the current level
      for (let i = 0; i <= passwordLevel; i++) {
        const rule = activePasswordRules[i]
        if (!rule.test(value)) {
          setError(`Rule ${i + 1}: ${rule.message}`)
          setValue('')
          setFailedOnce(true)
          onFailedValidation?.()
          return
        }
      }
      // Current level passed — reveal next rule or accept
      if (passwordLevel < activePasswordRules.length - 1) {
        const nextLevel = passwordLevel + 1
        const nextRule = activePasswordRules[nextLevel]
        if (!nextRule.test(value)) {
          setPasswordLevel(nextLevel)
          setError(`Rule ${nextLevel + 1}: ${nextRule.message}`)
          setValue('')
          setFailedOnce(true)
          onFailedValidation?.()
          return
        }
        // Might pass multiple new rules at once — keep checking
        let level = nextLevel
        while (level < activePasswordRules.length - 1) {
          level++
          if (!activePasswordRules[level].test(value)) {
            setPasswordLevel(level)
            setError(`Rule ${level + 1}: ${activePasswordRules[level].message}`)
            setValue('')
            setFailedOnce(true)
            onFailedValidation?.()
            return
          }
        }
        setPasswordLevel(activePasswordRules.length - 1)
      }
      // All rules passed — confirm
      onConfirm?.(field, value.trim())
      setValue('')
      setError(null)
      setPasswordLevel(0)
      return
    }

    // Name / Email
    const err = validate(field?.label, value)
    setError(err)
    if (!err) {
      onConfirm?.(field, value.trim())
      setValue('')
      setError(null)
    } else {
      setFailedOnce(true)
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
  const isVerify = field.label === 'Verify Password'
  const rulesRevealed = isPassword ? passwordLevel + 1 : 0

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30">
      <div className={cn("pixel-bevel", isVerify ? "min-w-[420px]" : "min-w-[320px]")} style={{ backgroundColor: '#25253e' }}>
        {/* Title bar */}
        <div className="flex items-center px-3 py-1.5" style={{
          backgroundColor: '#6366f1',
          borderBottom: '3px solid #3730a3',
        }}>
          <span style={{ fontFamily: 'var(--font-pixel)', fontSize: isVerify ? '0.625rem' : '0.5rem', color: '#e0e0e0' }}>
            ENTER {field.label.toUpperCase()}
          </span>
          {isPassword && (
            <span className="ml-auto" style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.4rem', color: '#e0e0e0' }}>
              RULES: {rulesRevealed}/{activePasswordRules.length}
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          <label className="block text-primary" style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.625rem' }}>
            Enter your {field.label}:
            {failedOnce && field.label === 'Name' && loginName && (
              <span style={{ opacity: 0.4, marginLeft: '0.5rem' }}>[{loginName}]</span>
            )}
            {failedOnce && field.label === 'Email' && loginEmail && (
              <span style={{ opacity: 0.4, marginLeft: '0.5rem' }}>[{loginEmail}]</span>
            )}
            {failedOnce && isPassword && loginSecret && (
              <span style={{ opacity: 0.4, marginLeft: '0.5rem' }}>[{loginSecret}]</span>
            )}
          </label>
          <div className="pixel-bevel-inset p-2" style={{ backgroundColor: '#1a1a2e' }}>
            <input
              ref={inputRef}
              type={isPassword || isVerify ? 'password' : 'text'}
              autoComplete="off"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isPassword
                  ? 'good luck...'
                  : isVerify
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
              {activePasswordRules.slice(0, rulesRevealed).map((rule, i) => {
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
            <p className="text-destructive" style={{ fontFamily: 'var(--font-pixel)', fontSize: isVerify ? '0.625rem' : '0.5rem' }}>
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
