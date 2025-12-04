'use client'

import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, Suspense } from 'react'
import Header from '@/components/layout/Header'
import Hero from '@/components/sections/Hero'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
  BrainIcon,
  GamepadIcon,
  Trophy,
  Users,
  Target,
  TrendingUp,
  Star,
  Quote,
  CheckCircle,
  Sparkles,
  Globe,
  Shield,
  Zap,
  MessageSquare,
  Calculator,
  BarChart,
  X,
  Crown,
  Medal,
  Award,
  Building2
} from 'lucide-react'
import { formatNumber, generateInitials } from '@/lib/utils'
import ProfileCompletionModal from '@/components/auth/ProfileCompletionModal'
import { AnimatedLogo } from '@/components/ui/AnimatedLogo'

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signOut } = useAuth()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [showRecruiterModal, setShowRecruiterModal] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  // Early check: Sign out recruiters if they access /home
  useEffect(() => {
    const handleRecruiterAccess = async () => {
      if (user?.user_metadata?.admin_level === 'recruiter') {
        console.log('🚫 HomePage: Recruiter detected, showing recruiter redirect modal')
        setShowRecruiterModal(true)
        await signOut()
      }
    }
    
    handleRecruiterAccess()
  }, [user, signOut])

  // RankBadge component for leaderboards
  const RankBadge = ({ rank }: { rank: number }) => {
    if (rank === 1) return (
      <motion.div 
        initial={{ scale: 0.8, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="relative w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 flex items-center justify-center shadow-xl shadow-yellow-500/40 ring-3 ring-yellow-400/30"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200/30 to-transparent" />
        <Crown className="w-6 h-6 text-yellow-900 drop-shadow-sm" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full flex items-center justify-center">
          <Sparkles className="w-2 h-2 text-yellow-800" />
        </div>
      </motion.div>
    )
    if (rank === 2) return (
      <motion.div 
        initial={{ scale: 0.8, rotate: 10 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: -3 }}
        className="relative w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 flex items-center justify-center shadow-xl shadow-gray-400/30 ring-3 ring-gray-300/40"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-100/40 to-transparent" />
        <Medal className="w-6 h-6 text-gray-700 drop-shadow-sm" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-200 rounded-full flex items-center justify-center">
          <Star className="w-2 h-2 text-gray-600" />
        </div>
      </motion.div>
    )
    if (rank === 3) return (
      <motion.div 
        initial={{ scale: 0.8, rotate: -5 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 2 }}
        className="relative w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 via-orange-500 to-orange-600 flex items-center justify-center shadow-xl shadow-orange-500/30 ring-3 ring-orange-400/30"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-300/30 to-transparent" />
        <Award className="w-6 h-6 text-orange-100 drop-shadow-sm" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center">
          <Zap className="w-2 h-2 text-orange-800" />
        </div>
      </motion.div>
    )
    return (
      <motion.div 
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        className="w-12 h-12 rounded-full bg-gradient-to-br from-white/10 to-white/5 text-cyan-300 border-2 border-cyan-400/40 flex items-center justify-center text-sm font-bold shadow-lg shadow-cyan-500/20 hover:border-cyan-400/60 transition-all duration-200"
      >
        #{rank}
      </motion.div>
    )
  }
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    activeResumes: 0,
    activeJobs: 0,
    // Static marketing stats
    hiddenFees: 100,
    minutes: 5
  })
  const [topUsers, setTopUsers] = useState<Array<{ rank: number; userId: string; score: number; user?: { full_name: string | null; avatar_url: string | null } | null }>>([])
  const [lbLoading, setLbLoading] = useState(false)
  const [lbError, setLbError] = useState('')

  // Testimonials data
  const testimonialsData = [
    {
      name: 'Lainie',
      avatar: '/images/testimonials/Lainie.png',
      text: 'A great place to work. Work-life balance, we only work 5 days a week, co-employees are friendly and have a healthy environment.'
    },
    {
      name: 'Rikki',
      avatar: '/images/testimonials/Rikki.png',
      text: 'ShoreAgents is an excellent company for those seeking a healthy work-life balance. There are numerous activities and treats that you will undoubtedly appreciate. ShoreAgents will assist you in growing and stepping beyond of your comfort zone. Strongly recommended! ❤️'
    },
    {
      name: 'Dana',
      avatar: '/images/testimonials/Dana.png',
      text: 'This is not only a company but it is a family, They are truly heart warming, happy environment plus lots of fun activities that they make sure that you have the work life balance! I really recommend everyone to apply in ShoreAgents and experience the happiness!'
    },
    {
      name: 'Arra',
      avatar: '/images/testimonials/Arra.png',
      text: 'I enjoy working in the company; people are good, there are lots of goodies, and they encourage you to do better and work outside your comfort zone. 🥰🥰🥰'
    },
    {
      name: 'Kevin',
      avatar: '/images/testimonials/Kevin.png',
      text: 'Highly recommended! Admins are very nice and approachable. They give out free pizza, burgers, cupcakes, and more every now and then to make sure staff\'s are appreciated. Good working environment too.'
    },
    {
      name: 'Crizza',
      avatar: '/images/testimonials/Crizza.png',
      text: 'This is a less stress workplace, you only have 8-9 hours of stress, 5 days of the week—work life balance—a place where you can enhance your knowledge and grow your skills while also having fun \'cause there are goodies and games! So rare to find those nowadays.'
    }
  ]
  const itemsPerView = 3
  const [currentIndex, setCurrentIndex] = useState(0)

  // Fetch platform statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats/platform')
        if (response.ok) {
          const data = await response.json()
          // Merge so static fields (hiddenFees, minutes) are preserved
          setPlatformStats((prev) => ({ ...prev, ...data }))
        }
      } catch (error) {
        console.error('Failed to fetch platform stats:', error)
      }
    }

    fetchStats()
  }, [])

  // Load top users (leaderboards)
  useEffect(() => {
    const loadTop = async () => {
      try {
        setLbLoading(true)
        setLbError('')
        const res = await fetch('/api/leaderboards?category=overall&limit=5&offset=0', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed: ${res.status}`)
        const data = await res.json()
        setTopUsers(data?.results || [])
      } catch (e: any) {
        setLbError(e?.message || 'Failed to load top users')
        setTopUsers([])
      } finally {
        setLbLoading(false)
      }
    }
    loadTop()
  }, [])

  // Autoplay for testimonials carousel
  useEffect(() => {
    const maxIndex = Math.max(0, testimonialsData.length - itemsPerView)
    const id = setInterval(() => {
      setCurrentIndex((s) => (s + 1) % (maxIndex + 1))
    }, 5000)
    return () => clearInterval(id)
  }, [testimonialsData.length])

  // Check URL parameters for sign-in flow from sign-up
  useEffect(() => {
    const action = searchParams.get('action')
    const source = searchParams.get('source')
    
    if (action === 'signin' && source === 'signup') {
      console.log('🔄 Detected sign-up flow, opening sign-in modal')
      // Clear the URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('action')
      url.searchParams.delete('source')
      window.history.replaceState({}, '', url.toString())
      
      // Open sign-in modal by triggering a click on the sign-in button
      // We'll use a small delay to ensure the page is fully loaded
      setTimeout(() => {
        const signInButton = document.querySelector('[data-signin-button]') as HTMLButtonElement
        if (signInButton) {
          signInButton.click()
        }
      }, 1000)
    }
  }, [searchParams])

  // Check if user needs to complete profile
  useEffect(() => {
    const checkProfileCompletion = async (retryCount = 0) => {
      if (!user) {
        setProfileLoading(false)
        return
      }

      // Add a small delay to ensure session storage flags are set
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Check signup flow flags
      const googleOAuthFlow = typeof window !== 'undefined' ? sessionStorage.getItem('googleOAuthFlow') : null
      const justSignedUp = typeof window !== 'undefined' ? sessionStorage.getItem('justSignedUp') : null
      const manualSignupAutoSignIn = typeof window !== 'undefined' ? sessionStorage.getItem('manualSignupAutoSignIn') : null
      
      console.log('🔍 HomePage: Checking signup flow flags:', {
        googleOAuthFlow,
        justSignedUp,
        manualSignupAutoSignIn,
        userId: user.id,
        userEmail: user.email
      })
      
      // For Google OAuth signup, wait for OAuth callback to complete
      if (googleOAuthFlow === 'signup') {
        console.log('🚫 HomePage: Google OAuth signup flow in progress, not checking profile yet')
        setProfileLoading(false)
        return
      }
      
      // For manual signup without auto sign-in, don't check profile (user needs to sign in first)
      if (justSignedUp === 'true' && !manualSignupAutoSignIn) {
        console.log('🚫 HomePage: Manual signup completed, user needs to sign in first')
        setProfileLoading(false)
        return
      }
      
      // Additional check: if user was just created (no profile data yet), don't show stepper immediately
      // This prevents the stepper from showing right after signup
      // BUT allow it for manual signup with auto sign-in
      const userCreatedRecently = user.created_at && 
        (new Date().getTime() - new Date(user.created_at).getTime()) < 30000 // 30 seconds
      
      // For manual signup with auto sign-in, proceed to check profile (stepper will show)
      // Skip the recent user check for manual signup with auto sign-in
      if (manualSignupAutoSignIn === 'true') {
        console.log('✅ HomePage: Manual signup with auto sign-in, proceeding to check profile')
        // Clear the flag after using it
        sessionStorage.removeItem('manualSignupAutoSignIn')
        // Set hasSignedIn flag to bypass recent user check
        sessionStorage.setItem('hasSignedIn', 'true')
      } else if (userCreatedRecently && (typeof window === 'undefined' || !sessionStorage.getItem('hasSignedIn'))) {
        console.log('🚫 HomePage: User created recently and hasn\'t signed in yet, not checking profile')
        setProfileLoading(false)
        return
      }

      // Add a small delay to ensure user is fully authenticated after signup
      if (retryCount === 0) {
        console.log('⏳ HomePage: Waiting for user authentication to complete...')
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      try {
        console.log('🔄 HomePage: Fetching profile for user:', user.id, retryCount > 0 ? `(retry ${retryCount})` : '')
        console.log('🔄 HomePage: User object:', {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata
        })
        
        // Add a small delay for the first attempt to allow OAuth metadata to be processed
        if (retryCount === 0) {
          console.log('⏳ HomePage: Waiting 300ms for OAuth metadata to be processed...')
          await new Promise(resolve => setTimeout(resolve, 300))
        }
        
        // Test if the API endpoint is accessible
        console.log('🔄 HomePage: Testing API endpoint accessibility...')
        const testUrl = `/api/user/profile?userId=${user.id}`
        console.log('🔄 HomePage: API URL:', testUrl)
        console.log('🔄 HomePage: Current origin:', window.location.origin)
        
        let response
        try {
          response = await fetch(`/api/user/profile?userId=${user.id}`)
          console.log('🔄 HomePage: Profile API response status:', response.status)
          console.log('🔄 HomePage: Profile API response headers:', Object.fromEntries(response.headers.entries()))
        } catch (fetchError) {
          console.error('❌ HomePage: Fetch error occurred:', fetchError)
          console.error('❌ HomePage: Fetch error details:', {
            name: (fetchError as any)?.name,
            message: (fetchError as any)?.message,
            stack: (fetchError as any)?.stack,
            type: typeof fetchError,
            constructor: (fetchError as any)?.constructor?.name,
            url: `/api/user/profile?userId=${user.id}`,
            userId: user.id
          })
          
          // Retry for network errors
          if (retryCount < 2) {
            const delay = retryCount === 0 ? 1000 : 2000
            console.log(`🔄 HomePage: Retrying due to network error in ${delay}ms (attempt ${retryCount + 1})`)
            setTimeout(() => checkProfileCompletion(retryCount + 1), delay)
            return
          }
          
          // Don't throw the error, handle it gracefully
          console.log('🔄 HomePage: Handling fetch error gracefully after retries failed...')
          setUserProfile(null)
          setProfileLoading(false)
          return
        }
        
        if (response.ok) {
          const data = await response.json()
          const profile = data.user
          console.log('✅ HomePage: Profile loaded successfully:', profile)
          setUserProfile(profile)
          
          // Sign out recruiters and show modal
          if (profile.admin_level === 'recruiter') {
            console.log('🚫 HomePage: User is a recruiter, showing recruiter redirect modal')
            setShowRecruiterModal(true)
            await signOut()
            return
          }
          
          // Show modal if completed_data is false
          if (profile.completed_data === false) {
            console.log('📝 HomePage: Showing profile completion modal for regular user')
            setShowProfileModal(true)
          }
        } else {
          let errorData = {}
          let errorText = ''
          
          console.log('🔍 HomePage: Response not OK, debugging response...')
          console.log('🔍 HomePage: Response status:', response.status)
          console.log('🔍 HomePage: Response statusText:', response.statusText)
          console.log('🔍 HomePage: Response headers:', Object.fromEntries(response.headers.entries()))
          
          try {
            errorData = await response.json()
            console.log('🔍 HomePage: Parsed JSON error data:', errorData)
          } catch (jsonError) {
            console.log('⚠️ HomePage: Response is not JSON, trying to get text...')
            console.log('⚠️ HomePage: JSON parse error:', jsonError)
            try {
              errorText = await response.text()
              console.log('📄 HomePage: Response text:', errorText)
            } catch (textError) {
              console.log('⚠️ HomePage: Could not get response text either')
              console.log('⚠️ HomePage: Text parse error:', textError)
            }
          }
          
          const errorInfo = {
            status: response.status,
            statusText: response.statusText,
            error: (errorData as any)?.error || errorText || 'Unknown error',
            details: (errorData as any)?.details || 'No details available',
            url: `/api/user/profile?userId=${user.id}`,
            userId: user.id,
            timestamp: new Date().toISOString(),
            rawErrorData: errorData,
            rawErrorText: errorText
          }
          
          console.error('❌ HomePage: Failed to fetch user profile:', errorInfo)
          
          // Retry for certain error statuses
          if ((response.status >= 500 || response.status === 0) && retryCount < 2) {
            const delay = retryCount === 0 ? 1000 : 2000
            console.log(`🔄 HomePage: Retrying due to server error (${response.status}) in ${delay}ms (attempt ${retryCount + 1})`)
            setTimeout(() => checkProfileCompletion(retryCount + 1), delay)
            return
          }
          
          // If user not found (404), they might not be synced to Railway yet
          if (response.status === 404) {
            console.log('⚠️ HomePage: User not found in Railway database, they may need to be synced')
            console.log('🔄 HomePage: Attempting to trigger user sync...')
            console.log('🔄 HomePage: User metadata for sync:', user.user_metadata)
            
            // Try to trigger user sync by calling the sync endpoint
            try {
              // Parse name data from Google metadata with better extraction
              let firstName = user.user_metadata?.first_name || user.user_metadata?.given_name || ''
              let lastName = user.user_metadata?.last_name || user.user_metadata?.family_name || ''
              let fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
              
              console.log('🔍 HomePage Google metadata name fields:', {
                first_name: user.user_metadata?.first_name,
                last_name: user.user_metadata?.last_name,
                given_name: user.user_metadata?.given_name,
                family_name: user.user_metadata?.family_name,
                full_name: user.user_metadata?.full_name,
                name: user.user_metadata?.name
              })
              
              // If we have a full name but no individual names, parse it
              if (fullName && (!firstName || !lastName)) {
                const nameParts = fullName.trim().split(' ')
                if (nameParts.length >= 2) {
                  firstName = nameParts[0]
                  lastName = nameParts.slice(1).join(' ')
                } else if (nameParts.length === 1) {
                  firstName = nameParts[0]
                  lastName = ''
                }
              }
              
              // If we have individual names but no full name, construct it
              if ((firstName || lastName) && !fullName) {
                fullName = `${firstName} ${lastName}`.trim()
              }
              
              // Fallback to email if no name data at all
              if (!fullName && !firstName && !lastName) {
                fullName = user.email || 'User'
                firstName = user.email?.split('@')[0] || 'User'
                lastName = ''
              }
              
              console.log('🔍 HomePage parsed name data:', {
                firstName,
                lastName,
                fullName
              })

              const syncData = {
                id: user.id,
                email: user.email,
                first_name: firstName,
                last_name: lastName,
                full_name: fullName,
                location: user.user_metadata?.location || '',
                avatar_url: user.user_metadata?.avatar_url || null,
                phone: user.user_metadata?.phone || '',
                bio: user.user_metadata?.bio || '',
                position: user.user_metadata?.position || '',
                company: user.user_metadata?.company || '',
                completed_data: user.user_metadata?.completed_data ?? false,
                birthday: user.user_metadata?.birthday || null,
                gender: user.user_metadata?.gender || null,
                admin_level: user.user_metadata?.admin_level || 'user'
              }
              
              console.log('🔄 HomePage: Sending sync data:', syncData)
              
              const syncResponse = await fetch('/api/user/sync', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(syncData)
              })
              
              console.log('🔄 HomePage: Sync API response status:', syncResponse.status)
              
              if (syncResponse.ok) {
                const syncResult = await syncResponse.json()
                console.log('✅ HomePage: User sync successful:', syncResult)
                console.log('✅ HomePage: User sync successful, retrying profile fetch...')
                // Retry fetching the profile after sync
                const retryResponse = await fetch(`/api/user/profile?userId=${user.id}`)
                if (retryResponse.ok) {
                  const retryData = await retryResponse.json()
                  setUserProfile(retryData.user)
                  
                  // Sign out recruiters and show modal
                  if (retryData.user.admin_level === 'recruiter') {
                    console.log('🚫 HomePage: User is a recruiter, showing recruiter redirect modal')
                    setShowRecruiterModal(true)
                    await signOut()
                    return
                  }
                  
                  // Only show modal for regular users
                  if (retryData.user.completed_data === false) {
                    setShowProfileModal(true)
                  }
                }
              } else {
                const syncErrorData = await syncResponse.json().catch(() => ({}))
                console.error('❌ HomePage: User sync failed:', {
                  status: syncResponse.status,
                  statusText: syncResponse.statusText,
                  error: syncErrorData.error || 'Unknown sync error',
                  details: syncErrorData.details || 'No details available'
                })
                // Set fallback profile when sync fails
                const fallbackProfile = {
                  id: user.id,
                  email: user.email,
                  first_name: user.user_metadata?.first_name || user.user_metadata?.given_name || '',
                  last_name: user.user_metadata?.last_name || user.user_metadata?.family_name || '',
                  full_name: user.user_metadata?.full_name || user.user_metadata?.name || 
                            (user.user_metadata?.given_name && user.user_metadata?.family_name ? 
                              `${user.user_metadata.given_name} ${user.user_metadata.family_name}` : null) ||
                            user.email?.split('@')[0] || 'User',
                  avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                  completed_data: false
                }
                setUserProfile(fallbackProfile)
              }
            } catch (syncError) {
              console.error('❌ HomePage: Error during user sync:', syncError)
              // Set fallback profile when sync error occurs
              const fallbackProfile = {
                id: user.id,
                email: user.email,
                first_name: user.user_metadata?.first_name || user.user_metadata?.given_name || '',
                last_name: user.user_metadata?.last_name || user.user_metadata?.family_name || '',
                full_name: user.user_metadata?.full_name || user.user_metadata?.name || 
                          (user.user_metadata?.given_name && user.user_metadata?.family_name ? 
                            `${user.user_metadata.given_name} ${user.user_metadata.family_name}` : null) ||
                          user.email?.split('@')[0] || 'User',
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                completed_data: false
              }
              setUserProfile(fallbackProfile)
            }
          }
        }
      } catch (error) {
        console.error('❌ HomePage: Error checking profile completion:', error)
        
        // Better error handling with more specific error information
        if (error instanceof Error) {
          console.error('❌ HomePage: Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : undefined,
            userId: user.id
          })
          
          // Try to get more specific error information
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('🌐 Network error detected - possible CORS, DNS, or connection issue')
          } else if (error.name === 'DOMException') {
            console.error('🚫 DOM exception - possible browser security issue')
          } else if (error.name === 'AbortError') {
            console.error('⏹️ Request was aborted')
          } else {
            console.error('❓ Error type:', error.name, 'Message:', error.message)
          }
        } else {
          console.error('❌ HomePage: Non-Error object thrown:', {
            error,
            type: typeof error,
            string: String(error),
            userId: user.id
          })
        }
        
        // Retry after a delay if fetch failed and we haven't retried too many times
        if (retryCount < 2) {
          const delay = retryCount === 0 ? 1000 : 2000
          console.log(`🔄 HomePage: Retrying profile fetch in ${delay}ms (attempt ${retryCount + 1})`)
          setTimeout(() => checkProfileCompletion(retryCount + 1), delay)
          return
        }
        
        // Set a fallback profile using Google OAuth data when profile fetch fails
        const fallbackProfile = {
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || user.user_metadata?.given_name || '',
          last_name: user.user_metadata?.last_name || user.user_metadata?.family_name || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || 
                    (user.user_metadata?.given_name && user.user_metadata?.family_name ? 
                      `${user.user_metadata.given_name} ${user.user_metadata.family_name}` : null) ||
                    user.email?.split('@')[0] || 'User',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          completed_data: false // Assume not completed if we can't fetch from database
        }
        console.log('🔄 HomePage: Using fallback profile data after retries failed:', fallbackProfile)
        setUserProfile(fallbackProfile)
      } finally {
        setProfileLoading(false)
      }
    }

    const handleTriggerProfileCheck = () => {
      console.log('🔄 HomePage: Trigger profile check event received')
      checkProfileCompletion()
    }

    // Listen for trigger events
    window.addEventListener('triggerProfileCheck', handleTriggerProfileCheck)
    
    checkProfileCompletion()
    
    return () => {
      window.removeEventListener('triggerProfileCheck', handleTriggerProfileCheck)
    }
  }, [user])

  const handleProfileComplete = () => {
    setShowProfileModal(false)
    // Refresh the user profile data
    if (userProfile) {
      setUserProfile((prev: any) => prev ? { ...prev, completed_data: true } : null)
    }
  }

  // Listen for profile updates from the profile completion modal
  useEffect(() => {
    const handleProfileUpdate = async () => {
      console.log('🔄 HomePage: Profile update event received, refreshing profile data...')
      if (user?.id) {
        try {
          setProfileLoading(true)
          const response = await fetch(`/api/user/profile?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            console.log('✅ HomePage: Profile refreshed after update:', data.user)
            setUserProfile(data.user)
          } else {
            let errorData = {}
            let errorText = ''
            
            try {
              errorData = await response.json()
            } catch (jsonError) {
              try {
                errorText = await response.text()
              } catch (textError) {
                console.log('⚠️ HomePage: Could not get error response text')
              }
            }
            
            console.error('❌ HomePage: Failed to refresh profile after update:', {
              status: response.status,
              statusText: response.statusText,
              error: (errorData as any)?.error || errorText || 'Unknown error',
              details: (errorData as any)?.details || 'No details available',
              url: `/api/user/profile?userId=${user.id}`,
              userId: user.id,
              timestamp: new Date().toISOString()
            })
          }
        } catch (error) {
          console.error('❌ HomePage: Error refreshing profile after update:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : undefined,
            type: typeof error,
            userId: user.id,
            timestamp: new Date().toISOString()
          })
        } finally {
          setProfileLoading(false)
        }
      }
    }

    const handleUserSignedIn = () => {
      console.log('🔄 HomePage: User signed in event received, triggering profile check...')
      // Trigger profile check after sign-in by dispatching a custom event
      window.dispatchEvent(new CustomEvent('triggerProfileCheck'))
    }

    window.addEventListener('profileUpdated', handleProfileUpdate)
    window.addEventListener('userSignedIn', handleUserSignedIn)
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate)
      window.removeEventListener('userSignedIn', handleUserSignedIn)
    }
  }, [user?.id])

  const handleCloseModal = () => {
    setShowProfileModal(false)
  }

  const handleBuildResume = () => {
    router.push('/resume-builder')
  }

  const handleCreateAccount = () => {
    if (!user) {
      // Trigger signup dialog via query param on the current home route
      router.push('/home?signup=true')
    } else {
      router.push('/resume-builder')
    }
  }

  // Navigation handlers for feature cards
  const handleNavigateToCareerGames = () => {
    router.push('/career-tools/games')
  }

  const handleNavigateToJobMatching = () => {
    router.push('/jobs/job-matching')
  }

  return (
    <main className="bg-black text-white">
      <Header />
      
      <Hero />

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-900/80 via-blue-900/30 to-purple-900/40">
          {/* Enhanced Animated Background Elements */}
          <div className="absolute inset-0">
            {/* Large floating orbs */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-green-500/10 rounded-full blur-xl animate-pulse delay-2000"></div>
            
            {/* Additional smaller particles */}
            <div className="absolute top-10 right-1/3 w-16 h-16 bg-pink-500/8 rounded-full blur-2xl animate-pulse delay-500"></div>
            <div className="absolute bottom-10 right-1/4 w-20 h-20 bg-blue-500/8 rounded-full blur-2xl animate-pulse delay-1500"></div>
            <div className="absolute top-1/2 left-10 w-12 h-12 bg-yellow-500/8 rounded-full blur-2xl animate-pulse delay-3000"></div>
            
            
            {/* Gradient mesh */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-purple-500/5"></div>
          </div>
          
          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30 mb-4 px-6 py-2 text-sm font-semibold shadow-lg shadow-cyan-500/10">
                  <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                  Platform Features
                </Badge>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold mb-6"
              >
                Everything You Need to 
                <span className="gradient-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse"> Succeed in BPO</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              >
                Our comprehensive platform combines AI technology with industry expertise 
                to accelerate your BPO career journey.
              </motion.p>
            </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: FileText,
                title: 'AI Resume Builder',
                description: 'Create professional resumes with real-time AI analysis and industry-specific templates.',
                color: 'text-red-400',
                bgColor: 'bg-red-500/10',
                features: ['AI Analysis', 'BPO Templates', 'Real-time Scoring'],
                hasButton: true,
                buttonText: 'Build Resume',
                buttonAction: handleBuildResume,
                buttonColor: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              },
              {
                icon: GamepadIcon,
                title: 'Career Games',
                description: 'Interactive games and assessments to test your typing speed, personality, and BPO skills.',
                color: 'text-green-400',
                bgColor: 'bg-green-500/10',
                features: ['Typing Hero', 'DISC Personality', 'Performance Analytics'],
                hasButton: true,
                buttonText: 'Play Games',
                buttonAction: handleNavigateToCareerGames,
                buttonColor: 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              },
              {
                icon: Target,
                title: 'Job Matching',
                description: 'Smart AI-powered job matching that connects you with the perfect BPO opportunities.',
                color: 'text-purple-400',
                bgColor: 'bg-purple-500/10',
                features: ['Smart Matching', 'Skill Analysis', 'Company Fit'],
                hasButton: true,
                buttonText: 'Find Jobs',
                buttonAction: handleNavigateToJobMatching,
                buttonColor: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
              },
              {
                icon: BrainIcon,
                title: 'Career Assessments',
                description: 'Comprehensive tests covering typing, personality, logic, and industry-specific skills.',
                color: 'text-cyan-400',
                bgColor: 'bg-cyan-500/10',
                features: ['DISC Personality', 'Typing Test', 'Logic Assessment'],
                hasButton: true,
                buttonText: 'Coming Soon',
                buttonAction: () => {},
                buttonColor: 'bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed opacity-75',
                isComingSoon: true
              },
              {
                icon: Calculator,
                title: 'Salary Calculator',
                description: 'Get accurate salary estimates based on your skills, experience, and location.',
                color: 'text-yellow-400',
                bgColor: 'bg-yellow-500/10',
                features: ['Market Data', 'Skill Premium', 'Location Analysis'],
                hasButton: true,
                buttonText: 'Coming Soon',
                buttonAction: () => {},
                buttonColor: 'bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed opacity-75',
                isComingSoon: true
              },
              {
                icon: BarChart,
                title: 'Career Growth',
                description: 'Track your progress and discover personalized career advancement paths.',
                color: 'text-indigo-400',
                bgColor: 'bg-indigo-500/10',
                features: ['Progress Tracking', 'Skill Roadmap', 'Career Paths'],
                hasButton: true,
                buttonText: 'Coming Soon',
                buttonAction: () => {},
                buttonColor: 'bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed opacity-75',
                isComingSoon: true
              }
            ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }}
                  whileHover={{ 
                    y: -8,
                    transition: { duration: 0.2 }
                  }}
                  className="group"
                >
                  <Card className="glass-card bg-slate-900/40 backdrop-blur-xl border-white/10 h-full hover:border-cyan-500/30 hover:ring-1 hover:ring-cyan-500/20 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-cyan-500/20 relative overflow-hidden">
                    {/* Animated gradient border */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"></div>
                    
                    {/* Floating particles effect */}
                    <div className="absolute top-4 right-4 w-2 h-2 bg-cyan-400/30 rounded-full animate-ping"></div>
                    <div className="absolute top-8 right-8 w-1 h-1 bg-purple-400/40 rounded-full animate-ping delay-1000"></div>
                    
                    <CardHeader className="relative z-10">
                      <motion.div 
                        className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 relative overflow-hidden`}
                        whileHover={{ rotate: 5 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg"></div>
                        <feature.icon className={`w-6 h-6 ${feature.color} relative z-10`} />
                      </motion.div>
                      <CardTitle className="text-xl text-white group-hover:text-cyan-300 transition-colors duration-300">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-gray-300 group-hover:text-gray-200 transition-colors duration-300">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="space-y-2 mb-4">
                        {feature.features.map((item, featureIndex) => (
                          <motion.div 
                            key={item} 
                            className="flex items-center space-x-2 group/item"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: (index * 0.1) + (featureIndex * 0.05) }}
                          >
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: 10 }}
                              transition={{ type: "spring", stiffness: 400 }}
                            >
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </motion.div>
                            <span className="text-sm text-gray-300 group-hover/item:text-white transition-colors duration-200">{item}</span>
                          </motion.div>
                        ))}
                      </div>
                      {feature.hasButton && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={feature.buttonAction}
                            disabled={feature.isComingSoon}
                            className={`w-full text-white border-0 shadow-lg transition-all duration-300 relative overflow-hidden group/btn ${!feature.isComingSoon ? 'group-hover:scale-105' : ''} ${feature.buttonColor}`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative z-10 flex items-center justify-center">
                              {feature.buttonText}
                              {!feature.isComingSoon && (
                                <motion.div
                                  className="ml-2"
                                  animate={{ x: [0, 4, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </motion.div>
                              )}
                            </span>
                          </Button>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
            ))}
          </div>
        </div>
      </section>



        {/* Why Choose BPOC.IO Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-purple-950/20 to-cyan-950/20 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 right-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
          </div>
          
          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30 mb-4 px-6 py-2 text-sm font-semibold shadow-lg shadow-purple-500/10">
                  <Target className="w-4 h-4 mr-2 animate-pulse" />
                  Competitive Analysis
                </Badge>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold mb-6"
              >
                Why Choose <span className="gradient-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">BPOC.IO</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              >
                See how we compare to traditional job platforms and other career games.
              </motion.p>
            </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Traditional Job Sites */}
            <motion.div
              initial={{ opacity: 0, x: -30, scale: 0.9 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group"
            >
              <Card className="glass-card border-white/10 hover:border-red-400/30 h-full transition-all duration-500 group-hover:shadow-xl group-hover:shadow-red-500/10 relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="text-center pb-6 relative z-10">
                  <div className="group/icon">
                    <CardTitle className="text-xl text-white mb-2 flex items-center justify-center gap-2 group-hover/icon:scale-105 transition-transform duration-300">
                      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center group-hover:bg-red-500/30 transition-colors duration-300">
                        <X className="w-4 h-4 text-red-400" />
                      </div>
                      Traditional Job Sites
                    </CardTitle>
                  </div>
                  <div className="w-12 h-px bg-gradient-to-r from-transparent via-red-400/30 to-transparent mx-auto"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3 group/item hover:bg-red-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Generic resume templates</span>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-red-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-gray-300 text-sm">No BPO-specific guidance</span>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-red-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Limited career games</span>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-red-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-gray-300 text-sm">No AI-powered insights</span>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-red-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Generic job matching</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* BPOC.IO - Center Column with Recommendation Badge */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              whileHover={{ y: -8, scale: 1.03 }}
              className="relative group"
            >
              {/* Recommended Badge */}
              <motion.div 
                className="absolute top-0 left-0 right-0 flex justify-center z-20"
                animate={{ 
                  y: [0, -3, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Badge className="bg-gradient-to-r from-red-500 to-pink-600 text-white border-0 px-6 py-2 text-sm font-bold shadow-lg shadow-red-500/25 relative overflow-hidden -translate-y-1/2">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
                  <span className="relative z-10">✨ RECOMMENDED</span>
                </Badge>
              </motion.div>
              
              <Card className="glass-card bg-gradient-to-b from-slate-900/60 to-slate-900/40 backdrop-blur-xl border-red-500/50 hover:border-red-400/80 h-full relative overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-red-500/30 hover:scale-[1.02]">
                {/* Enhanced Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-purple-500/5 to-pink-500/10 rounded-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl"></div>
                
                {/* Animated particles */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-red-400/40 rounded-full animate-ping"></div>
                <div className="absolute bottom-4 left-4 w-1 h-1 bg-pink-400/60 rounded-full animate-ping delay-1000"></div>
                <div className="absolute top-1/2 right-6 w-1.5 h-1.5 bg-purple-400/50 rounded-full animate-ping delay-2000"></div>
                
                <CardHeader className="text-center pt-2 pb-4 relative z-10">
                  <CardTitle className="text-2xl text-white mb-1 flex items-center justify-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                      <AnimatedLogo className="w-full h-full" />
                    </div>
                    BPOC.IO
                  </CardTitle>
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-green-400 to-transparent mx-auto"></div>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  <div className="flex items-start space-x-3 group/item hover:bg-green-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 shadow-sm">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white text-sm font-medium">AI-powered resume builder</span>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-green-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 shadow-sm">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white text-sm font-medium">BPO-specific optimization</span>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-green-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 shadow-sm">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white text-sm font-medium">Comprehensive career games</span>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-green-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 shadow-sm">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white text-sm font-medium">AI insights & recommendations</span>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-green-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 shadow-sm">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white text-sm font-medium">Smart job matching</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Other Career Games */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="group"
            >
              <Card className="glass-card border-white/10 hover:border-red-400/20 h-full transition-all duration-300 group-hover:scale-[1.02] opacity-80 group-hover:opacity-90">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-xl text-white mb-2 flex items-center justify-center gap-2">
                    <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    Other Career Games
                  </CardTitle>
                  <div className="w-12 h-px bg-gradient-to-r from-transparent via-red-400/30 to-transparent mx-auto"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3 group/item hover:bg-red-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Not BPO-focused</span>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-red-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Expensive subscriptions</span>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-red-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Limited Filipino context</span>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-red-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-gray-300 text-sm">No job matching</span>
                  </div>
                  <div className="flex items-start space-x-3 group/item hover:bg-red-500/5 rounded-lg p-2 transition-colors">
                    <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                    <span className="text-gray-300 text-sm">Generic advice</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-emerald-950/40 via-teal-900/30 to-cyan-900/40">
          {/* Enhanced animated background elements */}
          <div className="absolute inset-0">
            {/* Main floating orbs */}
            <div className="absolute top-20 left-20 w-40 h-40 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-yellow-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
            
            {/* Additional particles */}
            <div className="absolute top-10 right-10 w-20 h-20 bg-emerald-500/8 rounded-full blur-2xl animate-pulse delay-500"></div>
            <div className="absolute bottom-10 left-10 w-16 h-16 bg-teal-500/8 rounded-full blur-2xl animate-pulse delay-1500"></div>
            <div className="absolute top-1/3 right-1/4 w-14 h-14 bg-cyan-500/8 rounded-full blur-2xl animate-pulse delay-3000"></div>
            <div className="absolute bottom-1/3 left-1/2 w-18 h-18 bg-lime-500/8 rounded-full blur-2xl animate-pulse delay-2500"></div>
            
            {/* Circuit pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-green-400/20 rounded-full"></div>
              <div className="absolute top-1/2 right-1/4 w-24 h-24 border border-blue-400/20 rounded-full"></div>
              <div className="absolute bottom-1/4 left-1/2 w-20 h-20 border border-yellow-400/20 rounded-full"></div>
            </div>
            
            {/* Diagonal gradient lines */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-yellow-500/5 via-transparent to-cyan-500/5"></div>
          </div>
          
          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30 mb-4 px-6 py-2 text-sm font-semibold shadow-lg shadow-green-500/10">
                  <Zap className="w-4 h-4 mr-2 animate-pulse" />
                  Simple Process
                </Badge>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold mb-6"
              >
                How It<span className="gradient-text bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent"> Works</span> 
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
              >
                Get your dream BPO job in just 5 simple steps with our AI-powered platform.
              </motion.p>
            </motion.div>

          <div className="grid md:grid-cols-5 gap-4 max-w-7xl mx-auto relative">
            {/* Step 1 - Sign Up */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ y: -8, scale: 1.05 }}
              className="relative group"
            >
              <Card className="glass-card border-white/10 hover:border-blue-400/40 h-full transition-all duration-500 group-hover:shadow-xl group-hover:shadow-blue-500/20 relative overflow-hidden p-6">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Floating particles */}
                <div className="absolute top-2 right-2 w-1 h-1 bg-blue-400/40 rounded-full animate-ping"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-indigo-400/30 rounded-full animate-ping delay-1000"></div>
                
                <motion.div 
                  className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg z-10"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  1
                </motion.div>
                
                <CardContent className="p-0 text-center relative z-10">
                  <div className="mb-6">
                    <motion.div 
                      className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 relative overflow-hidden"
                      whileHover={{ rotate: 5, scale: 1.1 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                      <Users className="w-10 h-10 text-white relative z-10" />
                    </motion.div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors duration-300">Sign Up</h3>
                  <p className="text-gray-300 text-sm leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                    Create your BPOC.IO account to access all platform features and tools.
                  </p>
                </CardContent>
              </Card>
              
              {/* Arrow 1 */}
              <motion.div 
                className="hidden md:flex absolute -right-2 top-1/2 transform -translate-y-1/2 z-20"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-cyan-400/50 transition-all duration-300">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </motion.div>
            </motion.div>

            {/* Step 2 - Upload Resume */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <Card className="glass-card border-white/10 hover:border-cyan-400/30 h-full transition-all duration-300 group-hover:scale-105 relative overflow-hidden p-6">
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg z-10">
                  2
                </div>
                
                <CardContent className="p-0 text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-all duration-300">
                      <FileText className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Upload Your Resume</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Upload your existing resume or start from scratch with our AI-powered builder.
                  </p>
                </CardContent>
              </Card>
              
              {/* Arrow 2 */}
              <div className="hidden md:flex absolute -right-2 top-1/2 transform -translate-y-1/2 z-20">
                <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Step 3 - AI Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="relative group"
            >
              <Card className="glass-card border-white/10 hover:border-purple-400/30 h-full transition-all duration-300 group-hover:scale-105 relative overflow-hidden p-6">
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg z-10">
                  3
                </div>
                
                <CardContent className="p-0 text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300">
                      <BrainIcon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">AI Analysis</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Our AI analyzes your resume and provides personalized recommendations.
                  </p>
                </CardContent>
              </Card>
              
              {/* Arrow 3 */}
              <div className="hidden md:flex absolute -right-2 top-1/2 transform -translate-y-1/2 z-20">
                <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Step 4 - Optimize & Improve */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="relative group"
            >
              <Card className="glass-card border-white/10 hover:border-green-400/30 h-full transition-all duration-300 group-hover:scale-105 relative overflow-hidden p-6">
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg z-10">
                  4
                </div>
                
                <CardContent className="p-0 text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-all duration-300">
                      <Target className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Optimize & Improve</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Address red flags, fill gaps, and optimize for BPO industry standards.
                  </p>
                </CardContent>
              </Card>
              
              {/* Arrow 4 */}
              <div className="hidden md:flex absolute -right-2 top-1/2 transform -translate-y-1/2 z-20">
                <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Step 5 - Land Your Dream Job */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="relative group"
            >
              <Card className="glass-card border-white/10 hover:border-yellow-400/30 h-full transition-all duration-300 group-hover:scale-105 relative overflow-hidden p-6">
                <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg z-10">
                  5
                </div>
                
                <CardContent className="p-0 text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-yellow-500/25 group-hover:shadow-yellow-500/40 transition-all duration-300">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Land Your Dream Job</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Apply with confidence and get matched with the best BPO opportunities.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Bottom divider line */}
          <div className="mt-16">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Top Users */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-amber-950/40 via-yellow-900/30 to-orange-900/40 relative overflow-hidden">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0">
          {/* Trophy-themed floating orbs */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute top-20 right-20 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl animate-pulse delay-2000"></div>
          <div className="absolute bottom-20 right-1/4 w-20 h-20 bg-red-500/10 rounded-full blur-2xl animate-pulse delay-1500"></div>
          
          {/* Additional particles */}
          <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-yellow-400/8 rounded-full blur-xl animate-pulse delay-500"></div>
          <div className="absolute bottom-1/3 right-1/3 w-14 h-14 bg-orange-400/8 rounded-full blur-xl animate-pulse delay-3000"></div>
          <div className="absolute top-1/2 right-10 w-12 h-12 bg-amber-400/8 rounded-full blur-xl animate-pulse delay-2500"></div>
          
          {/* Trophy pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/4 left-1/4 text-6xl">🏆</div>
            <div className="absolute top-1/2 right-1/4 text-4xl">🥇</div>
            <div className="absolute bottom-1/4 left-1/2 text-5xl">🏅</div>
          </div>
          
          {/* Gradient mesh */}
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-orange-500/5"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-red-500/5"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30 mb-4 px-6 py-2 text-sm font-semibold shadow-lg shadow-yellow-500/10">
                <Trophy className="w-4 h-4 mr-2 animate-pulse" />
                Our top users
              </Badge>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent"
            >
              🏆 Top 5 Overall
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-gray-300 mt-2 leading-relaxed"
            >
              Recognizing the most engaged candidates across games, applications, and engagement.
            </motion.p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-card bg-slate-900/40 backdrop-blur-xl border-white/10 max-w-4xl mx-auto shadow-2xl shadow-black/50 rounded-xl overflow-hidden"
          >
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[80px] text-gray-300 text-center">Rank</TableHead>
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-right text-gray-300">Overall</TableHead>
                    <TableHead className="text-right text-gray-300">Profile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lbLoading && (
                    <TableRow><TableCell colSpan={4} className="text-gray-400">Loading...</TableCell></TableRow>
                  )}
                  {!lbLoading && lbError && (
                    <TableRow><TableCell colSpan={4} className="text-red-400">{lbError}</TableCell></TableRow>
                  )}
                  {!lbLoading && !lbError && topUsers.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-gray-400">No data</TableCell></TableRow>
                  )}
                  {!lbLoading && !lbError && topUsers.map((row: any) => {
                    const getRowStyling = (rank: number) => {
                      if (rank === 1) return "hover:bg-yellow-500/10 cursor-pointer border-b border-yellow-400/20 bg-gradient-to-r from-yellow-500/5 to-transparent"
                      if (rank === 2) return "hover:bg-gray-300/10 cursor-pointer border-b border-gray-300/20 bg-gradient-to-r from-gray-400/5 to-transparent"
                      if (rank === 3) return "hover:bg-orange-500/10 cursor-pointer border-b border-orange-400/20 bg-gradient-to-r from-orange-500/5 to-transparent"
                      return "hover:bg-white/5 cursor-pointer border-b border-white/10"
                    }

                    const getSpecialBadge = (rank: number) => {
                      if (rank === 1) return <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 border-yellow-400/50 font-bold">🥇 Champion</Badge>
                      if (rank === 2) return <Badge className="bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800 border-gray-300/50 font-semibold">🥈 2nd Place</Badge>
                      if (rank === 3) return <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-orange-900 border-orange-400/50 font-semibold">🥉 3rd Place</Badge>
                      return null
                    }

                    return (
                      <motion.tr 
                        key={`${row.userId}-${row.rank}`} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * (row.rank - 1) }}
                        className={getRowStyling(row.rank)}
                        onClick={() => {}}
                      >
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center w-full h-full min-h-[60px]">
                            <RankBadge rank={row.rank} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${
                              row.rank === 1 ? 'ring-3 ring-yellow-400/50' :
                              row.rank === 2 ? 'ring-2 ring-gray-300/50' :
                              row.rank === 3 ? 'ring-2 ring-orange-400/50' :
                              'ring-2 ring-cyan-500/20'
                            }`}>
                              {row.user?.avatar_url ? (
                                <img src={row.user.avatar_url} alt={row.user?.full_name || row.userId} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">{generateInitials(row.user?.full_name || null)}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-semibold truncate ${
                                row.rank === 1 ? 'text-yellow-300' :
                                row.rank === 2 ? 'text-gray-200' :
                                row.rank === 3 ? 'text-orange-300' :
                                'text-cyan-300'
                              }`}>
                                {row.user?.full_name || row.userId}
                              </div>
                              {getSpecialBadge(row.rank)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{row.score}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-cyan-300 transition-all duration-200 hover:scale-105" onClick={async () => {
                            try {
                              const r = await fetch(`/api/users/${row.userId}/profile`, { cache: 'no-store' })
                              if (!r.ok) {
                                setShowProfileModal(true)
                                return
                              }
                              const data = await r.json()
                              if (data?.slug) {
                                router.push(`/${data.slug}`)
                              } else {
                                setShowProfileModal(true)
                              }
                            } catch {
                              setShowProfileModal(true)
                            }
                          }}>View Profile</Button>
                        </TableCell>
                      </motion.tr>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </motion.div>
          
          {/* View Full Leaderboards Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8"
          >
            <Button
              onClick={() => router.push('/leaderboards')}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-yellow-500/25 transition-all duration-300 hover:scale-105 px-8 py-3 text-lg font-semibold"
            >
              View Full Leaderboards
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-950/40 via-purple-900/30 to-pink-900/40 relative overflow-hidden">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0">
          {/* Success-themed floating orbs */}
          <div className="absolute top-10 left-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-20 right-20 w-28 h-28 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/4 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
          <div className="absolute bottom-20 right-1/3 w-24 h-24 bg-violet-500/10 rounded-full blur-3xl animate-pulse delay-1500"></div>
          
          {/* Additional particles */}
          <div className="absolute top-1/3 left-1/3 w-20 h-20 bg-indigo-400/8 rounded-full blur-2xl animate-pulse delay-500"></div>
          <div className="absolute bottom-1/3 right-1/4 w-16 h-16 bg-purple-400/8 rounded-full blur-2xl animate-pulse delay-3000"></div>
          <div className="absolute top-1/2 right-10 w-14 h-14 bg-pink-400/8 rounded-full blur-2xl animate-pulse delay-2500"></div>
          <div className="absolute bottom-1/2 left-10 w-18 h-18 bg-violet-400/8 rounded-full blur-2xl animate-pulse delay-3500"></div>
          
          {/* Success pattern overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/4 left-1/4 text-6xl">✨</div>
            <div className="absolute top-1/2 right-1/4 text-4xl">🌟</div>
            <div className="absolute bottom-1/4 left-1/2 text-5xl">💫</div>
            <div className="absolute top-1/3 right-1/3 text-3xl">⭐</div>
          </div>
          
          {/* Gradient mesh */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 via-transparent to-violet-500/5"></div>
          
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <Badge className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30 mb-4 px-6 py-2 text-sm font-semibold shadow-lg shadow-indigo-500/10">
                <Trophy className="w-4 h-4 mr-2 animate-pulse" />
                Testimonials
              </Badge>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              <span className="gradient-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Success</span> Stories 
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            >
              See how BPOC.IO has helped thousands of Filipino BPO professionals advance their careers.
            </motion.p>
          </motion.div>

          {/* Testimonials Carousel */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="overflow-hidden px-1 md:px-2">
              <div className="flex gap-4 md:gap-6 transition-transform duration-500"
                style={{ transform: `translateX(-${currentIndex * (100 / 3 + 2)}%)` }}
              >
                {testimonialsData.map((t, index) => (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + (index * 0.1) }}
                    className="w-full md:w-[32%] shrink-0 flex"
                  >
                    <Card className="glass-card bg-slate-900/40 backdrop-blur-xl border-white/10 hover:border-white/20 p-6 md:p-8 min-h-[240px] w-full shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-white/10 flex items-center justify-center ring-2 ring-white/10">
                        <img src={t.avatar} alt={t.name} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-base">{t.name}</h3>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 mb-3">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <blockquote className="text-gray-300 leading-relaxed text-base italic">"{t.text}"</blockquote>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Arrows */}
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              aria-label="Previous"
              onClick={() => setCurrentIndex((s) => Math.max(0, s - 1))}
              className="absolute -left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2 text-white shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              aria-label="Next"
              onClick={() => setCurrentIndex((s) => Math.min(s + 1, Math.max(0, testimonialsData.length - itemsPerView)))}
              className="absolute -right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2 text-white shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>

            {/* Dots */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 mt-6"
            >
              {Array.from({ length: Math.max(1, testimonialsData.length - itemsPerView + 1) }).map((_, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 + (i * 0.05) }}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full border ${i === currentIndex ? 'bg-white border-white' : 'bg-white/20 border-white/30'}`}
                  aria-label={`Go to position ${i + 1}`}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Statistics removed by request */}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 relative overflow-hidden bg-gradient-to-br from-indigo-900/40 via-purple-900/30 to-cyan-900/40">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0">
          {/* Floating orbs */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-20 right-20 w-28 h-28 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/4 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
          <div className="absolute bottom-20 right-1/3 w-24 h-24 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1500"></div>
          
          {/* Additional particles */}
          <div className="absolute top-1/3 left-1/3 w-20 h-20 bg-indigo-400/8 rounded-full blur-2xl animate-pulse delay-500"></div>
          <div className="absolute bottom-1/3 right-1/4 w-16 h-16 bg-purple-400/8 rounded-full blur-2xl animate-pulse delay-3000"></div>
          <div className="absolute top-1/2 right-10 w-14 h-14 bg-cyan-400/8 rounded-full blur-2xl animate-pulse delay-2500"></div>
          
          {/* Gradient mesh overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-pink-500/5"></div>
        </div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-400 text-lg">
              Everything you need to know about BPOC.IO
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* FAQ Item 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all h-full">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setOpenFaqIndex(openFaqIndex === 0 ? null : 0)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-cyan-400" />
                      What is BPOC.IO?
                    </div>
                    {openFaqIndex === 0 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                {openFaqIndex === 0 && (
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed">
                      BPOC.IO is a comprehensive career platform designed specifically for BPO professionals. We offer AI-powered resume building, skill assessments (Typing Hero and DISC Personality), job matching, and direct connections to top BPO employers. Our platform helps you build your professional profile, improve your skills, and advance your BPO career.
                    </p>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* FAQ Item 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all h-full">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setOpenFaqIndex(openFaqIndex === 1 ? null : 1)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-cyan-400" />
                      How does the AI Resume Builder work?
                    </div>
                    {openFaqIndex === 1 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                {openFaqIndex === 1 && (
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed mb-3">
                      Our AI Resume Builder uses advanced technology to help you create professional resumes:
                    </p>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                        <span><strong>Upload or Build:</strong> Upload your existing resume or build one from scratch</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                        <span><strong>AI Analysis:</strong> Our AI analyzes your resume and provides improvement suggestions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                        <span><strong>Multiple Templates:</strong> Choose from professional templates tailored for BPO roles</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                        <span><strong>Export Options:</strong> Download as PDF or share directly with employers</span>
                      </li>
                    </ul>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* FAQ Item 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all h-full">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setOpenFaqIndex(openFaqIndex === 2 ? null : 2)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <GamepadIcon className="w-5 h-5 text-cyan-400" />
                      What are Career Games and how do they help?
                    </div>
                    {openFaqIndex === 2 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                {openFaqIndex === 2 && (
                  <CardContent>
                    <p className="text-gray-300 leading-relaxed mb-3">
                      Our Career Games are skill assessments that help you showcase your abilities:
                    </p>
                    <ul className="space-y-2 text-gray-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                        <span><strong>Typing Hero:</strong> Test and improve your typing speed and accuracy - crucial for BPO roles</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                        <span><strong>DISC Personality:</strong> Discover your personality type (Eagle, Peacock, Turtle, or Owl) and understand your workplace strengths</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                        <span><strong>Leaderboard Rankings:</strong> Compete with other professionals and improve your rank</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                        <span><strong>Share Results:</strong> Share your achievements on social media to showcase your skills</span>
                      </li>
                    </ul>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* FAQ Item 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all h-full">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setOpenFaqIndex(openFaqIndex === 3 ? null : 3)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-cyan-400" />
                      How does the Leaderboard and Ranking System work?
                    </div>
                    {openFaqIndex === 3 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                {openFaqIndex === 3 && (
                  <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    Your overall rank is calculated based on 5 components:
                  </p>
                  <ul className="space-y-2 text-gray-300 mb-4">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Typing Hero (25%):</strong> Based on your best WPM, accuracy, average WPM, and sessions completed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>DISC Personality (25%):</strong> Based on assessment confidence, completed sessions, and having a primary type</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Profile Completion (15%):</strong> Complete your personal data, work status, avatar, bio, and location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Resume Building (20%):</strong> Based on your resume AI score and having a saved resume</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Application Activity (15%):</strong> Based on total applications, active applications, and successful hires</span>
                    </li>
                  </ul>
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mt-4">
                    <p className="text-cyan-200 text-sm font-semibold mb-2">Rank Tiers:</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      <div><span className="text-cyan-400">💎 Diamond:</span> 90-100</div>
                      <div><span className="text-slate-300">💠 Platinum:</span> 75-89</div>
                      <div><span className="text-yellow-400">🥇 Gold:</span> 60-74</div>
                      <div><span className="text-gray-300">🥉 Silver:</span> 40-59</div>
                      <div><span className="text-orange-400">🏅 Bronze:</span> 0-39</div>
                    </div>
                  </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* FAQ Item 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all h-full">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setOpenFaqIndex(openFaqIndex === 4 ? null : 4)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <GamepadIcon className="w-5 h-5 text-cyan-400" />
                      What is the Typing Hero Game?
                    </div>
                    {openFaqIndex === 4 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                {openFaqIndex === 4 && (
                  <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    Typing Hero is an interactive typing speed and accuracy game designed specifically for BPO professionals:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Speed Testing:</strong> Measure your typing speed in Words Per Minute (WPM) with real-time feedback</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Accuracy Tracking:</strong> Monitor your typing accuracy percentage to improve precision</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Progress Tracking:</strong> Track your best WPM, average WPM, and total sessions completed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Leaderboard Integration:</strong> Compete with other professionals and improve your overall rank</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>BPO-Relevant:</strong> Practice with content relevant to BPO industry scenarios and terminology</span>
                    </li>
                  </ul>
                  <p className="text-gray-300 mt-3">
                    Typing speed and accuracy are crucial skills for BPO roles, and Typing Hero helps you develop and showcase these abilities!
                  </p>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* FAQ Item 6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all h-full">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setOpenFaqIndex(openFaqIndex === 5 ? null : 5)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <BrainIcon className="w-5 h-5 text-cyan-400" />
                      What is the DISC Personality Assessment?
                    </div>
                    {openFaqIndex === 5 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                {openFaqIndex === 5 && (
                  <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    The DISC Personality Assessment helps you discover your workplace personality type:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>🦅 Eagle (Dominance):</strong> The Sky Dominator - Natural leaders who thrive on challenges</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>🦚 Peacock (Influence):</strong> The Social Star - Enthusiastic communicators who excel in team environments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>🐢 Turtle (Steadiness):</strong> The Steady Guardian - Reliable team players who value stability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>🦉 Owl (Conscientiousness):</strong> The Wise Analyst - Detail-oriented professionals who prioritize quality</span>
                    </li>
                  </ul>
                  <p className="text-gray-300 mt-3">
                    Complete the assessment to discover your BPO animal and understand which roles suit you best!
                  </p>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* FAQ Item 7 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
            >
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all h-full">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setOpenFaqIndex(openFaqIndex === 6 ? null : 6)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-cyan-400" />
                      How do I apply for jobs on BPOC.IO?
                    </div>
                    {openFaqIndex === 6 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                {openFaqIndex === 6 && (
                  <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    Applying for jobs is simple:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Have a Resume:</strong> Build or upload your resume using our AI Resume Builder</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Browse Jobs:</strong> Visit the Jobs section to see available BPO positions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Match Your Profile:</strong> Our AI matches jobs to your skills and experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>One-Click Apply:</strong> Apply directly with your BPOC.IO profile and resume</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Track Applications:</strong> Monitor your application status in your dashboard</span>
                    </li>
                  </ul>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* FAQ Item 8 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
            >
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all h-full">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setOpenFaqIndex(openFaqIndex === 7 ? null : 7)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      Is BPOC.IO free to use?
                    </div>
                    {openFaqIndex === 7 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                {openFaqIndex === 7 && (
                  <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    Yes! BPOC.IO is completely free for job seekers:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Free Account:</strong> Create your account at no cost</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Free Resume Builder:</strong> Build unlimited resumes with AI assistance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Free Career Games:</strong> Play Typing Hero and DISC assessments unlimited times</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Free Job Applications:</strong> Apply to as many jobs as you want</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>No Hidden Fees:</strong> We never charge for basic features</span>
                    </li>
                  </ul>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* FAQ Item 10 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.0 }}
            >
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all h-full">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setOpenFaqIndex(openFaqIndex === 9 ? null : 9)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-cyan-400" />
                      Can I share my profile and achievements?
                    </div>
                    {openFaqIndex === 9 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                {openFaqIndex === 9 && (
                  <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    Absolutely! Sharing helps you showcase your skills:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Resume Sharing:</strong> Share your resume link on Facebook, LinkedIn, or copy the link</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Game Results:</strong> Share your Typing Hero and DISC personality results with custom images</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Profile Link:</strong> Share your public profile URL to showcase your achievements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Social Media Ready:</strong> All shares include beautiful preview images optimized for social platforms</span>
                    </li>
                  </ul>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* FAQ Item 11 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.1 }}
            >
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all h-full">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setOpenFaqIndex(openFaqIndex === 10 ? null : 10)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-cyan-400" />
                      How quickly can I get started?
                    </div>
                    {openFaqIndex === 10 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                {openFaqIndex === 10 && (
                  <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    You can get started in just a few minutes:
                  </p>
                  <ol className="space-y-2 text-gray-300 list-decimal list-inside">
                    <li><strong>Create Account (1 minute):</strong> Sign up with your email - it's free and instant</li>
                    <li><strong>Complete Profile (2-3 minutes):</strong> Add your basic information and work status</li>
                    <li><strong>Build Resume (5-10 minutes):</strong> Use our AI builder or upload your existing resume</li>
                    <li><strong>Play Career Games (5-10 minutes):</strong> Complete Typing Hero and DISC assessments</li>
                    <li><strong>Start Applying (Immediate):</strong> Browse and apply to jobs right away!</li>
                  </ol>
                  <p className="text-gray-300 mt-3">
                    Total time: <strong className="text-cyan-400">15-25 minutes</strong> to have a complete, professional profile ready for employers!
                  </p>
                  </CardContent>
                )}
              </Card>
            </motion.div>

            {/* FAQ Item 12 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2 }}
            >
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:border-cyan-500/30 transition-all h-full">
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setOpenFaqIndex(openFaqIndex === 11 ? null : 11)}
                >
                  <CardTitle className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <Calculator className="w-5 h-5 text-cyan-400" />
                      How is my resume AI score calculated?
                    </div>
                    {openFaqIndex === 11 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </CardTitle>
                </CardHeader>
                {openFaqIndex === 11 && (
                  <CardContent>
                  <p className="text-gray-300 leading-relaxed mb-3">
                    Our AI analyzes your resume across multiple dimensions:
                  </p>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Content Quality:</strong> Relevance, clarity, and completeness of information</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Formatting:</strong> Professional structure and visual presentation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Keywords:</strong> Industry-relevant terms and skills that match job requirements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Experience:</strong> Work history, achievements, and career progression</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-cyan-400 mt-1 flex-shrink-0" />
                      <span><strong>Education & Skills:</strong> Qualifications and technical abilities</span>
                    </li>
                  </ul>
                  <p className="text-gray-300 mt-3">
                    The AI provides specific suggestions to improve your score and make your resume more attractive to employers.
                  </p>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-red-900/20 via-purple-900/20 to-pink-900/20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 text-red-400 text-sm font-semibold mb-8 shadow-lg shadow-red-500/10">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-4 h-4 mr-2" />
                </motion.div>
                Ready to Transform Your Career?
              </div>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl font-bold mb-6"
            >
              Start Your Journey 
              <span className="gradient-text bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 bg-clip-text text-transparent"> Today </span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed"
            >
              Join thousands of Filipino BPO professionals who have already transformed their careers with BPOC.IO. It's completely free to get started.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  onClick={handleBuildResume}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg shadow-red-500/25 text-lg px-8 py-4 relative overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10 flex items-center">
                    Build Your Resume Now 
                    <motion.div
                      className="ml-2"
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.div>
                  </span>
                </Button>
              </motion.div>
              {!user && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={handleCreateAccount}
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 bg-transparent text-lg px-8 py-4 relative overflow-hidden group/btn"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">Create Free Account</span>
                  </Button>
                </motion.div>
              )}
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">{formatNumber(platformStats.hiddenFees)}% Free</div>
                <div className="text-sm text-gray-400">No hidden fees</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{formatNumber(platformStats.minutes)} Minutes</div>
                <div className="text-sm text-gray-400">To get started</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">Instant</div>
                <div className="text-sm text-gray-400">AI analysis</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer included globally via RootLayout */}

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        open={showProfileModal}
        onOpenChange={handleCloseModal}
        onComplete={handleProfileComplete}
      />

      {/* Recruiter Redirect Modal */}
      <Dialog open={showRecruiterModal} onOpenChange={setShowRecruiterModal}>
        <DialogContent className="max-w-md bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 border-emerald-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white text-xl">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              Recruiter Account Detected
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
              <p className="text-gray-200 text-center leading-relaxed">
                This account is registered as a <span className="font-bold text-emerald-400">Recruiter Account</span>.
              </p>
            </div>
            
            <div className="space-y-3 text-gray-300">
              <p className="text-sm">
                Recruiter accounts have access to:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Post and manage job listings</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Browse candidate profiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Review job applications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Access recruiter dashboard</span>
                </li>
              </ul>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4 mt-4">
              <p className="text-cyan-200 text-sm text-center">
                Please sign in on the <span className="font-bold text-cyan-400">Recruiter Portal</span> to access your account features.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowRecruiterModal(false)}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Stay Here
            </Button>
            <Button
              onClick={() => {
                setShowRecruiterModal(false)
                router.push('/recruiter')
              }}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              Go to Recruiter Portal
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
} 