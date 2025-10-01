'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { PaymentService, PaymentStats } from '@/lib/payments'
import { User, Payment } from '@/lib/database.types'
import { DollarSign, Eye, TrendingUp, Calendar } from 'lucide-react'
import Card from './ui/Card'
import Button from './ui/Button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface BorrowerData {
  user: User
  payments: Payment[]
  stats: PaymentStats
}

const SimpleLenderDashboard: React.FC = () => {
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(0)}%`
  }

  const calculateTimeRemaining = (remainingPayments: number) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Bienvenida */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Bienvenido
        </h1>
        <p className="text-2xl text-gray-600">
          Estado de tus préstamos al {format(new Date(), 'dd MMMM yyyy', { locale: es })}
        </p>
      </div>

      {/* Préstamos Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {borrowersData.map((borrowerData) => (
          <Card key={borrowerData.user.id} className="border-2 border-gray-300 shadow-lg">
            <div className="p-8 space-y-6">
              {/* Nombre del Prestatario */}
              <div className="text-center pb-4 border-b-2 border-gray-200">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {borrowerData.user.name}
                </h2>
                <p className="text-xl text-gray-600">{borrowerData.user.email}</p>
              </div>

              {/* Monto Prestado */}
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <p className="text-xl font-medium text-blue-700 mb-2">
                  Monto Prestado
                </p>
                <p className="text-4xl font-bold text-blue-900">
                  {formatCurrency(borrowerData.user.loan_amount || 0)}
                </p>
              </div>

              {/* Monto Pagado */}
              <div className="bg-green-50 rounded-xl p-6 text-center">
                <p className="text-xl font-medium text-green-700 mb-2">
                  Ya ha pagado
                </p>
                <p className="text-4xl font-bold text-green-900">
                  {formatCurrency(borrowerData.stats.totalPaid)}
                </p>
                <p className="text-lg text-green-600 mt-2">
                  {borrowerData.stats.totalPayments} pagos realizados
                </p>
              </div>

              {/* Progreso */}
              <div className="bg-purple-50 rounded-xl p-6">
                <p className="text-xl font-medium text-purple-700 mb-3 text-center">
                  Progreso Completado
                </p>
                <div className="relative">
                  <div className="w-full h-8 bg-purple-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, borrowerData.stats.progressPercentage)}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-4xl font-bold text-purple-900 mt-3">
                    {formatPercentage(borrowerData.stats.progressPercentage)}
                  </p>
                </div>
              </div>

              {/* Tiempo Restante */}
              <div className="bg-orange-50 rounded-xl p-6 text-center">
                <p className="text-xl font-medium text-orange-700 mb-2">
                  Tiempo Estimado Restante
                </p>
                <p className="text-3xl font-bold text-orange-900">
                  {calculateTimeRemaining(borrowerData.stats.minimumPaymentsRemaining)}
                </p>
                <p className="text-lg text-orange-600 mt-2">
                  {borrowerData.stats.minimumPaymentsRemaining} pagos mínimos restantes
                </p>
              </div>

              {/* Estado */}
              <div className={`rounded-xl p-6 text-center ${
                borrowerData.stats.paymentStatus === 'en_mora' ? 'bg-red-50' :
                borrowerData.stats.paymentStatus === 'pendiente' ? 'bg-yellow-50' :
                borrowerData.stats.paymentStatus === 'adelantado' ? 'bg-green-50' :
                'bg-blue-50'
              }`}>
                <p className="text-xl font-medium mb-2" style={{
                  color: borrowerData.stats.paymentStatus === 'en_mora' ? '#991b1b' :
                         borrowerData.stats.paymentStatus === 'pendiente' ? '#92400e' :
                         borrowerData.stats.paymentStatus === 'adelantado' ? '#166534' :
                         '#1e40af'
                }}>
                  Estado Actual
                </p>
                <p className="text-3xl font-bold" style={{
                  color: borrowerData.stats.paymentStatus === 'en_mora' ? '#991b1b' :
                         borrowerData.stats.paymentStatus === 'pendiente' ? '#92400e' :
                         borrowerData.stats.paymentStatus === 'adelantado' ? '#166534' :
                         '#1e40af'
                }}>
                  {borrowerData.stats.paymentStatus === 'en_mora' && '⚠️ En Mora'}
                  {borrowerData.stats.paymentStatus === 'pendiente' && '⏰ Pago Pendiente'}
                  {borrowerData.stats.paymentStatus === 'adelantado' && '🚀 Adelantado'}
                  {borrowerData.stats.paymentStatus === 'al_dia' && '✓ Al Día'}
                </p>
              </div>

              {/* Botón Ver Pagos */}
              <Button
                onClick={() => window.location.href = `/lender/payments/${borrowerData.user.id}`}
                className="w-full h-16 text-xl font-semibold flex items-center justify-center space-x-3"
              >
                <Eye size={24} />
                <span>Ver Todos los Pagos</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default SimpleLenderDashboard
