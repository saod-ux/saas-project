'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface OrderStatusUpdateProps {
  orderId: string
  currentStatus: string
}

export function OrderStatusUpdate({ orderId, currentStatus }: OrderStatusUpdateProps) {
  const [status, setStatus] = useState(currentStatus)
  const [updating, setUpdating] = useState(false)

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/orders?id=${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      const data = await response.json()
      if (data.ok) {
        alert('Order status updated successfully!')
      } else {
        console.error('Error updating order:', data.error)
        setStatus(currentStatus) // Revert on error
      }
    } catch (error) {
      console.error('Error updating order:', error)
      setStatus(currentStatus) // Revert on error
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="shipped">Shipped</SelectItem>
          <SelectItem value="delivered">Delivered</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Button 
        size="sm" 
        onClick={handleUpdate}
        disabled={updating || status === currentStatus}
      >
        {updating ? 'Updating...' : 'Update'}
      </Button>
    </div>
  )
}













