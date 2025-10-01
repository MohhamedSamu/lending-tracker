import { supabase, createServerClient } from './supabase'
import { Payment, NewPayment, User } from './database.types'
import { differenceInMonths, addMonths, format, differenceInDays, startOfMonth, endOfMonth, isWithinInterval, addDays } from 'date-fns'

export interface PaymentStats {
  totalPaid: number
  remainingAmount: number
  progressPercentage: number
  monthsElapsed: number
  monthsRemaining: number
  expectedEndDate: string
  isOnTrack: boolean
  totalPayments: number
  paymentStatus: 'al_dia' | 'pendiente' | 'en_mora' | 'adelantado'
  currentMonthStatus: 'pagado' | 'pendiente' | 'en_mora' | 'adelantado'
  nextPaymentDue: string
  daysUntilDue: number
  monthlyProgress: number
  // New fields for minimum payment calculations
  totalMinimumPayments: number
  minimumPaymentsMade: number
  minimumPaymentsRemaining: number
  extraPayments: number
  isAheadOfSchedule: boolean
}

export class PaymentService {
  static async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', userId)
        .order('payment_date', { ascending: false })

      return error ? [] : payments
    } catch (error) {
      console.error('Get payments error:', error)
      return []
    }
  }

  static async addPayment(payment: NewPayment): Promise<Payment | null> {
    try {
      const { data, error } = await (supabase
        .from('payments') as any)
        .insert(payment)
        .select()
        .single()

      return error ? null : data
    } catch (error) {
      console.error('Add payment error:', error)
      return null
    }
  }

  static async updatePayment(paymentId: string, updates: Partial<Payment>): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('payments') as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)

      return !error
    } catch (error) {
      console.error('Update payment error:', error)
      return false
    }
  }

  static async deletePayment(paymentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId)

      return !error
    } catch (error) {
      console.error('Delete payment error:', error)
      return false
    }
  }

  static async calculateStats(user: User, payments: Payment[]): Promise<PaymentStats> {
    const loanAmount = user.loan_amount || 0
    const monthlyPayment = user.monthly_payment || 0
    const loanStartDate = user.loan_start_date ? new Date(user.loan_start_date) : new Date()
    const loanDurationMonths = user.loan_duration_months || 0

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const remainingAmount = Math.max(0, loanAmount - totalPaid)
    const progressPercentage = loanAmount > 0 ? (totalPaid / loanAmount) * 100 : 0

    const now = new Date()
    const monthsElapsed = differenceInMonths(now, loanStartDate)
    
    // Calculate months remaining based on minimum payments instead of dates
    const totalMinimumPayments = Math.ceil(loanAmount / monthlyPayment)
    
    // Calculate minimum payments and extra payments using payment_type flag
    const minimumPaymentsMade = payments.filter(payment => payment.payment_type === 'minimum').length
    const extraPayments = payments
      .filter(payment => payment.payment_type === 'extra')
      .reduce((sum, payment) => sum + payment.amount, 0)
    
    // Calculate remaining minimum payments based on remaining amount
    const minimumPaymentsRemaining = monthlyPayment > 0 ? Math.ceil(remainingAmount / monthlyPayment) : 0
    const monthsRemaining = minimumPaymentsRemaining
    const isAheadOfSchedule = extraPayments > 0
    
    // Calculate expected end date based on minimum payments
    const expectedEndDate = addMonths(loanStartDate, totalMinimumPayments)
    
    // Calculate if on track (comparing actual vs expected payments)
    const expectedPaidByNow = Math.min(monthsElapsed * monthlyPayment, loanAmount)
    const isOnTrack = totalPaid >= expectedPaidByNow * 0.95 // 5% tolerance

    // Advanced payment status logic
    const nowMonth = now.getMonth()
    const nowYear = now.getFullYear()
    const currentDay = now.getDate()
    
    // Payment due dates: 25th to 30th of each month
    const paymentDueStart = new Date(nowYear, nowMonth, 25)
    const paymentDueEnd = new Date(nowYear, nowMonth, 30)
    
    // Check if we're in the payment period
    const isInPaymentPeriod = currentDay >= 25 && currentDay <= 30
    
    // Get payments for current month
    const currentMonthPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.payment_date)
      return paymentDate.getMonth() === nowMonth && paymentDate.getFullYear() === nowYear
    })
    
    const currentMonthTotalAmount = currentMonthPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const monthlyProgress = monthlyPayment > 0 ? (currentMonthTotalAmount / monthlyPayment) * 100 : 0
    
    // Check if current month has minimum payment
    const currentMonthHasMinimum = currentMonthPayments.some(payment => payment.payment_type === 'minimum')
    
    // Check historical payment status (months since first payment month)
    // First payment month is September (month 8) if loan started in August (month 7)
    const loanStartMonth = loanStartDate.getMonth()
    const loanStartYear = loanStartDate.getFullYear()
    
    // Determine first payment month (September if loan started in August)
    const firstPaymentMonth = loanStartMonth === 7 ? 8 : loanStartMonth + 1 // August = 7, September = 8
    const firstPaymentYear = firstPaymentMonth > 11 ? loanStartYear + 1 : loanStartYear
    const actualFirstPaymentMonth = firstPaymentMonth > 11 ? 0 : firstPaymentMonth
    
    let monthsInMora = 0
    let allPreviousMonthsPaid = true
    
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
          monthsInMora++
          allPreviousMonthsPaid = false
        }
      }
    }
    
    // Determine current month status
    let currentMonthStatus: 'pagado' | 'pendiente' | 'en_mora' | 'adelantado' = 'pendiente'
    
    if (currentMonthHasMinimum) {
      currentMonthStatus = 'pagado'
    } else if (currentMonthTotalAmount > 0 && currentMonthTotalAmount < monthlyPayment) {
      currentMonthStatus = 'adelantado'
    } else if (isInPaymentPeriod) {
      currentMonthStatus = 'pendiente'
    } else if (currentDay > 30) {
      currentMonthStatus = 'en_mora'
    }
    
    // Determine overall payment status
    let paymentStatus: 'al_dia' | 'pendiente' | 'en_mora' | 'adelantado' = 'al_dia'
    
    if (monthsInMora > 0) {
      paymentStatus = 'en_mora'
    } else if (currentMonthStatus === 'pendiente' && !isInPaymentPeriod) {
      paymentStatus = 'al_dia' // Al día si no ha llegado la fecha de vencimiento
    } else if (currentMonthStatus === 'pendiente' && isInPaymentPeriod) {
      paymentStatus = 'pendiente'
    } else if (currentMonthStatus === 'en_mora') {
      paymentStatus = 'en_mora'
    } else if (extraPayments > 0) {
      paymentStatus = 'adelantado'
    }
    
    // Calculate next payment due date
    const nextPaymentDue = format(paymentDueStart, 'yyyy-MM-dd')
    const daysUntilDue = Math.max(0, differenceInDays(paymentDueStart, now))

    return {
      totalPaid,
      remainingAmount,
      progressPercentage: Math.min(100, progressPercentage),
      monthsElapsed: Math.max(0, monthsElapsed),
      monthsRemaining,
      expectedEndDate: format(expectedEndDate, 'yyyy-MM-dd'),
      isOnTrack,
      totalPayments: payments.length,
      paymentStatus,
      currentMonthStatus,
      nextPaymentDue,
      daysUntilDue,
      monthlyProgress: Math.min(100, monthlyProgress),
      // New fields for minimum payment calculations
      totalMinimumPayments,
      minimumPaymentsMade,
      minimumPaymentsRemaining,
      extraPayments,
      isAheadOfSchedule
    }
  }

  static async uploadVoucher(file: File, paymentId: string, userId: string): Promise<string | null> {
    console.log('🚀 Starting upload process...')
    console.log('File:', file.name, 'Payment ID:', paymentId, 'User ID:', userId)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${paymentId}.${fileExt}`
      const filePath = `vouchers/${fileName}`

      console.log('📁 File path:', filePath)

      // Usar cliente normal con las políticas configuradas
      console.log('📤 Uploading to Supabase Storage...')
      const { error: uploadError } = await supabase.storage
        .from('payment-vouchers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('❌ Upload error:', uploadError)
        return null
      }

      console.log('✅ Upload successful!')

      // Obtener URL pública
      const { data } = supabase.storage
        .from('payment-vouchers')
        .getPublicUrl(filePath)

      console.log('🔗 Public URL:', data.publicUrl)
      return data.publicUrl
    } catch (error) {
      console.error('💥 Upload voucher error:', error)
      return null
    }
  }
}
