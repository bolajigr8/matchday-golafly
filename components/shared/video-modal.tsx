'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { CookiebotIframe } from '@/components/shared/cookiebot-iframe'

const VIDEO_URL =
  'https://drive.google.com/file/d/1hksn2zMDmm7IqpBYuSwXFuuk5dHAEpmO/preview'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
}

export function VideoModal({ isOpen, onClose }: VideoModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm'
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <button
        onClick={onClose}
        className='absolute top-4 right-4 z-10 text-white hover:text-primary transition-colors'
        aria-label='Close video'
      >
        <X className='size-8' />
      </button>

      <div className='relative w-[90vw] max-w-[960px] aspect-video'>
        <CookiebotIframe
          consentCategory='marketing'
          src={VIDEO_URL}
          className='w-full h-full rounded-lg'
          allow='autoplay; fullscreen'
          allowFullScreen
          title='Golafly Marketing Video'
        />
      </div>
    </div>
  )
}
