'use client'

import React, { useState, useEffect } from 'react'
import { PaymentService, PaymentStats } from '@/lib/payments'
import { User, Payment } from '@/lib/database.types'
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react'
import Card from './ui/Card'

interface DashboardStatsProps {
  user: User
  payments: Payment[]
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ user, payments }) => {
  const [stats, setStats] = useState<PaymentStats | null>(null)

  useEffect(() => {
    const calculateStats = async () => {
      const calculatedStats = await PaymentService.calculateStats(user, payments)
      setStats(calculatedStats)
    }

    calculateStats()
  }, [user, payments])

  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    )
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

  const calculateTimeRemaining = (remainingPayments: number) => {
    const years = Math.floor(remainingPayments / 12)
    const months = remainingPayments % 12
    
    if (years === 0) {
      return `${months} mes${months !== 1 ? 'es' : ''}`
    } else if (months === 0) {
      return `${years} año${years !== 1 ? 's' : ''}`
    } else {
      return `${years} año${years !== 1 ? 's' : ''} y ${months} mes${months !== 1 ? 'es' : ''}`
    }
  }

  return (
    <div className="space-y-6">
      {/* Primera sección: Total Pagado y Pendiente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Paid */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-success-500 text-white">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Pagado</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.totalPaid)}
              </p>
            </div>
          </div>
        </Card>

        {/* Remaining Amount */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-warning-500 text-white">
                <TrendingDown size={24} />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pendiente</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.remainingAmount)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Carta de Progreso - Separada */}
      <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary-500 text-white">
                <TrendingUp size={32} />
              </div>
            </div>
            <div className="ml-6">
              <p className="text-lg font-medium text-primary-700">Progreso del Préstamo</p>
              <p className="text-3xl font-bold text-primary-700">
                {formatPercentage(stats.progressPercentage)}
              </p>
              <p className="text-sm text-primary-600 mt-1">
                {stats.totalPayments} pagos realizados
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-32 h-4 bg-primary-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, stats.progressPercentage)}%` }}
              ></div>
            </div>
            <p className="text-xs text-primary-600 mt-2">
              {formatCurrency(stats.totalPaid)} de {formatCurrency(stats.totalPaid + stats.remainingAmount)}
            </p>
          </div>
        </div>
      </Card>

      {/* Tercera sección: Pagos Mínimos Restantes, Tiempo Restante, Estado del Mes y Pagos Extra */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Minimum Payments Remaining */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                <Calendar size={24} />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pagos Mínimos Restantes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.minimumPaymentsRemaining}
              </p>
              <p className="text-xs text-gray-500 mt-1">
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
              </p>
            </div>
          </div>
        </Card>

        {/* Time Remaining */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                <Calendar size={24} />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tiempo Restante</p>
              <p className="text-lg font-semibold text-gray-900">
                {calculateTimeRemaining(stats.minimumPaymentsRemaining)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.minimumPaymentsRemaining} pagos
              </p>
            </div>
          </div>
        </Card>

        {/* Current Month Status */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                <Calendar size={24} />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Estado del Mes</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats.currentMonthStatus === 'pagado' && 'Pagado'}
                {stats.currentMonthStatus === 'pendiente' && 'Pendiente'}
                {stats.currentMonthStatus === 'en_mora' && 'En Mora'}
                {stats.currentMonthStatus === 'adelantado' && 'Adelantado'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.monthlyProgress.toFixed(1)}% del mes
              </p>
            </div>
          </div>
        </Card>

        {/* Extra Payments */}
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                <TrendingUp size={24} />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pagos Extra</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.extraPayments)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.extraPayments > 0 ? (
                  <span className="text-success-600">¡Adelantado!</span>
                ) : (
                  <span className="text-gray-600">Sin extras</span>
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default DashboardStats
