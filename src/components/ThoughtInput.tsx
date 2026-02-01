import { useState, useRef, useEffect, FormEvent } from 'react'
import './ThoughtInput.css'

interface ThoughtInputProps {
  onSave: (thought: string) => Promise<boolean>
  isSaving: boolean
  disabled?: boolean
}

export function ThoughtInput({ onSave, isSaving, disabled }: ThoughtInputProps) {
  const [thought, setThought] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus()
    }
  }, [disabled])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (thought.trim() && !isSaving && !disabled) {
      const success = await onSave(thought.trim())
      // Only clear input if save was successful
      if (success) {
        setThought('')
      }
    }
  }

  return (
    <form className="thought-form" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={thought}
        onChange={(e) => setThought(e.target.value)}
        placeholder="What's on your mind?"
        className="thought-input"
        disabled={isSaving || disabled}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      <div className="input-actions">
        <button
          type="submit"
          className="save-button"
          disabled={!thought.trim() || isSaving || disabled}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
