// ============================================================
//  InputOverlay.jsx
//  Shows when snake captures a field. User types value, validates, resumes.
//  Restyled with Figma design system components.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from './ui/card.jsx'
import { Input } from './ui/input.jsx'
import { Label } from './ui/label.jsx'
import { Button } from './ui/button.jsx'

const VALIDATORS = {
  Name: (v) => (v.trim().length > 0 ? null : 'Name is required'),
  Email: (v) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(v.trim()) ? null : 'Enter a valid email'
  },
  Password: (v) => (v.length >= 8 ? null : 'Password must be at least 8 characters'),
}

export function InputOverlay({ field, onConfirm, onCancel, storedPassword }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [field])

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
      <Card className="min-w-[300px] backdrop-blur-md bg-card/90 shadow-2xl border">
        <CardContent className="space-y-3 pt-4 pb-4 px-5">
          <Label htmlFor="field-input" className="text-sm">
            Enter your {field.label}:
          </Label>
          <Input
            ref={inputRef}
            id="field-input"
            type={field.label === 'Password' || field.label === 'Verify Password' ? 'password' : 'text'}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              field.label === 'Password'
                ? 'min 8 characters'
                : field.label === 'Verify Password'
                  ? 're-enter password'
                  : ''
            }
            aria-invalid={!!error}
          />
          {error && (
            <p className="text-xs text-destructive">
              {error}
            </p>
          )}
          <Button
            type="button"
            onClick={handleConfirm}
            size="sm"
            className="w-full cursor-pointer"
          >
            Confirm (Enter)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
