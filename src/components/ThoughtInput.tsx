import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from 'react'
import './ThoughtInput.css'

interface ThoughtInputProps {
  onSave: (thought: string) => void
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

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea && thought) {
      // Only grow when content exceeds current height
      const scrollHeight = textarea.scrollHeight
      const currentHeight = textarea.clientHeight
      if (scrollHeight > currentHeight) {
        textarea.style.height = `${scrollHeight}px`
      }
    }
  }, [thought])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (thought.trim() && !isSaving && !disabled) {
      onSave(thought.trim())
      setThought('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl + Enter to save
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form className="thought-form" onSubmit={handleSubmit}>
      <textarea
        ref={textareaRef}
        value={thought}
        onChange={(e) => setThought(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="有什麼想法？"
        className="thought-textarea"
        disabled={isSaving || disabled}
        rows={3}
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
          {isSaving ? '儲存中...' : '儲存'}
        </button>
      </div>
    </form>
  )
}
