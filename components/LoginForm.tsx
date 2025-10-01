'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { DollarSign, Eye, EyeOff } from 'lucide-react'
import Button from './ui/Button'
import Input from './ui/Input'
import Card from './ui/Card'
import toast from 'react-hot-toast'

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    
    try {
      const success = await login(email, password)
      
      if (success) {
        toast.success('¡Bienvenido!')
      } else {
        toast.error('Credenciales incorrectas')
      }
    } catch (error) {
      toast.error('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
            <DollarSign className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Gestor de Préstamos
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Inicia sesión para gestionar tus pagos
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
            
            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              Iniciar Sesión
            </Button>
          </form>
        </Card>

        {/* Demo Accounts Info */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="text-center">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Cuentas de demostración
            </h3>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>Prestamista:</strong> prestamista@gmail.com</p>
              <p><strong>Samuel Calderon:</strong> sfernandocalderon@gmail.com</p>
              <p><strong>Ingrid Calderon:</strong> abax07@gmail.com</p>
              <p className="mt-2 italic">Contraseña inicial para todos: password123</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default LoginForm
