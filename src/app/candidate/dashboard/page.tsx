'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import ProfileCompletionModal from '@/components/candidate/ProfileCompletionModal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  FileText, 
  Briefcase, 
  Trophy, 
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  Edit,
  Play
} from 'lucide-react'

interface ProfileData {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  avatar_url?: string
  completed_data?: boolean
  slug?: string
}

interface DashboardStats {
  profile_completion: number
  has_resume: boolean
  has_disc: boolean
  has_typing: boolean
  applications_count: number
  job_matches_count: number
}

export default function CandidateDashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
      return
    }

    if (user) {
      fetchProfile()
      fetchStats()
      
      // Check if we should show profile completion modal
      if (typeof window !== 'undefined') {
        const showModal = sessionStorage.getItem('showProfileCompletion')
        if (showModal === 'true') {
          setShowProfileModal(true)
          sessionStorage.removeItem('showProfileCompletion')
        }
      }
    }
  }, [user, loading])

  async function fetchProfile() {
    try {
      const response = await fetch(`/api/user/profile?userId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  async function fetchStats() {
    try {
      setLoadingStats(true)
      
      // Fetch profile completion
      const profileRes = await fetch(`/api/user/profile?userId=${user?.id}`)
      const profileData = profileRes.ok ? await profileRes.json() : null
      
      // Fetch resume status
      const resumeRes = await fetch('/api/user/saved-resumes')
      const hasResume = resumeRes.ok
      
      // Fetch games count (includes DISC and Typing)
      const gamesRes = await fetch('/api/user/games-count')
      const gamesData = gamesRes.ok ? await gamesRes.json() : { disc_count: 0, typing_count: 0 }
      
      // Fetch applications count
      const appsRes = await fetch('/api/applications')
      const appsData = appsRes.ok ? await appsRes.json() : { applications: [] }
      
      // Fetch job matches count
      const matchesRes = await fetch('/api/user/job-matches-count')
      const matchesData = matchesRes.ok ? await matchesRes.json() : { count: 0 }

      const profileCompletion = profileData?.user?.completed_data ? 100 : 
        profileData?.user ? 50 : 0

      setStats({
        profile_completion: profileCompletion,
        has_resume: hasResume,
        has_disc: (gamesData.disc_count || 0) > 0,
        has_typing: (gamesData.typing_count || 0) > 0,
        applications_count: appsData.applications?.length || 0,
        job_matches_count: matchesData.count || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  if (loading || loadingStats) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <ProfileCompletionModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        userId={user.id}
      />

  const completionSteps = [
    { 
      key: 'profile', 
      label: 'Complete Profile', 
      completed: stats?.profile_completion === 100,
      href: '/settings'
    },
    { 
      key: 'disc', 
      label: 'Take DISC Assessment', 
      completed: stats?.has_disc || false,
      href: '/career-tools/assessments/disc'
    },
    { 
      key: 'resume', 
      label: 'Build Resume', 
      completed: stats?.has_resume || false,
      href: '/resume-builder'
    },
    { 
      key: 'typing', 
      label: 'Complete Typing Test', 
      completed: stats?.has_typing || false,
      href: '/career-tools/games/typing-hero'
    },
  ]

  const completedSteps = completionSteps.filter(s => s.completed).length
  const totalSteps = completionSteps.length

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.first_name || 'Candidate'}! 👋
            </h1>
            <p className="mt-1 text-gray-600">
              Your career journey dashboard
            </p>
          </div>
        {/* Profile Completion Card */}
        <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Profile Completion</span>
              <Badge variant={stats?.profile_completion === 100 ? "default" : "secondary"}>
                {stats?.profile_completion || 0}%
              </Badge>
            </CardTitle>
            <CardDescription>
              Complete your profile to unlock more opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completionSteps.map((step) => (
                <Link key={step.key} href={step.href}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      {step.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                      <span className={step.completed ? 'text-gray-600 line-through' : 'text-gray-900 font-medium'}>
                        {step.label}
                      </span>
                    </div>
                    {!step.completed && (
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {completedSteps} of {totalSteps} steps completed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Job Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.applications_count || 0}
                </div>
                <Briefcase className="h-8 w-8 text-blue-500" />
              </div>
              <Link href="/applications">
                <Button variant="ghost" size="sm" className="mt-2 w-full">
                  View Applications
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Job Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.job_matches_count || 0}
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <Link href="/jobs/job-matching">
                <Button variant="ghost" size="sm" className="mt-2 w-full">
                  View Matches
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {stats?.has_resume ? '✓' : '—'}
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
              <Link href={stats?.has_resume ? "/resume-builder" : "/resume-builder/build"}>
                <Button variant="ghost" size="sm" className="mt-2 w-full">
                  {stats?.has_resume ? 'Edit Resume' : 'Build Resume'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Assessments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {[stats?.has_disc, stats?.has_typing].filter(Boolean).length}/2
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
              <Link href="/career-tools/assessments">
                <Button variant="ghost" size="sm" className="mt-2 w-full">
                  Take Assessments
                  <Play className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with these key features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/career-tools/assessments/disc">
                <Button className="w-full h-auto py-6 flex flex-col items-center space-y-2" variant="outline">
                  <Trophy className="h-8 w-8 text-blue-500" />
                  <span>DISC Assessment</span>
                  <span className="text-xs text-gray-500">Discover your personality</span>
                </Button>
              </Link>
              
              <Link href="/resume-builder/build">
                <Button className="w-full h-auto py-6 flex flex-col items-center space-y-2" variant="outline">
                  <FileText className="h-8 w-8 text-purple-500" />
                  <span>Resume Builder</span>
                  <span className="text-xs text-gray-500">Create your resume</span>
                </Button>
              </Link>
              
              <Link href="/jobs">
                <Button className="w-full h-auto py-6 flex flex-col items-center space-y-2" variant="outline">
                  <Briefcase className="h-8 w-8 text-green-500" />
                  <span>Browse Jobs</span>
                  <span className="text-xs text-gray-500">Find opportunities</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </>
  )
}

