'use client'

import { useEffect } from 'react'

export default function FormScript() {
  useEffect(() => {
    const handleFormOffline = () => {
      const form = document.querySelector('form.flex.flex-col.gap-6') as HTMLFormElement
      if (form) {
        form.addEventListener('submit', (e) => {
          if (!navigator.onLine) {
            e.preventDefault()
            const fd = new FormData(form)
            const data = Object.fromEntries(fd.entries())
            const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]')
            queue.push(data)
            localStorage.setItem('offlineQueue', JSON.stringify(queue))
            alert('You are offline. Report saved and will auto-submit when connection is restored.')
            form.reset()
          }
        })
      }

      window.addEventListener('online', () => {
        const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]')
        if (queue.length > 0) {
          alert('Connection restored! Submitting offline reports...')
          const data = queue.shift()
          localStorage.setItem('offlineQueue', JSON.stringify(queue))
          
          if (form) {
            for (const [key, value] of Object.entries(data)) {
              const input = form.elements.namedItem(key) as HTMLInputElement | RadioNodeList
              if (input) {
                const firstInput = 'length' in input ? input[0] : input as HTMLInputElement
                if (firstInput.type === 'checkbox' || firstInput.type === 'radio') {
                  if ('length' in input) {
                    Array.from(input).forEach((i: HTMLInputElement) => i.checked = (i.value === value))
                  } else {
                    (input as HTMLInputElement).checked = (value === 'on')
                  }
                } else {
                  (input as HTMLInputElement).value = value as string
                }
              }
            }
            form.submit()
          }
        }
      })
    }

    // Run the script logic
    handleFormOffline()

    // Cleanup event listeners
    return () => {
      window.removeEventListener('online', handleFormOffline)
    }
  }, [])

  return null
}
