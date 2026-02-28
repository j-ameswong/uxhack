// ============================================================
//  InputOverlay.jsx
//  Stage 4: Shows when snake captures a field. User types value, validates, resumes.
// ============================================================

import { useState, useEffect, useRef } from 'react'

const VALIDATORS = {
  Name: (v) => (v.trim().length > 0 ? null : 'Name is required'),
  Email: (v) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(v.trim()) ? null : 'Enter a valid email'
  },
  Password: (v) => (v.length >= 8 ? null : 'Password must be at least 8 characters'),
}

export function InputOverlay({ field, onConfirm, onCancel }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [field])

  function handleConfirm() {
    const validator = VALIDATORS[field?.label]
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
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2"
      style={{
        background: 'rgba(0,0,0,0.9)',
        border: '1px solid #39ff14',
        borderRadius: '8px',
        padding: '16px 24px',
        boxShadow: '0 0 30px rgba(57,255,20,0.2)',
        minWidth: '280px',
      }}
    >
      <label
        className="text-sm w-full text-left"
        style={{ color: '#39ff14', fontFamily: 'Courier New, monospace' }}
      >
        Enter your {field.label}:
      </label>
      <input
        ref={inputRef}
        type={field.label === 'Password' ? 'password' : 'text'}
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setError(null)
        }}
        onKeyDown={handleKeyDown}
        placeholder={field.label === 'Password' ? 'min 8 characters' : ''}
        className="w-full px-4 py-2 rounded border"
        style={{
          background: '#0a0a0a',
          borderColor: error ? '#ff4444' : '#333',
          color: '#fff',
          fontFamily: 'monospace',
        }}
      />
      {error && (
        <p
          className="text-xs w-full text-left"
          style={{ color: '#ff4444', fontFamily: 'monospace' }}
        >
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={handleConfirm}
        className="px-4 py-2 text-sm font-bold rounded"
        style={{
          background: '#39ff14',
          color: '#000',
          border: 'none',
          fontFamily: 'Courier New, monospace',
        }}
      >
        Confirm (Enter)
      </button>
    </div>
  )
}
