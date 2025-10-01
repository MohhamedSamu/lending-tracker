'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import DashboardStats from '@/components/DashboardStats'
import PaymentChart from '@/components/PaymentChart'
import RecentPayments from '@/components/RecentPayments'
import LenderDashboard from '@/components/LenderDashboard'
import SimpleLenderDashboard from '@/components/SimpleLenderDashboard'
import { PaymentService } from '@/lib/payments'
import { Payment } from '@/lib/database.types'

const DashboardPage: React.FC = () => {
  const { user, userDetails, loading } = useAuth()
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
      return
    }

    if (user && user.role === 'borrower') {
      loadPayments()
    } else {
      setLoadingPayments(false)
    }
  }, [user, loading, router])

  const loadPayments = async () => {
    if (!user) return
    
    try {
      const userPayments = await PaymentService.getPaymentsByUserId(user.id)
      setPayments(userPayments)
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoadingPayments(false)
    }
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

  if (!user || !userDetails) {
    return null
  }

  // Lender sees simplified dashboard
  if (user.role === 'lender') {
    return (
      <Layout>
        <SimpleLenderDashboard />
      </Layout>
    )
  }

  // Borrower sees their own data
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Mi Dashboard
          </h1>
          <div className="text-sm text-gray-500">
            Último acceso: {new Date().toLocaleDateString('es-ES')}
          </div>
        </div>

        <DashboardStats user={userDetails} payments={payments} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PaymentChart payments={payments} user={userDetails} />
          <RecentPayments payments={payments} onPaymentUpdate={loadPayments} />
        </div>
      </div>
    </Layout>
  )
}

export default DashboardPage
