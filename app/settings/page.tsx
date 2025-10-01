'use client'

import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth'
import Layout from '@/components/Layout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Lock, User, Save } from 'lucide-react'
import toast from 'react-hot-toast'

const SettingsPage: React.FC = () => {
  const { user, userDetails, loading, refreshUserDetails } = useAuth()
  const router = useRouter()
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [changingPassword, setChangingPassword] = useState(false)

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las nuevas contraseñas no coinciden')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    setChangingPassword(true)

    try {
      const success = await AuthService.changePassword(
        user.id,
        passwordForm.currentPassword,
        passwordForm.newPassword
      )

      if (success) {
        toast.success('Contraseña cambiada exitosamente')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        toast.error('Contraseña actual incorrecta')
      }
    } catch (error) {
      toast.error('Error al cambiar la contraseña')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

        {/* User Information */}
        <Card>
          <Card.Header>
            <div className="flex items-center space-x-2">
              <User size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Información del Usuario</h2>
            </div>
          </Card.Header>
          <Card.Content>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <p className="mt-1 text-sm text-gray-900">{userDetails.name}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
                <p className="mt-1 text-sm text-gray-900">{userDetails.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Rol</label>
                <p className="mt-1 text-sm text-gray-900">
                  {user.role === 'lender' ? 'Prestamista' : 'Prestatario'}
                </p>
              </div>

              {user.role === 'borrower' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monto del Préstamo</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {userDetails.loan_amount ? formatCurrency(userDetails.loan_amount) : 'No definido'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pago Mensual</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {userDetails.monthly_payment ? formatCurrency(userDetails.monthly_payment) : 'No definido'}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duración del Préstamo</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {userDetails.loan_duration_months ? `${userDetails.loan_duration_months} meses` : 'No definido'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Change Password */}
        <Card>
          <Card.Header>
            <div className="flex items-center space-x-2">
              <Lock size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h2>
            </div>
          </Card.Header>
          <Card.Content>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="Contraseña Actual"
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Tu contraseña actual"
                required
              />
              
              <Input
                label="Nueva Contraseña"
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                required
                helperText="Mínimo 6 caracteres"
              />
              
              <Input
                label="Confirmar Nueva Contraseña"
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirma tu nueva contraseña"
                required
              />
              
              <Button
                type="submit"
                loading={changingPassword}
                className="flex items-center space-x-2"
              >
                <Save size={16} />
                <span>Cambiar Contraseña</span>
              </Button>
            </form>
          </Card.Content>
        </Card>
      </div>
    </Layout>
  )
}

export default SettingsPage
