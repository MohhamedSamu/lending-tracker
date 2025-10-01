'use client'

import React, { useState } from 'react'
import { Payment } from '@/lib/database.types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Eye, FileText } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'
import AddPaymentModal from './AddPaymentModal'
import ViewVoucherModal from './ViewVoucherModal'
import { useAuth } from '@/context/AuthContext'

interface RecentPaymentsProps {
  payments: Payment[]
  onPaymentUpdate: () => void
}

const RecentPayments: React.FC<RecentPaymentsProps> = ({ payments, onPaymentUpdate }) => {
  const { user } = useAuth()
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd MMM yyyy', { locale: es })
  }

  const recentPayments = payments.slice(0, 5)

  const canAddPayments = user?.role === 'borrower'

  return (
    <>
      <Card>
        <Card.Header>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pagos Recientes</h3>
              <p className="text-sm text-gray-500">Últimos {recentPayments.length} pagos</p>
            </div>
            {canAddPayments && (
              <Button
                size="sm"
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Agregar Pago</span>
              </Button>
            )}
          </div>
        </Card.Header>
        <Card.Content>
          {recentPayments.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No hay pagos registrados</p>
              {canAddPayments && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  className="mt-4"
                >
                  Agregar primer pago
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>
                    {payment.notes && (
                      <p className="text-sm text-gray-600 mt-1">{payment.notes}</p>
                    )}
                  </div>
                  
                  {payment.voucher_url && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedVoucher(payment.voucher_url!)}
                      className="ml-4 flex items-center space-x-1"
                    >
                      <Eye size={14} />
                      <span>Ver Voucher</span>
                    </Button>
                  )}
                </div>
              ))}
              
              {payments.length > 5 && (
                <div className="text-center pt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.location.href = '/payments'}
                  >
                    Ver todos los pagos ({payments.length})
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Add Payment Modal */}
      {showAddModal && (
        <AddPaymentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            onPaymentUpdate()
          }}
        />
      )}

      {/* View Voucher Modal */}
      {selectedVoucher && (
        <ViewVoucherModal
          isOpen={!!selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
          voucherUrl={selectedVoucher}
        />
      )}
    </>
  )
}

export default RecentPayments
