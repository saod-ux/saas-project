'use client'

import React, { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface ModalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  primaryLabel: string
  primaryDisabled?: boolean
  onSubmit: () => void
  busy?: boolean
  children: React.ReactNode
}

export function ModalForm({
  open,
  onOpenChange,
  title,
  primaryLabel,
  primaryDisabled = false,
  onSubmit,
  busy = false,
  children
}: ModalFormProps) {
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && firstInputRef.current) {
      // Small delay to ensure the modal is fully rendered
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!busy && !primaryDisabled) {
      onSubmit()
    }
  }

  const handleCancel = () => {
    if (!busy) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-2rem)] flex flex-col p-0">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-160px)]">
            <div className="space-y-6">
              {React.Children.map(children, (child, index) => {
                if (index === 0 && React.isValidElement(child)) {
                  return React.cloneElement(child, { ref: firstInputRef } as any)
                }
                return child
              })}
            </div>
          </div>
          
          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              disabled={busy}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={primaryDisabled || busy}
              className="btn-primary flex-1"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                primaryLabel
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
