'use client'

import React from 'react'
import Modal from './Modal'
import Button from './Button'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'warning' | 'info' | 'success' | 'error'
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info'
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'warning':
        return {
          icon: '⚠️',
          confirmColor: 'bg-yellow-600 hover:bg-yellow-700',
          iconBg: 'bg-yellow-100'
        }
      case 'error':
        return {
          icon: '❌',
          confirmColor: 'bg-red-600 hover:bg-red-700',
          iconBg: 'bg-red-100'
        }
      case 'success':
        return {
          icon: '✅',
          confirmColor: 'bg-green-600 hover:bg-green-700',
          iconBg: 'bg-green-100'
        }
      default:
        return {
          icon: 'ℹ️',
          confirmColor: 'bg-blue-600 hover:bg-blue-700',
          iconBg: 'bg-blue-100'
        }
    }
  }

  const { icon, confirmColor, iconBg } = getIconAndColor()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full ${iconBg} flex items-center justify-center text-lg`}>
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-gray-700 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className={confirmColor}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmModal
