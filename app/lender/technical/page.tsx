'use client'

import React, { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import LenderDashboard from '@/components/LenderDashboard'

const TechnicalViewPage: React.FC = () => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'lender')) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    )
  }

  if (!user || user.role !== 'lender') {
    return null
  }

  return (
    <Layout>
      <LenderDashboard />
    </Layout>
  )
}

export default TechnicalViewPage
