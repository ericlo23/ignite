import { useState, useRef, useEffect, FormEvent, KeyboardEvent, ChangeEvent } from 'react'
import './ThoughtInput.css'

interface ThoughtInputProps {
  onSave: (thought: string) => Promise<boolean>
  isSaving: boolean
  disabled?: boolean
}

export function ThoughtInput({ onSave, isSaving, disabled }: ThoughtInputProps) {
  const [thought, setThought] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus()
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Prevent Enter from creating newlines, submit instead
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    // Remove any newline characters (from paste, etc.)
    const value = e.target.value.replace(/[\r\n]/g, '')
    setThought(value)
  }

  return (
    <form className="thought-form" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        value={thought}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="What's on your mind?"
        className="thought-textarea"
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
