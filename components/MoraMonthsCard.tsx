'use client'

import React from 'react'
import Card from './ui/Card'
import { Payment, User } from '@/lib/database.types'
import { AuthUser } from '@/lib/auth'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface MoraMonthsCardProps {
  user: User
  payments: Payment[]
}

const MoraMonthsCard: React.FC<MoraMonthsCardProps> = ({ user, payments }) => {
  const getMoraMonths = () => {
    if (!user.loan_start_date) return []

    const loanStartDate = new Date(user.loan_start_date)
    const now = new Date()
    const loanStartMonth = loanStartDate.getMonth()
    const loanStartYear = loanStartDate.getFullYear()
    const nowMonth = now.getMonth()
    const nowYear = now.getFullYear()
    
    const moraMonths: Array<{ month: string; year: number; monthNumber: number }> = []
    
    // Determine first payment month (September if loan started in August)
    const firstPaymentMonth = loanStartMonth === 7 ? 8 : loanStartMonth + 1 // August = 7, September = 8
    const firstPaymentYear = firstPaymentMonth > 11 ? loanStartYear + 1 : loanStartYear
    const actualFirstPaymentMonth = firstPaymentMonth > 11 ? 0 : firstPaymentMonth
    
    // Check each month from first payment month to current month (exclusive)
    for (let year = firstPaymentYear; year <= nowYear; year++) {
      const startMonth = year === firstPaymentYear ? actualFirstPaymentMonth : 0
      const endMonth = year === nowYear ? nowMonth - 1 : 11
      
      for (let month = startMonth; month <= endMonth; month++) {
        const monthPayments = payments.filter(payment => {
          const paymentDate = new Date(payment.payment_date)
          return paymentDate.getMonth() === month && paymentDate.getFullYear() === year
        })
        
        const hasMinimumPayment = monthPayments.some(payment => payment.payment_type === 'minimum')
        
        if (!hasMinimumPayment) {
          const monthName = format(new Date(year, month, 1), 'MMMM yyyy', { locale: es })
          moraMonths.push({
            month: monthName,
            year,
            monthNumber: month
          })
        }
      }
    }
    
    return moraMonths
  }

  const moraMonths = getMoraMonths()

  // Debug logs
  console.log('MoraMonthsCard Debug:', {
    user: user.name,
    loanStartDate: user.loan_start_date,
    paymentsCount: payments.length,
    moraMonthsCount: moraMonths.length,
    moraMonths: moraMonths
  })

  return (
    <Card className={moraMonths.length > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            moraMonths.length > 0 ? "bg-red-100" : "bg-green-100"
          }`}>
            <span className={`text-lg ${
              moraMonths.length > 0 ? "text-red-600" : "text-green-600"
            }`}>
              {moraMonths.length > 0 ? "⚠️" : "✅"}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold mb-2 ${
            moraMonths.length > 0 ? "text-red-800" : "text-green-800"
          }`}>
            {moraMonths.length > 0 ? "Meses en Mora" : "Estado de Pagos"}
          </h3>
          
          {moraMonths.length > 0 ? (
            <>
              <p className="text-sm text-red-700 mb-3">
                Los siguientes meses no se ha realizado el pago mínimo:
              </p>
              <div className="space-y-1">
                {moraMonths.map((moraMonth, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-800 font-medium">
                      {moraMonth.month}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-2 bg-red-100 rounded-md">
                <p className="text-xs text-red-700">
                  <strong>Total de meses en mora:</strong> {moraMonths.length}
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-green-700 mb-3">
                ¡Excelente! Todos los meses han sido pagados correctamente.
              </p>
              <div className="mt-3 p-2 bg-green-100 rounded-md">
                <p className="text-xs text-green-700">
                  <strong>Estado:</strong> Al día con los pagos
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

export default MoraMonthsCard
