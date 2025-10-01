'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Payment, User } from '@/lib/database.types'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import Card from './ui/Card'

interface PaymentChartProps {
  payments: Payment[]
  user: User
}

const PaymentChart: React.FC<PaymentChartProps> = ({ payments, user }) => {
  // Group payments by month first
  const monthlyPayments = payments.reduce((acc, payment) => {
    const monthKey = format(parseISO(payment.payment_date), 'yyyy-MM')
    const monthName = format(parseISO(payment.payment_date), 'MMM yyyy', { locale: es })
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthName,
        totalAmount: 0,
        paymentCount: 0,
        date: parseISO(payment.payment_date)
      }
    }
    
    acc[monthKey].totalAmount += payment.amount
    acc[monthKey].paymentCount += 1
    
    return acc
  }, {} as Record<string, { month: string; totalAmount: number; paymentCount: number; date: Date }>)

  // Convert to array and sort by date
  const chartData = Object.values(monthlyPayments)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .reduce((acc, monthData, index) => {
      const cumulativeAmount = acc.length > 0 ? acc[acc.length - 1].cumulative + monthData.totalAmount : monthData.totalAmount
      
      acc.push({
        date: monthData.month,
        amount: monthData.totalAmount,
        cumulative: cumulativeAmount,
        paymentCount: monthData.paymentCount,
        month: format(monthData.date, 'yyyy-MM')
      })
      
      return acc
    }, [] as Array<{ date: string; amount: number; cumulative: number; paymentCount: number; month: string }>)

  // Group payments by month for bar chart
  const monthlyData = payments.reduce((acc, payment) => {
    const month = format(parseISO(payment.payment_date), 'MMM yyyy', { locale: es })
    if (!acc[month]) {
      acc[month] = 0
    }
    acc[month] += payment.amount
    return acc
  }, {} as Record<string, number>)

  const barChartData = Object.entries(monthlyData).map(([month, amount]) => ({
    month,
    amount
  }))

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (payments.length === 0) {
    return (
      <Card>
        <Card.Header>
          <h3 className="text-lg font-semibold text-gray-900">Progreso de Pagos</h3>
        </Card.Header>
        <Card.Content>
          <div className="flex items-center justify-center h-64 text-gray-500">
            <p>No hay pagos registrados aún</p>
          </div>
        </Card.Content>
      </Card>
    )
  }

  return (
    <Card>
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900">Progreso de Pagos</h3>
        <p className="text-sm text-gray-500">Evolución acumulativa de tus pagos</p>
      </Card.Header>
      <Card.Content>
        <div className="space-y-6">
          {/* Cumulative Line Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'cumulative') {
                      return [formatCurrency(value), 'Total Acumulado']
                    }
                    return [formatCurrency(value), 'Pagado en el Mes']
                  }}
                  labelFormatter={(label: string, payload: any[]) => {
                    if (payload && payload[0] && payload[0].payload) {
                      const data = payload[0].payload
                      return `${label} (${data.paymentCount} pago${data.paymentCount > 1 ? 's' : ''})`
                    }
                    return label
                  }}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulative" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Bar Chart */}
          <div className="h-48">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Pagos por Mes</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Pagado']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

export default PaymentChart
