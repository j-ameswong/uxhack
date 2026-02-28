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
  Password: (v) => (v.length >= 8 ? null : 'Min 8 characters'),
}

export function InputOverlay({ field, onConfirm, onCancel, onCharTyped, storedPassword }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
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
    const validator = isVerify
      ? (v) => (v === storedPassword ? null : 'Passwords do not match')
      : VALIDATORS[field?.label]
    const err = validator ? validator(value) : null
    setError(err)

    if (!err) {
      onConfirm?.(field, value.trim())
      setValue('')
      setError(null)
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
  }

  if (!field) return null

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
                  ? 'min 8 characters'
                  : field.label === 'Verify Password'
                    ? 're-enter password'
                    : ''
              }
              className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.625rem' }}
              aria-invalid={!!error}
            />
          </div>
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
