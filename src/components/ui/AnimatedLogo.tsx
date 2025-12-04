'use client'

import { cn } from '@/lib/utils'

interface AnimatedLogoProps {
  className?: string
}

export function AnimatedLogo({ className }: AnimatedLogoProps) {
  return (
    <div 
      className={cn("w-full h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400", className)}
      style={{
        maskImage: 'url(/BPOC.IO-LOGO-IDEA.svg)',
        WebkitMaskImage: 'url(/BPOC.IO-LOGO-IDEA.svg)',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        backgroundSize: '200% 200%',
        animation: 'gradient-shift 3s ease infinite'
      }}
    />
  )
}

