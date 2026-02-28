// ============================================================
//  GameContext.jsx
//  Stores captured form values (name, email, password).
//  Used by InputOverlay and submit flow.
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react'

const GameContext = createContext(null)

export function GameProvider({ children }) {
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
  })

  const setFieldValue = useCallback((label, value) => {
    const key = label.toLowerCase()
    setFormValues(prev => ({ ...prev, [key]: value }))
  }, [])

  const getFieldValue = useCallback((label) => {
    const key = label.toLowerCase()
    return formValues[key] ?? ''
  }, [formValues])

  const resetFormValues = useCallback(() => {
    setFormValues({ name: '', email: '', password: '' })
  }, [])

  const value = {
    formValues,
    setFieldValue,
    getFieldValue,
    resetFormValues,
  }

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameContext() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameContext must be used within GameProvider')
  return ctx
}
