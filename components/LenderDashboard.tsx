'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PaymentService, PaymentStats } from '@/lib/payments'
import { User, Payment } from '@/lib/database.types'
import { Users, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import Card from './ui/Card'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface BorrowerData {
  user: User
  payments: Payment[]
  stats: PaymentStats
}

const LenderDashboard: React.FC = () => {
  const [borrowersData, setBorrowersData] = useState<BorrowerData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBorrowersData()
  }, [])

  const loadBorrowersData = async () => {
    try {
      // Get all borrowers
      const { data: borrowers, error: borrowersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'borrower')

      if (borrowersError) throw borrowersError

      // Get payments for each borrower and calculate stats
      const borrowersWithData = await Promise.all(
        borrowers.map(async (borrower) => {
          const payments = await PaymentService.getPaymentsByUserId(borrower.id)
          const stats = await PaymentService.calculateStats(borrower, payments)
          
          return {
            user: borrower,
            payments,
            stats
          }
        })
      )

      setBorrowersData(borrowersWithData)
    } catch (error) {
      console.error('Error loading borrowers data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`
  }

  const calculateExpectedTimeRemaining = (stats: PaymentStats, monthlyPayment: number) => {
    if (monthlyPayment <= 0) return 'N/A'
    
    const remainingPayments = Math.ceil(stats.remainingAmount / monthlyPayment)
    const years = Math.floor(remainingPayments / 12)
    const months = remainingPayments % 12
    
    if (years === 0) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`
    } else if (months === 0) {
      return `${years} ${years === 1 ? 'año' : 'años'}`
    } else {
      return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`
    }
  }

  const getTotalStats = () => {
    return borrowersData.reduce(
      (acc, borrower) => ({
        totalLoaned: acc.totalLoaned + (borrower.user.loan_amount || 0),
        totalPaid: acc.totalPaid + borrower.stats.totalPaid,
        totalRemaining: acc.totalRemaining + borrower.stats.remainingAmount,
        totalPayments: acc.totalPayments + borrower.stats.totalPayments
      }),
      { totalLoaned: 0, totalPaid: 0, totalRemaining: 0, totalPayments: 0 }
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const totalStats = getTotalStats()
  const overallProgress = totalStats.totalLoaned > 0 
    ? (totalStats.totalPaid / totalStats.totalLoaned) * 100 
    : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard del Prestamista
        </h1>
        <div className="text-sm text-gray-500">
          Último acceso: {format(new Date(), 'dd MMM yyyy', { locale: es })}
        </div>
      </div>

      {/* Overall Stats - Layout 3+2 */}
      <div className="space-y-6">
        {/* Primera fila: 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Prestado</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totalStats.totalLoaned)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-success-500 text-white">
                  <TrendingUp size={24} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Recibido</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totalStats.totalPaid)}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-warning-500 text-white">
                  <Calendar size={24} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pendiente</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(totalStats.totalRemaining)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Segunda fila: 2 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                  <Users size={24} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Progreso General</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatPercentage(overallProgress)}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, overallProgress)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Calendar size={24} />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tiempo Máximo Esperado</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(() => {
                    if (borrowersData.length === 0) return 'N/A'
                    
                    // Calcular el tiempo esperado para cada prestatario
                    const borrowerTimes = borrowersData.map(borrower => {
                      const monthlyPayment = borrower.user.monthly_payment || 0
                      if (monthlyPayment <= 0) return 0
                      
                      const remainingPayments = Math.ceil(borrower.stats.remainingAmount / monthlyPayment)
                      return remainingPayments
                    })
                    
                    // Encontrar el máximo tiempo (más pagos restantes)
                    const maxRemainingPayments = Math.max(...borrowerTimes)
                    
                    if (maxRemainingPayments === 0) return 'N/A'
                    
                    const years = Math.floor(maxRemainingPayments / 12)
                    const months = maxRemainingPayments % 12
                    
                    if (years === 0) return `${months} ${months === 1 ? 'mes' : 'meses'}`
                    if (months === 0) return `${years} ${years === 1 ? 'año' : 'años'}`
                    return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`
                  })()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Del préstamo que más tardará
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Borrowers Details */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Estado por Prestatario</h2>
        
        {borrowersData.map((borrowerData) => (
          <Card key={borrowerData.user.id}>
            <Card.Header>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {borrowerData.user.name}
                  </h3>
                  <p className="text-sm text-gray-500">{borrowerData.user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Fecha de inicio</p>
                  <p className="font-medium text-gray-900">
                    {borrowerData.user.loan_start_date 
                      ? format(new Date(borrowerData.user.loan_start_date), 'dd MMM yyyy', { locale: es })
                      : 'No definida'
                    }
                  </p>
                </div>
              </div>
            </Card.Header>
            
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Loan Amount */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Monto del Préstamo</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(borrowerData.user.loan_amount || 0)}
                  </p>
                </div>

                {/* Total Paid */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Total Pagado</p>
                  <p className="text-xl font-semibold text-success-600">
                    {formatCurrency(borrowerData.stats.totalPaid)}
                  </p>
                </div>

                {/* Remaining */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Pendiente</p>
                  <p className="text-xl font-semibold text-warning-600">
                    {formatCurrency(borrowerData.stats.remainingAmount)}
                  </p>
                </div>

                {/* Progress */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Progreso</p>
                  <p className="text-xl font-semibold text-primary-600">
                    {formatPercentage(borrowerData.stats.progressPercentage)}
                  </p>
                </div>

                {/* Expected Time Remaining */}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-500">Tiempo Esperado</p>
                  <p className="text-xl font-semibold text-indigo-600">
                    {calculateExpectedTimeRemaining(borrowerData.stats, borrowerData.user.monthly_payment || 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {borrowerData.stats.minimumPaymentsRemaining} pagos restantes
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progreso del préstamo</span>
                  <span>{borrowerData.stats.totalPayments} pagos realizados</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      borrowerData.stats.isOnTrack ? 'bg-success-500' : 'bg-warning-500'
                    }`}
                    style={{ width: `${Math.min(100, borrowerData.stats.progressPercentage)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span className={`font-medium ${
                    borrowerData.stats.paymentStatus === 'en_mora' ? 'text-red-600' :
                    borrowerData.stats.paymentStatus === 'pendiente' ? 'text-yellow-600' :
                    borrowerData.stats.paymentStatus === 'adelantado' ? 'text-green-600' :
                    'text-blue-600'
                  }`}>
                    {borrowerData.stats.paymentStatus === 'en_mora' && '⚠️ En Mora'}
                    {borrowerData.stats.paymentStatus === 'pendiente' && '⏰ Pendiente'}
                    {borrowerData.stats.paymentStatus === 'adelantado' && '🚀 Adelantado'}
                    {borrowerData.stats.paymentStatus === 'al_dia' && '✓ Al Día'}
                  </span>
                  <span>{borrowerData.stats.minimumPaymentsRemaining} pagos mínimos restantes</span>
                </div>
              </div>

              {/* Recent Payments */}
              {borrowerData.payments.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Últimos 3 pagos</h4>
                    <a
                      href={`/lender/payments/${borrowerData.user.id}`}
                      className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                    >
                      Ver todos los pagos →
                    </a>
                  </div>
                  <div className="space-y-2">
                    {borrowerData.payments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {format(new Date(payment.payment_date), 'dd MMM yyyy', { locale: es })}
                        </span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default LenderDashboard
