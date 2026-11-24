'use client'

import React from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Home,
  RefreshCcw,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface PaymentResultProps {
  type: 'success' | 'cancelled' | 'error'
  title?: string
  message?: string
  actionText?: string
  actionHref?: string
}

export default function PaymentResult({
  type,
  title,
  message,
  actionText,
  actionHref = '/academy',
}: PaymentResultProps) {
  const isSuccess = type === 'success'
  const isCancelled = type === 'cancelled'

  const config = {
    success: {
      icon: <CheckCircle2 className='size-20 text-brand-gold-main' />,
      defaultTitle: 'Payment Successful!',
      defaultMessage: 'Thank you. Your payment has been confirmed.',
      bgColor: 'bg-brand-gold-main/10',
      borderColor: 'border-brand-gold-main/20',
      btnClass: 'bg-brand-gold-main text-brand-green-main hover:opacity-90',
    },
    cancelled: {
      icon: <XCircle className='size-20 text-lp-text-subtle' />,
      defaultTitle: 'Payment Cancelled',
      defaultMessage:
        'The payment process was cancelled. No charges were made to your account.',
      bgColor: 'bg-lp-bg-alt',
      borderColor: 'border-lp-border',
      btnClass:
        'bg-lp-bg-card-alt text-lp-text hover:bg-lp-border transition-colors',
    },
    error: {
      icon: <AlertCircle className='size-20 text-red-500' />,
      defaultTitle: 'Payment Failed',
      defaultMessage:
        'There was an error processing your payment. Please try again or contact support.',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      btnClass: 'bg-red-500 text-white hover:bg-red-600',
    },
  }[type]

  return (
    <div className='min-h-[70vh] flex items-center justify-center px-6 bg-lp-bg'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`max-w-xl w-full backdrop-blur-md ${config.bgColor} border ${config.borderColor} rounded-2xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden`}
      >
        {/* Decorative elements */}
        <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-gold-main to-transparent opacity-50' />

        <div className='flex justify-center mb-8'>
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              damping: 12,
              stiffness: 200,
              delay: 0.2,
            }}
          >
            {config.icon}
          </motion.div>
        </div>

        <h1 className='text-3xl md:text-4xl font-black text-lp-text-heading uppercase tracking-tight mb-4'>
          {title || config.defaultTitle}
        </h1>

        <p className='text-lp-text-muted text-lg mb-10 leading-relaxed'>
          {message || config.defaultMessage}
        </p>

        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Link
            href={actionHref}
            className={`px-8 py-4 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 group ${config.btnClass}`}
          >
            {isCancelled ? (
              <RefreshCcw className='size-5 group-hover:rotate-180 transition-transform duration-500' />
            ) : (
              <Home className='size-5' />
            )}
            {actionText || (isCancelled ? 'Try Again' : 'Return to Academy')}
          </Link>

          {!isSuccess && (
            <Link
              href='/support?topic=payment'
              className='px-8 py-4 rounded-lg font-bold uppercase tracking-wider bg-lp-bg-card text-lp-text border border-lp-border hover:bg-lp-bg-alt transition-all flex items-center justify-center gap-2'
            >
              Contact Support
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}
