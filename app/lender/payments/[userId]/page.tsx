'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import { PaymentService, PaymentStats } from '@/lib/payments'
import { Payment, User } from '@/lib/database.types'
import { supabase } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowLeft, Eye, Search, Filter } from 'lucide-react'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ViewVoucherModal from '@/components/ViewVoucherModal'
import MoraMonthsCard from '@/components/MoraMonthsCard'
import toast from 'react-hot-toast'

const LenderPaymentsPage: React.FC = () => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string
  
  const [borrower, setBorrower] = useState<User | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [selectedVoucher, setSelectedVoucher] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [stats, setStats] = useState<PaymentStats | null>(null)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'lender')) {
      router.push('/dashboard')
      return
    }

    if (user && user.role === 'lender') {
      loadBorrowerData()
    }
  }, [user, loading, router, userId])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, dateFilter])

  const loadBorrowerData = async () => {
    try {
      // Get borrower info
      const { data: borrowerData, error: borrowerError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (borrowerError || !borrowerData) {
        toast.error('Prestatario no encontrado')
        router.push('/dashboard')
        return
      }

      setBorrower(borrowerData)

      // Get payments
      const userPayments = await PaymentService.getPaymentsByUserId(userId)
      setPayments(userPayments)

      // Calculate stats
      const calculatedStats = await PaymentService.calculateStats(borrowerData, userPayments)
      setStats(calculatedStats)
    } catch (error) {
      console.error('Error loading borrower data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoadingData(false)
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

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`
  }

  const getTotalAmount = () => {
    return filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  if (!user || user.role !== 'lender' || !borrower) {
    return null
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>Volver al Dashboard</span>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pagos de {borrower.name}
            </h1>
            <p className="text-sm text-gray-500">{borrower.email}</p>
          </div>
        </div>

        {/* Desglose Completo */}
        {stats && (
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Loan Amount */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Monto del Préstamo</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(borrower.loan_amount || 0)}
                </p>
              </div>

              {/* Total Paid */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Pagado</p>
                <p className="text-xl font-semibold text-success-600">
                  {formatCurrency(stats.totalPaid)}
                </p>
              </div>

              {/* Remaining */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Pendiente</p>
                <p className="text-xl font-semibold text-warning-600">
                  {formatCurrency(stats.remainingAmount)}
                </p>
              </div>

              {/* Progress */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Progreso</p>
                <p className="text-xl font-semibold text-primary-600">
                  {formatPercentage(stats.progressPercentage)}
                </p>
              </div>

              {/* Expected Time Remaining */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Tiempo Esperado</p>
                <p className="text-xl font-semibold text-indigo-600">
                  {(() => {
                    const monthlyPayment = borrower.monthly_payment || 0
                    if (monthlyPayment <= 0) return 'N/A'
                    
                    const remainingPayments = Math.ceil(stats.remainingAmount / monthlyPayment)
                    const years = Math.floor(remainingPayments / 12)
                    const months = remainingPayments % 12
                    
                    if (years === 0) return `${months} ${months === 1 ? 'mes' : 'meses'}`
                    if (months === 0) return `${years} ${years === 1 ? 'año' : 'años'}`
                    return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`
                  })()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.minimumPaymentsRemaining} pagos restantes
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progreso del préstamo</span>
                <span>{stats.totalPayments} pagos realizados</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    stats.isOnTrack ? 'bg-success-500' : 'bg-warning-500'
                  }`}
                  style={{ width: `${Math.min(100, stats.progressPercentage)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span className={`font-medium ${
                  stats.paymentStatus === 'en_mora' ? 'text-red-600' :
                  stats.paymentStatus === 'pendiente' ? 'text-yellow-600' :
                  stats.paymentStatus === 'adelantado' ? 'text-green-600' :
                  'text-blue-600'
                }`}>
                  {stats.paymentStatus === 'en_mora' && '⚠️ En Mora'}
                  {stats.paymentStatus === 'pendiente' && '⏰ Pendiente'}
                  {stats.paymentStatus === 'adelantado' && '🚀 Adelantado'}
                  {stats.paymentStatus === 'al_dia' && '✓ Al Día'}
                </span>
                <span>{stats.minimumPaymentsRemaining} pagos mínimos restantes</span>
              </div>
            </div>
          </Card>
        )}

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
        <MoraMonthsCard user={borrower} payments={payments} />

        {/* Payments List */}
        <Card>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">
                {payments.length === 0 
                  ? 'No hay pagos registrados para este prestatario' 
                  : 'No se encontraron pagos con los filtros aplicados'
                }
              </p>
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
                          <span className="text-gray-400">Sin voucher</span>
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

      {/* View Voucher Modal */}
      {selectedVoucher && (
        <ViewVoucherModal
          isOpen={!!selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
          voucherUrl={selectedVoucher}
        />
      )}
    </Layout>
  )
}

export default LenderPaymentsPage
