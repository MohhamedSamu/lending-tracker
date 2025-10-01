'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { PaymentService } from '@/lib/payments'
import { Upload, X } from 'lucide-react'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Input from './ui/Input'
import ConfirmModal from './ui/ConfirmModal'
import toast from 'react-hot-toast'

interface AddPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, userDetails } = useAuth()
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [voucherFile, setVoucherFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentType, setPaymentType] = useState<'minimum' | 'extra'>('minimum')
  const [monthlyPayment, setMonthlyPayment] = useState(0)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    type: 'warning' | 'info' | 'success' | 'error'
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  })

  // Cargar pago mensual del usuario
  React.useEffect(() => {
    if (userDetails?.monthly_payment) {
      setMonthlyPayment(userDetails.monthly_payment)
      if (paymentType === 'minimum') {
        setFormData(prev => ({ ...prev, amount: userDetails.monthly_payment!.toString() }))
      }
    }
  }, [userDetails, paymentType])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

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

  const handlePaymentTypeChange = (type: 'minimum' | 'extra') => {
    setPaymentType(type)
    if (type === 'minimum' && monthlyPayment > 0) {
      setFormData(prev => ({ ...prev, amount: monthlyPayment.toString() }))
    } else if (type === 'extra') {
      setFormData(prev => ({ ...prev, amount: '' }))
    }
  }

  const showConfirmModal = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    type: 'warning' | 'info' | 'success' | 'error' = 'info'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type
    })
  }

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }))
  }

  const checkExistingMinimumPayment = async (paymentDate: string) => {
    if (!user) return false
    
    const payments = await PaymentService.getPaymentsByUserId(user.id)
    const paymentMonth = new Date(paymentDate).getMonth()
    const paymentYear = new Date(paymentDate).getFullYear()
    
    const existingMinimum = payments.some(payment => {
      const paymentDateObj = new Date(payment.payment_date)
      return paymentDateObj.getMonth() === paymentMonth && 
             paymentDateObj.getFullYear() === paymentYear &&
             payment.payment_type === 'minimum'
    })
    
    return existingMinimum
  }

  const removeFile = () => {
    setVoucherFile(null)
    const fileInput = document.getElementById('voucher-file') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Por favor ingresa un monto válido')
      return
    }

    setLoading(true)

    try {
      // Verificar si ya existe un pago mínimo en el mes
      const hasExistingMinimum = await checkExistingMinimumPayment(formData.payment_date)
      
      if (paymentType === 'minimum' && hasExistingMinimum) {
        showConfirmModal(
          'Pago Mínimo Duplicado',
          'Este mes ya has hecho un pago mínimo. ¿Deseas cambiar este pago a tipo "Extra"?',
          () => {
            setPaymentType('extra')
            setFormData(prev => ({ ...prev, amount: '' }))
            setLoading(false)
            closeConfirmModal()
          },
          'warning'
        )
        setLoading(false)
        return
      }

      if (paymentType === 'extra' && !hasExistingMinimum) {
        if (amount < monthlyPayment) {
          showConfirmModal(
            'Pago Extra Menor al Mínimo',
            `Este mes aún no has hecho el pago mínimo ($${monthlyPayment.toLocaleString()}) y la cantidad es menor al pago mínimo. ¿Deseas continuar como pago extra?`,
            () => {
              createSinglePayment(amount)
              closeConfirmModal()
            },
            'warning'
          )
          setLoading(false)
          return
        } else if (amount > monthlyPayment) {
          showConfirmModal(
            'Dividir Pago',
            `Este mes aún no has hecho el pago mínimo. ¿Deseas dividir este pago en dos: uno mínimo de $${monthlyPayment.toLocaleString()} y uno extra de $${(amount - monthlyPayment).toLocaleString()}?`,
            () => {
              createSplitPayments(monthlyPayment, amount - monthlyPayment)
              closeConfirmModal()
            },
            'info'
          )
          setLoading(false)
          return
        }
      }

      // Crear pago normal
      await createSinglePayment(amount)
      
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('Error al agregar el pago')
      setLoading(false)
    }
  }

  const createSinglePayment = async (amount: number) => {
    if (!user) return

    const newPayment = await PaymentService.addPayment({
      user_id: user.id,
      amount,
      payment_date: formData.payment_date,
      payment_type: paymentType,
      notes: formData.notes || undefined
    })

    if (!newPayment) {
      toast.error('Error al crear el pago')
      return
    }

    // Upload voucher if provided
    let voucherUrl = null
    if (voucherFile) {
      voucherUrl = await PaymentService.uploadVoucher(voucherFile, newPayment.id, user.id)
      
      if (voucherUrl) {
        await PaymentService.updatePayment(newPayment.id, {
          voucher_url: voucherUrl
        })
      } else {
        toast.error('El pago se guardó pero hubo un error al subir el voucher')
      }
    }

    toast.success('Pago agregado exitosamente')
    onSuccess()
    setLoading(false)
  }

  const createSplitPayments = async (minimumAmount: number, extraAmount: number) => {
    if (!user) return

    // Crear pago mínimo
    const minimumPayment = await PaymentService.addPayment({
      user_id: user.id,
      amount: minimumAmount,
      payment_date: formData.payment_date,
      payment_type: 'minimum',
      notes: `${formData.notes || ''} (Pago mínimo)`.trim() || undefined
    })

    // Crear pago extra
    const extraPayment = await PaymentService.addPayment({
      user_id: user.id,
      amount: extraAmount,
      payment_date: formData.payment_date,
      payment_type: 'extra',
      notes: `${formData.notes || ''} (Pago extra)`.trim() || undefined
    })

    if (!minimumPayment || !extraPayment) {
      toast.error('Error al crear los pagos')
      return
    }

    // Subir voucher para ambos pagos si existe
    if (voucherFile) {
      const [minimumVoucherUrl, extraVoucherUrl] = await Promise.all([
        PaymentService.uploadVoucher(voucherFile, minimumPayment.id, user.id),
        PaymentService.uploadVoucher(voucherFile, extraPayment.id, user.id)
      ])

      if (minimumVoucherUrl) {
        await PaymentService.updatePayment(minimumPayment.id, {
          voucher_url: minimumVoucherUrl
        })
      }
      if (extraVoucherUrl) {
        await PaymentService.updatePayment(extraPayment.id, {
          voucher_url: extraVoucherUrl
        })
      }
    }

    toast.success('Pagos creados exitosamente (mínimo + extra)')
    onSuccess()
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    })
    setVoucherFile(null)
    setPaymentType('minimum')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Agregar Nuevo Pago"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de Pago */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Tipo de Pago
          </label>
          <div className="flex space-x-6">
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentType"
                value="minimum"
                checked={paymentType === 'minimum'}
                onChange={() => handlePaymentTypeChange('minimum')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">
                Pago Mínimo (${monthlyPayment.toLocaleString()})
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="paymentType"
                value="extra"
                checked={paymentType === 'extra'}
                onChange={() => handlePaymentTypeChange('extra')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">
                Pago Extra
              </span>
            </label>
          </div>
        </div>

        <Input
          label="Monto del Pago"
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleInputChange}
          placeholder={paymentType === 'minimum' ? monthlyPayment.toString() : '0.00'}
          step="0.01"
          min="0"
          required
          disabled={paymentType === 'minimum'}
        />

        <Input
          label="Fecha del Pago"
          type="date"
          name="payment_date"
          value={formData.payment_date}
          onChange={handleInputChange}
          required
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            Notas (opcional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
            placeholder="Notas adicionales sobre el pago..."
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Voucher de Transferencia (opcional)
          </label>
          
          {!voucherFile ? (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="voucher-file"
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
                  id="voucher-file"
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
          >
            Agregar Pago
          </Button>
        </div>
      </form>

      {/* Modal de Confirmación */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />
    </Modal>
  )
}

export default AddPaymentModal
