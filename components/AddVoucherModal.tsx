'use client'

import React, { useState } from 'react'
import { PaymentService } from '@/lib/payments'
import { Upload, X } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import toast from 'react-hot-toast'

interface AddVoucherModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  paymentId: string
  userId: string
}

const AddVoucherModal: React.FC<AddVoucherModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  paymentId,
  userId
}) => {
  const [voucherFile, setVoucherFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!validTypes.includes(file.type)) {
        toast.error('Solo se permiten archivos JPG, PNG o PDF')
        return
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo no puede ser mayor a 5MB')
        return
      }
      
      setVoucherFile(file)
    }
  }

  const removeFile = () => {
    setVoucherFile(null)
    const fileInput = document.getElementById('add-voucher-file') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!voucherFile) {
      toast.error('Por favor selecciona un archivo')
      return
    }

    setLoading(true)

    try {
      // Upload voucher
      const voucherUrl = await PaymentService.uploadVoucher(voucherFile, paymentId, userId)
      
      if (!voucherUrl) {
        toast.error('Error al subir el voucher')
        setLoading(false)
        return
      }

      // Update payment with voucher URL
      const success = await PaymentService.updatePayment(paymentId, {
        voucher_url: voucherUrl
      })

      if (success) {
        toast.success('Voucher agregado exitosamente')
        resetForm()
        onSuccess()
        onClose()
      } else {
        toast.error('Error al actualizar el pago')
      }
    } catch (error) {
      console.error('Error adding voucher:', error)
      toast.error('Error al agregar el voucher')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setVoucherFile(null)
    const fileInput = document.getElementById('add-voucher-file') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Agregar Voucher"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600">
          Sube el voucher de transferencia para este pago. Una vez subido, no podrás modificarlo.
        </p>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Voucher de Transferencia
          </label>
          
          {!voucherFile ? (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="add-voucher-file"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Haz clic para subir</span> o arrastra el archivo
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG o PDF (máx. 5MB)</p>
                </div>
                <input
                  id="add-voucher-file"
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <Upload size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{voucherFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(voucherFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={!voucherFile}
          >
            Agregar Voucher
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default AddVoucherModal



