'use client'

import React from 'react'
import { useAuth } from '@/context/AuthContext'
import { usePathname } from 'next/navigation'
import { LogOut, Settings, DollarSign, BarChart3 } from 'lucide-react'
import Button from './ui/Button'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, userDetails, logout } = useAuth()
  const pathname = usePathname()

  if (!user) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-primary-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Gestor de Préstamos
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{userDetails?.name || user.name}</span>
                <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs">
                  {user.role === 'lender' ? 'Prestamista' : 'Prestatario'}
                </span>
              </div>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <LogOut size={16} />
                <span>Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <a
              href="/dashboard"
              className={`border-b-2 inline-flex items-center px-1 pt-1 pb-4 text-sm font-medium ${
                pathname === '/dashboard' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 size={16} className="mr-2" />
              Dashboard
            </a>
            
            {user.role === 'borrower' && (
              <a
                href="/payments"
                className={`border-b-2 inline-flex items-center px-1 pt-1 pb-4 text-sm font-medium ${
                  pathname === '/payments' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign size={16} className="mr-2" />
                Mis Pagos
              </a>
            )}
            
            {user.role === 'lender' && (
              <a
                href="/lender/technical"
                className={`border-b-2 inline-flex items-center px-1 pt-1 pb-4 text-sm font-medium ${
                  pathname === '/lender/technical' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 size={16} className="mr-2" />
                Vista Técnica
              </a>
            )}
            
            <a
              href="/settings"
              className={`border-b-2 inline-flex items-center px-1 pt-1 pb-4 text-sm font-medium ${
                pathname === '/settings' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings size={16} className="mr-2" />
              Configuración
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default Layout
