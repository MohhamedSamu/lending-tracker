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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-3 sm:py-0 sm:h-16 gap-2 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 flex-shrink-0" />
              <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                Gestor de Préstamos
              </h1>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-xs sm:text-sm text-gray-600 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-0 min-w-0">
                <span className="font-medium truncate max-w-[120px] sm:max-w-none">{userDetails?.name || user.name}</span>
                <span className="sm:ml-2 px-2 py-1 bg-primary-100 text-primary-800 rounded-full text-xs whitespace-nowrap">
                  {user.role === 'lender' ? 'Prestamista' : 'Prestatario'}
                </span>
              </div>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0"
              >
                <LogOut size={14} className="sm:hidden" />
                <LogOut size={16} className="hidden sm:block" />
                <span className="text-xs sm:text-sm">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex space-x-2 sm:space-x-8 min-w-max">
            <a
              href="/dashboard"
              className={`border-b-2 inline-flex items-center px-1 pt-1 pb-3 sm:pb-4 text-xs sm:text-sm font-medium whitespace-nowrap ${
                pathname === '/dashboard' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 size={14} className="mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Inicio</span>
            </a>
            
            {user.role === 'borrower' && (
              <a
                href="/payments"
                className={`border-b-2 inline-flex items-center px-1 pt-1 pb-3 sm:pb-4 text-xs sm:text-sm font-medium whitespace-nowrap ${
                  pathname === '/payments' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DollarSign size={14} className="mr-1 sm:mr-2 flex-shrink-0" />
                Pagos
              </a>
            )}
            
            {user.role === 'lender' && (
              <a
                href="/lender/technical"
                className={`border-b-2 inline-flex items-center px-1 pt-1 pb-3 sm:pb-4 text-xs sm:text-sm font-medium whitespace-nowrap ${
                  pathname === '/lender/technical' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 size={14} className="mr-1 sm:mr-2 flex-shrink-0" />
                <span className="hidden sm:inline">Vista Técnica</span>
                <span className="sm:hidden">Técnica</span>
              </a>
            )}
            
            <a
              href="/settings"
              className={`border-b-2 inline-flex items-center px-1 pt-1 pb-3 sm:pb-4 text-xs sm:text-sm font-medium whitespace-nowrap ${
                pathname === '/settings' 
                  ? 'border-primary-500 text-primary-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings size={14} className="mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Configuración</span>
              <span className="sm:hidden">Config</span>
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
