'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { PaymentService } from '@/lib/payments'
import { Payment } from '@/lib/database.types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Eye, Search, Filter, Upload } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import AddPaymentModal from '@/components/AddPaymentModal'
import AddVoucherModal from '@/components/AddVoucherModal'
import ViewVoucherModal from '@/components/ViewVoucherModal'
import MoraMonthsCard from '@/components/MoraMonthsCard'
import toast from 'react-hot-toast'

const PaymentsPage: React.FC = () => {
  const { user, userDetails, loading } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null)
  const [showAddVoucherModal, setShowAddVoucherModal] = useState(false)
  const [selectedPaymentForVoucher, setSelectedPaymentForVoucher] = useState<Payment | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
      return
    }

    if (user && user.role === 'lender') {
      router.push('/dashboard')
      return
    }

    if (user) {
      loadPayments()
    }
  }, [user, loading, router])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, dateFilter])

  const loadPayments = async () => {
    if (!user) return
    
    try {
      const userPayments = await PaymentService.getPaymentsByUserId(user.id)
      setPayments(userPayments)
    } catch (error) {
      console.error('Error loading payments:', error)
      toast.error('Error al cargar los pagos')
    } finally {
      setLoadingPayments(false)
    }
  }

  const filterPayments = () => {
    let filtered = [...payments]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount.toString().includes(searchTerm)
      )
    }

    // Date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      const filterMonth = filterDate.getMonth()
      const filterYear = filterDate.getFullYear()
      
      filtered = filtered.filter(payment => {
        const paymentDate = new Date(payment.payment_date)
        return paymentDate.getMonth() === filterMonth && paymentDate.getFullYear() === filterYear
      })
    }

    setFilteredPayments(filtered)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd MMM yyyy', { locale: es })
  }

  const getTotalAmount = () => {
    return filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  if (loading || loadingPayments) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  if (!user || user.role !== 'borrower') {
    return null
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Pagos</h1>
            <p className="text-sm text-gray-500">
              {filteredPayments.length} pagos • Total: {formatCurrency(getTotalAmount())}
            </p>
          </div>
          
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Agregar Pago</span>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por monto o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="sm:w-48">
              <Input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full"
              />
            </div>
            {(searchTerm || dateFilter) && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchTerm('')
                  setDateFilter('')
                }}
              >
                Limpiar
              </Button>
            )}
          </div>
        </Card>

        {/* Mora Months Card */}
        {userDetails && <MoraMonthsCard user={userDetails} payments={payments} />}

        {/* Payments List */}
        <Card>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">
                {payments.length === 0 
                  ? 'No has registrado ningún pago aún' 
                  : 'No se encontraron pagos con los filtros aplicados'
                }
              </p>
              {payments.length === 0 && (
                <Button onClick={() => setShowAddModal(true)}>
                  Agregar primer pago
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Voucher
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.payment_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {payment.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.voucher_url ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedVoucher(payment.voucher_url!)}
                            className="flex items-center space-x-1"
                          >
                            <Eye size={14} />
                            <span>Ver</span>
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedPaymentForVoucher(payment)
                              setShowAddVoucherModal(true)
                            }}
                            className="flex items-center space-x-1"
                          >
                            <Upload size={14} />
                            <span>Agregar</span>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <AddPaymentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            loadPayments()
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

      {/* Add Voucher Modal */}
      {showAddVoucherModal && selectedPaymentForVoucher && (
        <AddVoucherModal
          isOpen={showAddVoucherModal}
          onClose={() => {
            setShowAddVoucherModal(false)
            setSelectedPaymentForVoucher(null)
          }}
          onSuccess={() => {
            loadPayments()
          }}
          paymentId={selectedPaymentForVoucher.id}
          userId={selectedPaymentForVoucher.user_id}
        />
      )}
    </Layout>
  )
}

export default PaymentsPage
