'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowRight,
  TrendingUp,
  Users,
  Award,
  Play,
  Star,
  Brain,
  Zap,
  FileText,
  Wrench,
  Briefcase,
  Trophy,
  Target,
  Clock,
  BarChart3,
  CheckCircle2,
  Crown,
  DollarSign,
  Gamepad2 as GamepadIcon,
  Calculator,
  Search,
  Filter,
  Upload,
  Check,
  X,
  ExternalLink,
  Plus,
  Sparkles,
  MessageSquare,
  BookOpen,
  Heart,
  MapPin,
  RefreshCw,
  Medal,
  HelpCircle,
  Monitor,
  Eye,
  Keyboard,
  Globe,
  Building2,
  ChevronDown,
  Share2,
  Calendar,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { formatNumber } from '@/lib/utils'
import { AnimatedLogo } from '@/components/ui/AnimatedLogo'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const typingText = [
  'Your BPO Career Starts Here',
  'AI-Powered Success',
  'Skills That Matter',
  'Dream Jobs Await'
]

const demoTabs = [
  { id: 'resume', label: 'Resume Builder', icon: FileText },
  { id: 'tools', label: 'Career Games', icon: Wrench },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'talent', label: 'Talent Search', icon: Search },
  { id: 'leaderboards', label: 'Leaderboards', icon: Trophy }
]

export default function Hero() {
  const router = useRouter()
  const [currentTypingIndex, setCurrentTypingIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(150)
  const [activeTab, setActiveTab] = useState(0)
  const [platformStats, setPlatformStats] = useState({
    totalUsers: 0,
    activeResumes: 0,
    activeJobs: 0
  })
  const [loading, setLoading] = useState(true)
  const leaderboardScrollRef = useRef<HTMLDivElement>(null)
  const resumePreviewScrollRef = useRef<HTMLDivElement>(null)
  const [showJobSuccessModal, setShowJobSuccessModal] = useState(false)

  // Resume Builder Simulation State
  const [resumeStep, setResumeStep] = useState(0) // 0: Upload, 1: Processing, 2: Extraction Complete, 3: AI Analysis, 4: AI Results, 5: Building Resume, 6: Resume Complete, 6.5: Button Click, 7: Preview
  const [resumeProgress, setResumeProgress] = useState(0)
  const [resumeLogs, setResumeLogs] = useState<string[]>([])
  const [simulatedFile, setSimulatedFile] = useState<File | null>(null)

  // Career Games Demo State
  const [gameDemoStep, setGameDemoStep] = useState(0) // 0: Typing Hero, 1: DISC
  
  // Typing Hero Demo State
  const [typingDemoWord, setTypingDemoWord] = useState('')
  const [typingDemoEffect, setTypingDemoEffect] = useState<string | null>(null)
  const typingWords = ['assist', 'create', 'design', 'manage']
  const [typingWordIndex, setTypingWordIndex] = useState(0)

  // DISC Demo State
  const [discScenarioIndex, setDiscScenarioIndex] = useState(0)
  const [discSelectedOption, setDiscSelectedOption] = useState<number | null>(null)
  const [discReaction, setDiscReaction] = useState<{ animal: string, trait: string } | null>(null)
  
  const discScenarios = [
    {
      context: 'WORK',
      title: '📞 Angry Customer',
      options: [
        { text: 'Apologize sincerely', type: 'I', animal: '🦚', trait: 'Social Star' },
        { text: 'Solve immediately', type: 'D', animal: '🦅', trait: 'Dominant' },
        { text: 'Listen carefully', type: 'S', animal: '🐢', trait: 'Steady' },
        { text: 'Analyze root cause', type: 'C', animal: '🦉', trait: 'Analyst' }
      ]
    },
    {
      context: 'FAMILY',
      title: '💰 Money Problem',
      options: [
        { text: 'Strict rules', type: 'D', animal: '🦅', trait: 'Dominant' },
        { text: 'Discuss openly', type: 'I', animal: '🦚', trait: 'Social Star' },
        { text: 'Help unconditionally', type: 'S', animal: '🐢', trait: 'Steady' },
        { text: 'Plan budget', type: 'C', animal: '🦉', trait: 'Analyst' }
      ]
    }
  ]

  // Jobs Demo State
  const [jobsDemoStep, setJobsDemoStep] = useState(0) // 0: Idle, 1: Simulating Click, 2: Success Modal
  const [jobsDemoTargetId, setJobsDemoTargetId] = useState<number | null>(null)
  const [jobApplied, setJobApplied] = useState(false) // Track if first job has been applied to

  // Talent Search Demo State
  const [talentDemoStep, setTalentDemoStep] = useState(0) // 0: Idle, 1: Typing, 2: Searching, 3: Results
  const [talentSearchQuery, setTalentSearchQuery] = useState('')
  const talentTargetQuery = "Rica Javier"

  // Leaderboard Demo State
  const [leaderboardStep, setLeaderboardStep] = useState(0) // 0: Init, 1: Show 2nd, 2: Show 1st, 3: Show 3rd
  const [leaderboardData, setLeaderboardData] = useState([
    { r: 1, u: 'Rica Javier', s: 98, c: 'text-yellow-400', b: 'bg-yellow-400/10', id: 'rj' },
    { r: 2, u: 'Maria Santos', s: 95, c: 'text-slate-300', b: 'bg-slate-400/10', id: 'ms' },
    { r: 3, u: 'David King', s: 92, c: 'text-orange-400', b: 'bg-orange-400/10', id: 'dk' },
    { r: 4, u: 'Sarah Lee', s: 89, c: 'text-cyan-400', b: 'transparent', id: 'sl' },
    { r: 5, u: 'John Doe', s: 85, c: 'text-white', b: 'transparent', id: 'jd' },
    { r: 6, u: 'Jane Smith', s: 82, c: 'text-white', b: 'transparent', id: 'js' },
    { r: 7, u: 'Mike Ross', s: 78, c: 'text-white', b: 'transparent', id: 'mr' },
    { r: 8, u: 'Anna Bell', s: 76, c: 'text-white', b: 'transparent', id: 'ab' },
    { r: 9, u: 'Chris Evans', s: 74, c: 'text-white', b: 'transparent', id: 'ce' },
    { r: 10, u: 'Emma Watson', s: 72, c: 'text-white', b: 'transparent', id: 'ew' },
  ])

  const handleBuildResume = () => {
    router.push('/resume-builder')
  }

  // Auto-rotate tabs - longer for resume builder to show full flow
  useEffect(() => {
    const getTabDuration = (tabIndex: number) => {
      const tabId = demoTabs[tabIndex].id
      // Resume builder needs more time to show all steps
      if (tabId === 'resume') return 18000 // 18 seconds for resume builder
      return 10000 // 10 seconds for other tabs
    }

    let timeoutId: NodeJS.Timeout
    const scheduleNext = () => {
      const duration = getTabDuration(activeTab)
      timeoutId = setTimeout(() => {
      setActiveTab((prev) => (prev + 1) % demoTabs.length)
        scheduleNext()
      }, duration)
    }

    scheduleNext()
    return () => clearTimeout(timeoutId)
  }, [activeTab])

  // Game Demo Sequencer
  useEffect(() => {
    if (demoTabs[activeTab].id === 'tools') {
      // Reset to Typing Hero initially
      setGameDemoStep(0)
      
      // Switch to DISC after 5 seconds
      const timer = setTimeout(() => {
        setGameDemoStep(1)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [activeTab])

  // Track if resume simulation is active
  const simulationActiveRef = useRef(false)

  // Reset resume simulation when tab changes
  useEffect(() => {
    if (demoTabs[activeTab].id === 'resume') {
      // Reset state immediately
      simulationActiveRef.current = true
      setResumeStep(0)
      setResumeProgress(0)
      setResumeLogs([])
      setSimulatedFile(null)
      
      // Start simulation sequence
      const sequence = async () => {
        // Step 0: Simulate file upload after 0.8s
        await new Promise(r => setTimeout(r, 800))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        setSimulatedFile({ name: 'my_resume.pdf', size: 1024 * 1024, type: 'application/pdf' } as File)
        
        // Step 1: Start processing after 1s
        await new Promise(r => setTimeout(r, 1000))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        setResumeStep(1)
        
        // Simulate extraction logs
        const extractionLogs = [
          '🚀 Starting CloudConvert + GPT OCR pipeline',
          '📋 New Process: File → CloudConvert',
          '🎯 CloudConvert handles document conversion',
          '📤 Step 1: Converting file to JPEG format',
          '✅ Step 1 Complete: File converted to JPEG format',
          '🤖 Step 2: Performing GPT Vision OCR',
          '✅ Step 2 Complete: Text extracted via GPT OCR',
          '📄 Step 3: Creating organized DOCX',
          '✅ Pipeline Complete: Processing successful'
        ]
        
        for (let i = 0; i < extractionLogs.length; i++) {
            if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
            await new Promise(r => setTimeout(r, 250))
            if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
            
            setResumeLogs(prev => {
                // Avoid duplicates
                if (prev.includes(extractionLogs[i])) return prev
                return [...prev, extractionLogs[i]]
            })
            setResumeProgress(((i + 1) / extractionLogs.length) * 100)
        }
        
        // Step 2: Extraction Complete
        await new Promise(r => setTimeout(r, 200))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        setResumeStep(2)
        setResumeProgress(100)
        
        // Wait a bit before moving to AI analysis
        await new Promise(r => setTimeout(r, 800))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        
        // Step 3: AI Analysis
        setResumeStep(3)
        setResumeProgress(0)
        setResumeLogs([]) // Clear logs for AI analysis phase
        
        // Simulate AI analysis logs
        const aiAnalysisLogs = [
          '🤖 Initializing AI analysis engine',
          '📊 Analyzing extracted resume data',
          '🔍 Identifying key skills and experiences',
          '💡 Evaluating content quality and relevance',
          '📈 Assessing ATS compatibility',
          '✨ Generating improvement suggestions',
          '🎯 Optimizing keyword density',
          '✅ Step 1: Skills analysis complete',
          '✅ Step 2: Experience validation complete',
          '✅ Step 3: Content optimization complete',
          '✅ Step 4: ATS score calculated',
          '🎉 AI analysis complete!'
        ]
        
        for (let i = 0; i < aiAnalysisLogs.length; i++) {
            if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
            await new Promise(r => setTimeout(r, 250))
            if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
            
            setResumeLogs(prev => {
                // Avoid duplicates
                if (prev.includes(aiAnalysisLogs[i])) return prev
                return [...prev, aiAnalysisLogs[i]]
            })
            setResumeProgress(((i + 1) / aiAnalysisLogs.length) * 100)
        }
        
        // Wait before showing results
        await new Promise(r => setTimeout(r, 500))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        
        // Step 4: Show AI Analysis Results
        setResumeStep(4)
        setResumeProgress(100)
        
        // Wait a bit to show results
        await new Promise(r => setTimeout(r, 2000))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        
        // Step 5: Building Resume
        setResumeStep(5)
        setResumeProgress(0)
        setResumeLogs([]) // Clear logs for building phase
        
        // Simulate building logs
        const buildingLogs = [
          '🎨 Analyzing extracted data structure',
          '📝 Organizing sections: Experience, Education, Skills',
          '✨ Applying AI-powered formatting',
          '🎯 Optimizing content for ATS compatibility',
          '💼 Adding professional sections',
          '✅ Step 1: Experience section generated',
          '✅ Step 2: Education section formatted',
          '✅ Step 3: Skills section optimized',
          '✅ Step 4: Summary section created',
          '🎉 Resume building complete!'
        ]
        
        for (let i = 0; i < buildingLogs.length; i++) {
            if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
            await new Promise(r => setTimeout(r, 250))
            if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
            
            setResumeLogs(prev => {
                // Avoid duplicates
                if (prev.includes(buildingLogs[i])) return prev
                return [...prev, buildingLogs[i]]
            })
            setResumeProgress(((i + 1) / buildingLogs.length) * 100)
        }
        
        // Step 6: Resume Complete
        await new Promise(r => setTimeout(r, 200))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        setResumeStep(6)
        setResumeProgress(100)
        
        // Wait a bit then simulate preview button click
        await new Promise(r => setTimeout(r, 1500))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        setResumeStep(6.5) // Show button click animation
        
        // Wait for click animation
        await new Promise(r => setTimeout(r, 500))
        if (!simulationActiveRef.current || demoTabs[activeTab].id !== 'resume') return
        setResumeStep(7) // Show preview
      }
      
      sequence()
    } else {
        simulationActiveRef.current = false
    }

    return () => {
        simulationActiveRef.current = false
    }
  }, [activeTab])

  // Typing Hero Demo Loop
  useEffect(() => {
    if (demoTabs[activeTab].id === 'tools' && gameDemoStep === 0) {
      const interval = setInterval(() => {
        // Simulate typing a word
        const word = typingWords[typingWordIndex]
        let currentText = ''
        let charIndex = 0
        
        const typeInterval = setInterval(() => {
          if (charIndex < word.length) {
            currentText += word[charIndex]
            setTypingDemoWord(currentText)
            charIndex++
          } else {
            clearInterval(typeInterval)
            setTypingDemoEffect('🔥 Perfect!')
            setTimeout(() => {
              setTypingDemoEffect(null)
              setTypingDemoWord('')
              setTypingWordIndex((prev) => (prev + 1) % typingWords.length)
            }, 1000)
          }
        }, 100)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [activeTab, gameDemoStep, typingWordIndex])

  // DISC Demo Loop
  useEffect(() => {
    if (demoTabs[activeTab].id === 'tools' && gameDemoStep === 1) {
      const interval = setInterval(() => {
        // 1. Select a random option
        const randomOption = Math.floor(Math.random() * 4)
        setDiscSelectedOption(randomOption)
        
        // 2. Show reaction (animal) after a short delay
        setTimeout(() => {
          const scenario = discScenarios[discScenarioIndex]
          const option = scenario.options[randomOption]
          setDiscReaction({ animal: option.animal, trait: option.trait })
        }, 500)
        
        // 3. Reset and move to next scenario
        setTimeout(() => {
          setDiscSelectedOption(null)
          setDiscReaction(null)
          setDiscScenarioIndex((prev) => (prev + 1) % discScenarios.length)
        }, 2500)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [activeTab, gameDemoStep, discScenarioIndex])

  // Jobs Demo Loop
  useEffect(() => {
    if (demoTabs[activeTab].id === 'jobs') {
      setJobsDemoStep(0)
      setJobsDemoTargetId(null)
      setShowJobSuccessModal(false)
      setJobApplied(false) // Reset applied state when tab changes

      const sequence = async () => {
        // Wait a bit before starting
        await new Promise(r => setTimeout(r, 2000))
        
        // Simulate hovering/targeting the first job apply button
        setJobsDemoTargetId(0) // Target first job card
        
        // Simulate click after delay
        await new Promise(r => setTimeout(r, 1500))
        setJobsDemoStep(1) // Button clicked state
        
        // Show success modal
        await new Promise(r => setTimeout(r, 500))
        setShowJobSuccessModal(true)
        setJobsDemoStep(2)
        
        // Mark as applied when modal is shown
        setJobApplied(true)
        
        // Close modal after some time
        await new Promise(r => setTimeout(r, 3000))
        setShowJobSuccessModal(false)
        setJobsDemoStep(0)
        setJobsDemoTargetId(null)
        // Keep jobApplied as true so button stays as "Already Applied"
      }
      
      sequence()
    } else {
      setJobsDemoStep(0)
      setJobsDemoTargetId(null)
      setShowJobSuccessModal(false)
      setJobApplied(false)
    }
  }, [activeTab])

  // Talent Search Demo Logic
  useEffect(() => {
    if (demoTabs[activeTab].id === 'talent') {
      setTalentDemoStep(0)
      setTalentSearchQuery('')

      const sequence = async () => {
        // Wait a bit before starting
        await new Promise(r => setTimeout(r, 1000))
        if (demoTabs[activeTab].id !== 'talent') return
        setTalentDemoStep(1) // Start Typing

        // Type the query
        for (let i = 0; i <= talentTargetQuery.length; i++) {
            if (demoTabs[activeTab].id !== 'talent') return
            setTalentSearchQuery(talentTargetQuery.slice(0, i))
            await new Promise(r => setTimeout(r, 50 + Math.random() * 50))
        }

        await new Promise(r => setTimeout(r, 500))
        if (demoTabs[activeTab].id !== 'talent') return
        setTalentDemoStep(2) // Searching (Loading)

        await new Promise(r => setTimeout(r, 1500))
        if (demoTabs[activeTab].id !== 'talent') return
        setTalentDemoStep(3) // Show Results
      }
      
      sequence()
    }
  }, [activeTab])

  // Leaderboard Demo Logic
  useEffect(() => {
    if (demoTabs[activeTab].id === 'leaderboards') {
      setLeaderboardStep(0)
      
      // Reset data to initial state
      setLeaderboardData([
        { r: 1, u: 'Rica Javier', s: 98, c: 'text-yellow-400', b: 'bg-yellow-400/10', id: 'rj' },
        { r: 2, u: 'Maria Santos', s: 95, c: 'text-slate-300', b: 'bg-slate-400/10', id: 'ms' },
        { r: 3, u: 'David King', s: 92, c: 'text-orange-400', b: 'bg-orange-400/10', id: 'dk' },
        { r: 4, u: 'Sarah Lee', s: 89, c: 'text-cyan-400', b: 'transparent', id: 'sl' },
        { r: 5, u: 'John Doe', s: 85, c: 'text-white', b: 'transparent', id: 'jd' },
        { r: 6, u: 'Jane Smith', s: 82, c: 'text-white', b: 'transparent', id: 'js' },
        { r: 7, u: 'Mike Ross', s: 78, c: 'text-white', b: 'transparent', id: 'mr' },
        { r: 8, u: 'Anna Bell', s: 76, c: 'text-white', b: 'transparent', id: 'ab' },
        { r: 9, u: 'Chris Evans', s: 74, c: 'text-white', b: 'transparent', id: 'ce' },
        { r: 10, u: 'Emma Watson', s: 72, c: 'text-white', b: 'transparent', id: 'ew' },
      ])
      
      const sequence = async () => {
        await new Promise(r => setTimeout(r, 500))
        if (demoTabs[activeTab].id !== 'leaderboards') return
        setLeaderboardStep(1) // Show 2nd

        await new Promise(r => setTimeout(r, 800))
        if (demoTabs[activeTab].id !== 'leaderboards') return
        setLeaderboardStep(2) // Show 1st

        await new Promise(r => setTimeout(r, 800))
        if (demoTabs[activeTab].id !== 'leaderboards') return
        setLeaderboardStep(3) // Show 3rd
      }

      sequence()

      // Start dynamic score updates
      const interval = setInterval(() => {
        setLeaderboardData(prevData => {
          // Randomly pick a user to increase score (excluding top 1 to keep it stable or mix it up)
          // Let's make it dynamic so anyone can move up
          const newData = [...prevData]
          const randomIndex = Math.floor(Math.random() * newData.length)
          
          // Increase score by 5-15 points to force overtaking
          newData[randomIndex] = {
            ...newData[randomIndex],
            s: newData[randomIndex].s + Math.floor(Math.random() * 10) + 5
          }
          
          // Sort by score descending
          newData.sort((a, b) => b.s - a.s)
          
          // Update ranks and styles
          return newData.map((user, index) => {
            let color = 'text-white'
            let bg = 'transparent'
            
            if (index === 0) { color = 'text-yellow-400'; bg = 'bg-yellow-400/10' }
            else if (index === 1) { color = 'text-slate-300'; bg = 'bg-slate-400/10' }
            else if (index === 2) { color = 'text-orange-400'; bg = 'bg-orange-400/10' }
            else if (index === 3) { color = 'text-cyan-400' }
            
            return { ...user, r: index + 1, c: color, b: bg }
          })
        })
      }, 1500) // Update every 1.5 seconds

      return () => clearInterval(interval)
    }
  }, [activeTab])

  // Typing animation effect
  useEffect(() => {
    const currentText = typingText[currentTypingIndex]
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentText.length) {
          setDisplayText(currentText.slice(0, displayText.length + 1))
          setTypingSpeed(Math.random() * 100 + 50)
        } else {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(currentText.slice(0, displayText.length - 1))
          setTypingSpeed(25)
        } else {
          setIsDeleting(false)
          setCurrentTypingIndex((prev) => (prev + 1) % typingText.length)
        }
      }
    }, typingSpeed)

    return () => clearTimeout(timer)
  }, [displayText, currentTypingIndex, isDeleting, typingSpeed])

  // Fetch platform statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats/platform')
        if (response.ok) {
          const data = await response.json()
          setPlatformStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch platform stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Auto-scroll effect for Leaderboards
  useEffect(() => {
    const scrollContainer = leaderboardScrollRef.current;
    if (!scrollContainer || demoTabs[activeTab].id !== 'leaderboards') return;

    let scrollPos = 0;
    let direction = 1; // 1 for down, -1 for up
    const scrollSpeed = 0.5;
    let animationFrameId: number;
    let isPaused = false;

    const scroll = () => {
        if (scrollContainer) {
            // Check boundaries
            if (direction === 1 && scrollPos >= scrollContainer.scrollHeight - scrollContainer.clientHeight) {
                direction = -1;
                isPaused = true;
                setTimeout(() => { isPaused = false }, 2000); // Pause at bottom
            } else if (direction === -1 && scrollPos <= 0) {
                direction = 1;
                isPaused = true;
                setTimeout(() => { isPaused = false }, 2000); // Pause at top
            }

            if (!isPaused) {
                scrollPos += scrollSpeed * direction;
                // Clamp scrollPos
                scrollPos = Math.max(0, Math.min(scrollPos, scrollContainer.scrollHeight - scrollContainer.clientHeight));
                scrollContainer.scrollTop = scrollPos;
            }
        }
        animationFrameId = requestAnimationFrame(scroll);
    };

    // Start after a delay
    const startTimeout = setTimeout(() => {
        animationFrameId = requestAnimationFrame(scroll);
    }, 1000);

    return () => {
        clearTimeout(startTimeout);
        cancelAnimationFrame(animationFrameId);
    };
  }, [activeTab]);

  // Auto-scroll effect for Resume Preview
  useEffect(() => {
    if (demoTabs[activeTab].id !== 'resume' || resumeStep !== 7) return;
    
    const scrollContainer = resumePreviewScrollRef.current;
    if (!scrollContainer) return;

    let scrollPos = 0;
    let direction = 1; // 1 for down, -1 for up
    const scrollSpeed = 1.2;
    let animationFrameId: number | null = null;
    let isPaused = false;
    let pauseTimeout: NodeJS.Timeout | null = null;

    const scroll = () => {
        if (scrollContainer && resumeStep === 7 && demoTabs[activeTab].id === 'resume') {
            const maxScroll = Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight);
            
            // Check boundaries with a small threshold
            if (direction === 1 && scrollPos >= maxScroll - 2) {
                direction = -1;
                isPaused = true;
                if (pauseTimeout) clearTimeout(pauseTimeout);
                pauseTimeout = setTimeout(() => { 
                    isPaused = false;
                    pauseTimeout = null;
                }, 2000); // Pause at bottom
            } else if (direction === -1 && scrollPos <= 2) {
                direction = 1;
                isPaused = true;
                if (pauseTimeout) clearTimeout(pauseTimeout);
                pauseTimeout = setTimeout(() => { 
                    isPaused = false;
                    pauseTimeout = null;
                }, 2000); // Pause at top
            }

            if (!isPaused && maxScroll > 0) {
                scrollPos += scrollSpeed * direction;
                // Clamp scrollPos
                scrollPos = Math.max(0, Math.min(scrollPos, maxScroll));
                scrollContainer.scrollTop = scrollPos;
            }
        }
        
        // Continue scrolling if still in preview step
        if (resumeStep === 7 && demoTabs[activeTab].id === 'resume') {
            animationFrameId = requestAnimationFrame(scroll);
        }
    };

    // Start after a delay to ensure container is ready and content is rendered
    const startTimeout = setTimeout(() => {
        if (scrollContainer && resumeStep === 7) {
            scrollContainer.scrollTop = 0; // Reset to top
            scrollPos = 0;
            animationFrameId = requestAnimationFrame(scroll);
        }
    }, 1000);

    return () => {
        clearTimeout(startTimeout);
        if (pauseTimeout) clearTimeout(pauseTimeout);
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }
    };
  }, [activeTab, resumeStep]);

  const renderDemoContent = () => {
    const currentTab = demoTabs[activeTab]
    
    switch (currentTab.id) {
      case 'resume':
        return (
          <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-white">Resume Builder</span>
              </div>
              <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                AI Powered
              </Badge>
            </div>

            {/* Resume Builder UI */}
            <div className="flex-1 overflow-hidden relative">
              <AnimatePresence mode="wait">
                {resumeStep === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full"
                  >
                    <Card className="glass-card border-white/10 h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-white text-lg">
                                <Upload className="h-5 w-5 text-cyan-400" />
                                Upload Files
                            </CardTitle>
                            <CardDescription className="text-gray-300 text-xs">
                                Resume • Certificates • Work Samples
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center bg-white/5 relative">
                                <Upload className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
                                <h3 className="text-sm font-medium text-white mb-1">Drop Files Here</h3>
                                <p className="text-xs text-gray-400 mb-3">PDF, DOC, DOCX</p>
                                <Button size="sm" variant="outline" className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 text-xs h-8">
                                    Browse Files
                                </Button>
                                {simulatedFile && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }}
                                        className="absolute inset-0 bg-gray-900/90 flex items-center justify-center rounded-xl backdrop-blur-sm"
                                    >
                                        <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg border border-white/10">
                                            <FileText className="h-4 w-4 text-cyan-400" />
                                            <span className="text-sm text-white">{simulatedFile.name}</span>
                                            <Check className="h-4 w-4 text-green-400" />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                  </motion.div>
                )}

                {resumeStep === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full"
                    >
                        <Card className="glass-card border-purple-500/30 bg-purple-900/20 h-full overflow-hidden flex flex-col">
                             <div className="p-3 border-b border-purple-500/20 bg-purple-900/40 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                                    <span className="text-sm font-medium text-white">Extracting Data...</span>
                                </div>
                                <span className="text-xs text-purple-300">{Math.round(resumeProgress)}%</span>
                             </div>
                             <div 
                               className="p-3 bg-black/40 font-mono text-xs overflow-y-auto flex-1 space-y-2 max-h-[200px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                               ref={(el) => {
                                 if (el) {
                                   el.scrollTop = el.scrollHeight;
                                 }
                               }}
                             >
                                {resumeLogs.map((log, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-2"
                                    >
                                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                                        <span className={log.includes('✅') ? 'text-green-400' : 'text-gray-300'}>{log}</span>
                                    </motion.div>
                                ))}
                             </div>
                        </Card>
                    </motion.div>
                )}

                {resumeStep === 2 && (
                     <motion.div
                        key="step2"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full flex flex-col justify-center"
                    >
                        <Card className="glass-card border-green-500/30 bg-green-900/10 p-4 text-center">
                             <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-green-500/10">
                                <Check className="h-6 w-6 text-green-400" />
                             </div>
                             <h3 className="text-lg font-bold text-white mb-1">Extraction Complete</h3>
                             <p className="text-sm text-gray-300 mb-4">Your resume has been analyzed and structured.</p>
                             <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white w-full">
                                <Brain className="h-4 w-4 mr-2" />
                                Analyzing with AI...
                             </Button>
                        </Card>
                    </motion.div>
                )}

                {resumeStep === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full"
                    >
                        <Card className="glass-card border-pink-500/30 bg-pink-900/20 h-full overflow-hidden flex flex-col">
                             <div className="p-3 border-b border-pink-500/20 bg-pink-900/40 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-pink-400 animate-pulse" />
                                    <span className="text-sm font-medium text-white">AI Analysis in Progress...</span>
                                </div>
                                <span className="text-xs text-pink-300">{Math.round(resumeProgress)}%</span>
                             </div>
                             <div 
                               className="p-3 bg-black/40 font-mono text-xs overflow-y-auto flex-1 space-y-2 max-h-[200px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                               ref={(el) => {
                                 if (el) {
                                   el.scrollTop = el.scrollHeight;
                                 }
                               }}
                             >
                                {resumeLogs.map((log, i) => (
                                    <motion.div  
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-2"
                                    >
                                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                                        <span className={log.includes('✅') || log.includes('🎉') ? 'text-green-400' : 'text-gray-300'}>{log}</span>
                                    </motion.div>
                                ))}
                             </div>
                        </Card>
                    </motion.div>
                )}

                {resumeStep === 4 && (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full flex flex-col overflow-hidden"
                    >
                        <Card className="glass-card border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 h-full overflow-hidden flex flex-col">
                            <div className="p-3 border-b border-cyan-500/20 bg-cyan-900/40 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <Brain className="h-4 w-4 text-cyan-400" />
                                    <span className="text-sm font-medium text-white">AI Analysis Results</span>
                                </div>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Complete</Badge>
                            </div>
                            <div className="p-3 flex-1 overflow-y-auto space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                {/* Overall Score */}
                                <div className="flex justify-center mb-2">
                                    <div className="relative w-24 h-24">
                                        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                stroke="rgba(255,255,255,0.1)"
                                                strokeWidth="8"
                                                fill="none"
                                            />
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                stroke="url(#gradientScore)"
                                                strokeWidth="8"
                                                fill="none"
                                                strokeDasharray="231 251"
                                                className="transition-all duration-1000"
                                            />
                                            <defs>
                                                <linearGradient id="gradientScore" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#06b6d4" />
                                                    <stop offset="100%" stopColor="#8b5cf6" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">92</div>
                                                <div className="text-[10px] text-gray-400">Score</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Section Analysis */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-white flex items-center gap-1 mb-2">
                                        <BarChart3 className="h-3 w-3 text-blue-400" />
                                        Section Analysis
                                    </h4>
                                    
                                    {/* Contact Section */}
                                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-semibold text-white">Contact</span>
                                            <span className="text-xs font-bold text-green-400">95/100</span>
                                        </div>
                                    </div>

                                    {/* Summary Section */}
                                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-semibold text-white">Summary</span>
                                            <span className="text-xs font-bold text-yellow-400">88/100</span>
                                        </div>
                                    </div>

                                    {/* Experience Section */}
                                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-semibold text-white">Experience</span>
                                            <span className="text-xs font-bold text-yellow-400">90/100</span>
                                        </div>
                                    </div>

                                    {/* Skills Section */}
                                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-400/20">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-semibold text-white">Skills</span>
                                            <span className="text-xs font-bold text-yellow-400">85/100</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendations */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold text-white flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                                        Recommendations
                                    </h4>
                                    <div className="space-y-1.5">
                                        {[
                                            'Add quantifiable achievements to experience',
                                            'Include 2-3 more industry keywords',
                                            'Optimize summary section length'
                                        ].map((rec, i) => (
                                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-green-500/10 border border-green-400/20">
                                                <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                                                    <span className="text-green-400 text-[9px] font-bold">{i + 1}</span>
                                                </div>
                                                <p className="text-[10px] text-white leading-relaxed flex-1">{rec}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 border-t border-cyan-500/20 bg-cyan-900/40 flex-shrink-0">
                                <Button size="sm" className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white text-xs h-7">
                                    <Sparkles className="h-3 w-3 mr-2" />
                                    Build Resume with AI
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {resumeStep === 5 && (
                    <motion.div
                        key="step5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full"
                    >
                        <Card className="glass-card border-cyan-500/30 bg-cyan-900/20 h-full overflow-hidden flex flex-col">
                             <div className="p-3 border-b border-cyan-500/20 bg-cyan-900/40 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-cyan-400 animate-pulse" />
                                    <span className="text-sm font-medium text-white">Building Resume...</span>
                                </div>
                                <span className="text-xs text-cyan-300">{Math.round(resumeProgress)}%</span>
                             </div>
                             <div 
                               className="p-3 bg-black/40 font-mono text-xs overflow-y-auto flex-1 space-y-2 max-h-[200px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                               ref={(el) => {
                                 if (el) {
                                   el.scrollTop = el.scrollHeight;
                                 }
                               }}
                             >
                                {resumeLogs.map((log, i) => (
                                    <motion.div  
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-2"
                                    >
                                        <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span>
                                        <span className={log.includes('✅') || log.includes('🎉') ? 'text-green-400' : 'text-gray-300'}>{log}</span>
                                    </motion.div>
                                ))}
                             </div>
                        </Card>
                    </motion.div>
                )}

                {(resumeStep === 6 || resumeStep === 6.5) && (
                     <motion.div
                        key="step6"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full flex flex-col justify-center"
                    >
                        <Card className="glass-card border-green-500/30 bg-green-900/10 p-4 text-center">
                             <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-green-500/10">
                                <CheckCircle2 className="h-6 w-6 text-green-400" />
                             </div>
                             <h3 className="text-lg font-bold text-white mb-1">Resume Built!</h3>
                             <p className="text-sm text-gray-300 mb-4">Your professional resume is ready to download.</p>
                             <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    className={`flex-1 text-white transition-all duration-300 ${
                                        resumeStep === 6.5 
                                            ? 'bg-gradient-to-r from-cyan-600 to-blue-700 scale-95 ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/50' 
                                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
                                    }`}
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {resumeStep === 6.5 ? 'Opening...' : 'View Resume'}
                                </Button>
                                <Button size="sm" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                             </div>
                        </Card>
                    </motion.div>
                )}

                {resumeStep === 7 && (
                    <motion.div
                        key="step7"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="h-full flex flex-col overflow-hidden"
                    >
                        <Card className="glass-card border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 h-full overflow-hidden flex flex-col">
                            <div className="p-2 border-b border-cyan-500/20 bg-cyan-900/40 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-3 w-3 text-cyan-400" />
                                    <span className="text-xs font-medium text-white">Resume Preview</span>
                                </div>
                                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[9px]">Live Preview</Badge>
                            </div>
                            <div 
                                ref={resumePreviewScrollRef}
                                className="flex-1 overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                            >
                                {/* Resume Content - White Background */}
                                <div className="bg-white rounded-lg shadow-lg p-3 text-gray-900 text-[10px] leading-relaxed">
                                    {/* Header */}
                                    <div className="text-center mb-3">
                                        <h1 className="text-base font-bold text-gray-900 mb-1">Maria Santos</h1>
                                        <p className="text-sm font-semibold text-gray-800 mb-1">Customer Service Representative</p>
                                        <p className="text-xs text-gray-600">Manila, Philippines</p>
                                    </div>

                                    {/* Divider */}
                                    <div className="w-full h-0.5 bg-gray-400 opacity-30 my-3"></div>

                                    {/* Professional Summary */}
                                    <div className="mb-3">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <div className="w-0.5 h-3 bg-cyan-600 rounded-full"></div>
                                            <h2 className="text-xs font-semibold text-gray-900">Professional Summary</h2>
                                        </div>
                                        <p className="text-[9px] text-gray-700 pl-2 border-l-2 border-gray-200 leading-relaxed">
                                            Experienced Customer Service Representative with 5+ years in BPO industry. 
                                            Specialized in handling customer inquiries, resolving complaints, and maintaining 
                                            high satisfaction rates. Proficient in CRM systems and multilingual support.
                                        </p>
                                    </div>

                                    {/* Work Experience */}
                                    <div className="mb-3">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <div className="w-0.5 h-3 bg-cyan-600 rounded-full"></div>
                                            <h2 className="text-xs font-semibold text-gray-900">Work Experience</h2>
                                        </div>
                                        <div className="space-y-2 pl-2 border-l-2 border-gray-300">
                                            <div>
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h3 className="text-[10px] font-semibold text-gray-900">Senior CSR</h3>
                                                    <span className="text-[8px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">2020 - Present</span>
                                                </div>
                                                <p className="text-[9px] text-gray-600 font-medium mb-0.5">ShoreAgents Inc.</p>
                                                <p className="text-[9px] text-gray-700">Managed customer accounts, resolved 200+ tickets monthly, achieved 98% satisfaction rate.</p>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h3 className="text-[10px] font-semibold text-gray-900">Customer Service Rep</h3>
                                                    <span className="text-[8px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">2018 - 2020</span>
                                                </div>
                                                <p className="text-[9px] text-gray-600 font-medium mb-0.5">BPO Solutions</p>
                                                <p className="text-[9px] text-gray-700">Handled inbound calls, processed orders, maintained customer database.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Education */}
                                    <div className="mb-3">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <div className="w-0.5 h-3 bg-cyan-600 rounded-full"></div>
                                            <h2 className="text-xs font-semibold text-gray-900">Education</h2>
                                        </div>
                                        <div className="space-y-1.5 pl-2 border-l-2 border-gray-300">
                                            <div>
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h3 className="text-[10px] font-semibold text-gray-900">Bachelor of Arts</h3>
                                                    <span className="text-[8px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">2018</span>
                                                </div>
                                                <p className="text-[9px] text-gray-600 font-medium">University of the Philippines</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <div className="w-0.5 h-3 bg-cyan-600 rounded-full"></div>
                                            <h2 className="text-xs font-semibold text-gray-900">Skills</h2>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pl-2">
                                            <div>
                                                <h3 className="text-[9px] font-medium text-gray-900 mb-1">Technical</h3>
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="text-[8px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">CRM Systems</span>
                                                    <span className="text-[8px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">Zendesk</span>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-[9px] font-medium text-gray-900 mb-1">Soft Skills</h3>
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="text-[8px] border border-gray-300 text-gray-700 px-1.5 py-0.5 rounded">Communication</span>
                                                    <span className="text-[8px] border border-gray-300 text-gray-700 px-1.5 py-0.5 rounded">Problem Solving</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )

      case 'tools':
        return (
          <div className="space-y-4 h-full flex flex-col">
             <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-white">Career Games</span>
              </div>
              <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                Interactive Demo
              </Badge>
            </div>
            
            <div className="flex-1 relative overflow-hidden rounded-xl border border-white/10 bg-black/50">
              <AnimatePresence mode="wait">
                {gameDemoStep !== 1 ? (
                  <motion.div
                    key="typing-hero"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex flex-col h-full w-full"
                  >
                     {/* Typing Hero Demo */}
                     <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-cyan-400 to-purple-400 z-20"></div>
                     
                     {/* Stats Header */}
                     <div className="p-3 flex justify-between items-center bg-slate-900/90 border-b border-white/10 z-10 relative">
                        <div className="flex items-center gap-2">
                            <Keyboard className="w-4 h-4 text-green-400" />
                            <h4 className="text-sm font-bold text-white">Typing Hero</h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                           <div className="flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-yellow-400" />
                              <span className="text-white font-bold">2,450</span>
                           </div>
                           <div className="font-bold text-cyan-400">45 WPM</div>
                        </div>
                     </div>

                     {/* Game Area */}
                     <div className="flex-1 relative overflow-hidden bg-gradient-to-b from-gray-900/50 to-gray-800/50 w-full">
                        {/* Lane Dividers */}
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className="absolute top-0 bottom-0 w-px bg-cyan-400/10" style={{ left: `${(i + 1) * 20}%` }} />
                        ))}
                        
                        {/* Danger Zone */}
                        <div className="absolute bottom-[15%] left-0 right-0 h-[15%] border-t-2 border-b-2 border-red-400/30 bg-red-400/5 flex items-center justify-center">
                           <span className="text-red-400/40 text-[10px] font-bold tracking-widest">DANGER ZONE</span>
                        </div>

                        {/* Falling Word */}
                        <motion.div
                            key={`word-${typingWords[typingWordIndex]}`}
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 150, opacity: 1 }}
                            transition={{ duration: 2, ease: "linear" }}
                            className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-blue-500/80 text-white text-xs font-bold px-2 py-1 rounded shadow-lg shadow-blue-500/20"
                        >
                            {typingWords[typingWordIndex]}
                        </motion.div>

                        {/* Effect */}
                        <AnimatePresence>
                            {typingDemoEffect && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.5, y: 100 }}
                                    animate={{ opacity: 1, scale: 1.2, y: 80 }}
                                    exit={{ opacity: 0, scale: 1.5 }}
                                    className="absolute top-0 left-1/2 transform -translate-x-1/2 text-green-400 font-bold text-sm flex items-center gap-1 z-20"
                                >
                                    <span>🔥</span> {typingDemoEffect}
                                </motion.div>
                            )}
                        </AnimatePresence>
                     </div>

                     {/* Input Area */}
                     <div className="p-3 bg-gray-800/90 border-t border-white/10 relative z-10 w-full">
                        <div className="bg-gray-900/50 border border-white/20 rounded px-3 py-2 flex items-center shadow-inner">
                            <span className="text-green-400 font-mono text-sm">{typingDemoWord}</span>
                            <span className="w-1.5 h-4 bg-green-400 animate-pulse ml-0.5"></span>
                        </div>
                        <div className="text-[10px] text-gray-500 text-center mt-1">Type the falling words!</div>
                     </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="disc-demo"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex flex-col h-full w-full"
                  >
                    {/* DISC Demo */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 z-20"></div>
                    
                    {/* Header */}
                    <div className="p-3 flex justify-between items-center bg-slate-900/90 border-b border-white/10 z-10 relative">
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-purple-400" />
                            <h4 className="text-sm font-bold text-white">BPOC DISC</h4>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px] px-1.5">Personality</Badge>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 flex flex-col justify-center bg-gradient-to-br from-slate-900/50 to-purple-900/10 w-full relative overflow-hidden">
                        {/* Scenario Card */}
                        <motion.div 
                            key={`scenario-${discScenarioIndex}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white/5 border border-purple-500/20 rounded-lg p-3 mb-3 backdrop-blur-sm relative z-10"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{discScenarios[discScenarioIndex].context === 'WORK' ? '💼' : '👨‍👩‍👧‍👦'}</span>
                                <span className="text-xs font-bold text-purple-300 uppercase">{discScenarios[discScenarioIndex].context} Context</span>
                            </div>
                            <h4 className="text-sm font-bold text-white mb-1">{discScenarios[discScenarioIndex].title}</h4>
                        </motion.div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 gap-2 relative z-10">
                            {discScenarios[discScenarioIndex].options.map((option, idx) => (
                                <motion.div 
                                    key={`option-${idx}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`text-xs p-2 rounded border transition-all duration-300 flex items-center gap-2 ${
                                        discSelectedOption === idx 
                                            ? 'bg-green-500/20 border-green-500/50 text-white scale-105 shadow-lg shadow-green-500/10' 
                                            : 'bg-white/5 border-white/10 text-gray-300'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] border ${
                                        discSelectedOption === idx ? 'bg-green-500 border-green-400 text-white' : 'bg-white/10 border-white/20 text-gray-400'
                                    }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    {option.text}
                                </motion.div>
                            ))}
                        </div>
                        
                        {/* Animal Reaction Overlay */}
                        <AnimatePresence>
                          {discReaction && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center z-20 bg-black/60 backdrop-blur-sm"
                            >
                              <div className="text-center">
                                <motion.div 
                                  animate={{ rotate: [0, 10, -10, 0] }}
                                  transition={{ repeat: Infinity, duration: 1 }}
                                  className="text-6xl mb-2"
                                >
                                  {discReaction.animal}
                                </motion.div>
                                <div className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold border border-purple-500/30">
                                  {discReaction.trait} Spirit!
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <div className="mt-3 text-center">
                            <span className="text-[10px] text-purple-300 animate-pulse">Auto Demo Running...</span>
                        </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )

      case 'jobs':
        return (
          <div className="space-y-4 h-full flex flex-col">
             <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-white">Job Matching</span>
              </div>
              <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                AI Powered
              </Badge>
            </div>

            {/* Search & Filter Bar Simulation */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="w-3 h-3 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <div className="h-8 w-full bg-white/10 border border-white/20 rounded-md pl-7 pr-2 flex items-center text-xs text-gray-400">
                        Search jobs...
                    </div>
                </div>
                <div className="h-8 px-2 bg-white/10 border border-white/20 rounded-md flex items-center text-xs text-gray-300 gap-1">
                    <span>Remote</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </div>
            </div>
            
            {/* Job List */}
            <div className="flex-1 grid grid-cols-2 gap-3 overflow-y-auto pb-6 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {/* Success Modal Overlay */}
                <AnimatePresence>
                  {showJobSuccessModal && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-0 z-50 flex items-center justify-center p-4"
                    >
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-lg"></div>
                      <Card className="glass-card border-green-500/30 bg-gray-900/90 w-full max-w-sm relative z-10 shadow-2xl">
                        <CardContent className="p-6 text-center">
                          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 ring-4 ring-green-500/10">
                            <CheckCircle2 className="h-6 w-6 text-green-400" />
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2">Application Sent!</h3>
                          <p className="text-xs text-gray-300 mb-4">
                            Your application has been submitted successfully.
                          </p>
                          <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white h-8 text-xs">
                            View Applications
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Job Card 1 */}
                <Card className="glass-card border-white/10 hover:border-purple-400/30 transition-all cursor-pointer group h-full">
                    <CardContent className="p-3 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center text-base shrink-0">
                                    🏢
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-medium text-white text-xs truncate">ShoreAgents</p>
                                        <Badge className="bg-red-600/20 text-red-400 border-red-600/30 px-1 py-0 text-[9px] font-semibold shrink-0">
                                            🚨 URGENT
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-gray-400 truncate">2 days ago</p>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xs font-bold text-white mb-2 line-clamp-1">Customer Service Rep</h2>

                        <div className="flex flex-wrap gap-1 mb-auto">
                            <Badge className="bg-white/10 text-gray-300 border-white/20 px-1.5 py-0 text-[9px]">Full-time</Badge>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-1.5 py-0 text-[9px]">
                                <Building2 className="w-2.5 h-2.5 mr-1" /> Remote
                            </Badge>
                        </div>

                        <div className="mt-3 space-y-2">
                            <Badge className="w-full justify-center bg-emerald-500/20 text-emerald-400 border-emerald-500/30 px-2 py-0.5 text-[10px]">
                                98% Match
                            </Badge>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-green-400 font-semibold text-xs">
                                    <DollarSign className="w-3 h-3 mr-0.5" />
                                    <span>25k-35k</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  className={`h-7 text-[10px] border-0 px-3 transition-all duration-300 ${
                                    jobApplied 
                                      ? 'bg-gray-600/50 hover:bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                                      : `bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white ${
                                          jobsDemoTargetId === 0 ? 'scale-110 ring-2 ring-purple-400 shadow-lg shadow-purple-500/50' : ''
                                        } ${jobsDemoStep === 1 && jobsDemoTargetId === 0 ? 'scale-95 opacity-80' : ''}`
                                  }`}
                                >
                                    {jobApplied 
                                      ? 'Already Applied' 
                                      : jobsDemoStep >= 1 && jobsDemoTargetId === 0 
                                        ? 'Applying...' 
                                        : 'Apply'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Job Card 2 */}
                <Card className="glass-card border-white/10 hover:border-purple-400/30 transition-all cursor-pointer group h-full">
                    <CardContent className="p-3 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center text-base shrink-0">
                                    🚀
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-medium text-white text-xs truncate">ShoreAgents</p>
                                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 px-1 py-0 text-[9px] font-semibold shrink-0">
                                            ✅ HIRING
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-gray-400 truncate">5h ago</p>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-xs font-bold text-white mb-2 line-clamp-1">Tech Support Specialist</h2>

                        <div className="flex flex-wrap gap-1 mb-auto">
                            <Badge className="bg-white/10 text-gray-300 border-white/20 px-1.5 py-0 text-[9px]">Full-time</Badge>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-1.5 py-0 text-[9px]">
                                <Clock className="w-2.5 h-2.5 mr-1" /> Day
                            </Badge>
                        </div>

                        <div className="mt-3 space-y-2">
                            <Badge className="w-full justify-center bg-green-500/20 text-green-400 border-green-500/30 px-2 py-0.5 text-[10px]">
                                85% Match
                            </Badge>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center text-green-400 font-semibold text-xs">
                                    <DollarSign className="w-3 h-3 mr-0.5" />
                                    <span>30k-45k</span>
                                </div>
                                <Button 
                                  size="sm" 
                                  className="h-7 text-[10px] bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 px-3"
                                >
                                    Apply
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        )

      case 'talent':
        return (
          <div className="space-y-2 h-full flex flex-col relative">
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-white">Talent Search</span>
              </div>
              <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                Find Candidates
              </Badge>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                {/* Search Bar */}
                <div className="relative mb-3 flex-shrink-0">
                    <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-500" />
                    <div className="w-full h-8 pl-8 pr-3 bg-white/5 border border-white/10 rounded-md text-xs text-gray-300 flex items-center">
                        {talentSearchQuery}
                        {talentDemoStep === 1 && <span className="animate-pulse">|</span>}
                </div>
            </div>

                {/* Filters */}
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0 scrollbar-hide">
                    <div className="h-6 px-2 bg-cyan-500/20 text-cyan-400 text-[10px] rounded-md flex items-center border border-cyan-500/30 whitespace-nowrap">
                        Top Rated
                    </div>
                    <div className="h-6 px-2 bg-white/5 text-gray-400 text-[10px] rounded-md flex items-center border border-white/10 whitespace-nowrap">
                        Available Now
                </div>
                    <div className="h-8 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-md flex items-center px-3 text-xs text-white font-medium gap-1 ml-auto">
                        <RefreshCw className={`w-3 h-3 ${talentDemoStep === 2 ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                </div>
            </div>

            {/* Candidates Grid */}
            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 grid grid-cols-2 gap-3 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {talentDemoStep === 2 ? (
                        <div className="col-span-2 flex flex-col items-center justify-center h-32 space-y-2">
                            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                            <span className="text-xs text-gray-400">Finding best matches...</span>
                        </div>
                    ) : talentDemoStep >= 3 ? (
                     <>
                 {/* Candidate 1 */}
                <Card className="glass-card border-white/10 hover:border-white/20 transition-all duration-300 group relative overflow-hidden">
                    {/* Profile Header */}
                    <div className="relative h-14 w-full flex justify-center">
                         <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base mx-auto mt-3 shadow-lg border-2 bg-gradient-to-br from-cyan-500 to-purple-600 border-cyan-400 ring-2 ring-cyan-400/30 relative z-10">
                            RJ
                        </div>
                    </div>

                    <CardContent className="p-3 pt-0 text-center relative z-10 pb-3">
                        {/* Name & Badge */}
                        <div className="mb-1.5">
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                                <h3 className="text-xs font-bold text-white">Rica</h3>
                                <div className="w-3 h-3 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg border border-cyan-300/30">
                                    <Check className="w-2 h-2 text-white font-bold" />
                                </div>
                            </div>
                            <p className="text-[9px] text-gray-400">@ricaj</p>
                        </div>

                        {/* Score & Rank */}
                        <div className="flex flex-wrap justify-center gap-1 mb-2">
                            <div className="flex items-center gap-1">
                                <Trophy className="w-2.5 h-2.5 text-yellow-400" />
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                    98
                                </span>
                            </div>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-medium bg-cyan-400/30 text-cyan-200 border border-cyan-400/50">
                                💎 Diamond
                            </span>
                        </div>

                        {/* Details */}
                        <div className="flex justify-center items-center gap-2 mb-2 text-[8px] text-gray-300">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-2 h-2 text-cyan-400" />
                                <span>Manila</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-2 h-2 text-purple-400" />
                                <span>Oct 23</span>
                            </div>
                        </div>

                        <Button size="sm" className="w-full h-6 text-[9px] bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20">
                            <Eye className="w-2.5 h-2.5 mr-1" />
                            View Profile
                        </Button>
                    </CardContent>
                    
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Card>
                
                {/* Candidate 2 */}
                        <Card className="glass-card border-white/10 hover:border-white/20 transition-all duration-300 group relative overflow-hidden opacity-60">
                    {/* Profile Header */}
                    <div className="relative h-14 w-full flex justify-center">
                         <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base mx-auto mt-3 shadow-lg border-2 bg-gradient-to-br from-orange-500 to-red-600 border-slate-300 ring-2 ring-slate-300/30 relative z-10">
                            MS
                        </div>
                    </div>

                    <CardContent className="p-3 pt-0 text-center relative z-10 pb-3">
                        {/* Name & Badge */}
                        <div className="mb-1.5">
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                                <h3 className="text-xs font-bold text-white">Maria</h3>
                            </div>
                            <p className="text-[9px] text-gray-400">@marias</p>
                        </div>

                        {/* Score & Rank */}
                        <div className="flex flex-wrap justify-center gap-1 mb-2">
                            <div className="flex items-center gap-1">
                                <Trophy className="w-2.5 h-2.5 text-yellow-400" />
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                    85
                                </span>
                            </div>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-medium bg-slate-400/30 text-slate-200 border border-slate-400/50">
                                🥈 Platinum
                            </span>
                        </div>

                        {/* Details */}
                        <div className="flex justify-center items-center gap-2 mb-2 text-[8px] text-gray-300">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-2 h-2 text-cyan-400" />
                                <span>Cebu</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-2 h-2 text-purple-400" />
                                <span>Nov 23</span>
                            </div>
                        </div>

                        <Button size="sm" className="w-full h-6 text-[9px] bg-gradient-to-br from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20">
                            <Eye className="w-2.5 h-2.5 mr-1" />
                            View Profile
                        </Button>
                    </CardContent>
                    
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Card>
                     </>
                    ) : (
                        <div className="col-span-2 flex items-center justify-center h-32 text-gray-500 text-xs">
                            Start typing to search...
                        </div>
                    )}
                </div>
            </div>
          </div>
        )

      case 'leaderboards':
        return (
          <div className="space-y-2 h-full flex flex-col">
            <div className="flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-white">Leaderboards</span>
              </div>
              <Badge variant="outline" className="text-xs border-white/20 text-gray-400">
                Hall of Fame
              </Badge>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                {/* Podium */}
                <div className="flex items-end justify-center gap-3 mb-1 h-24 flex-shrink-0 pt-3">
                    {(() => {
                      const top3 = leaderboardData.slice(0, 3)
                      const second = top3[1] // 2nd place (index 1)
                      const first = top3[0]   // 1st place (index 0)
                      const third = top3[2]    // 3rd place (index 2)
                      
                      const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('')
                      
                      return (
                        <>
                    {/* 2nd */}
                          <motion.div 
                              layout
                              key={`podium-2-${second?.id || 'empty'}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={leaderboardStep >= 1 ? { opacity: 1, y: 0 } : {}}
                              transition={{ type: "spring", bounce: 0.5, layout: { duration: 0.5 } }}
                              className="flex flex-col items-center"
                          >
                        <div className="w-6 h-6 rounded-full bg-slate-300/20 border border-slate-300/50 flex items-center justify-center text-[10px] font-bold text-slate-300 mb-0.5 shadow-lg">
                                  {second ? getInitials(second.u) : 'MS'}
                        </div>
                        <div className="bg-gradient-to-t from-slate-500/50 to-slate-400/20 w-12 h-10 rounded-t-lg flex items-end justify-center pb-1 border-t border-x border-slate-400/30 relative group">
                            <span className="text-xs font-bold text-slate-300">2</span>
                            <div className="absolute inset-0 bg-slate-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg" />
                        </div>
                          </motion.div>
                    {/* 1st */}
                          <motion.div 
                              layout
                              key={`podium-1-${first?.id || 'empty'}`}
                              initial={{ opacity: 0, y: 30 }}
                              animate={leaderboardStep >= 2 ? { opacity: 1, y: 0 } : {}}
                              transition={{ type: "spring", bounce: 0.6, layout: { duration: 0.5 } }}
                              className="flex flex-col items-center"
                          >
                        <div className="relative mb-0.5">
                            <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 animate-bounce">
                                <Crown className="w-3 h-3 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                            </div>
                            <div className="w-7 h-7 rounded-full bg-yellow-400/20 border-2 border-yellow-400/50 flex items-center justify-center text-[10px] font-bold text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.3)] relative z-10">
                                      {first ? getInitials(first.u) : 'RJ'}
                            </div>
                        </div>
                        <div className="bg-gradient-to-t from-yellow-500/50 to-yellow-400/20 w-14 h-14 rounded-t-lg flex items-end justify-center pb-1 border-t border-x border-yellow-400/30 shadow-[0_0_20px_rgba(250,204,21,0.15)] relative group">
                            <span className="text-sm font-bold text-yellow-300">1</span>
                            <div className="absolute inset-0 bg-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg" />
                        </div>
                          </motion.div>
                    {/* 3rd */}
                          <motion.div 
                              layout
                              key={`podium-3-${third?.id || 'empty'}`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={leaderboardStep >= 3 ? { opacity: 1, y: 0 } : {}}
                              transition={{ type: "spring", bounce: 0.5, layout: { duration: 0.5 } }}
                              className="flex flex-col items-center"
                          >
                        <div className="w-6 h-6 rounded-full bg-orange-400/20 border border-orange-400/50 flex items-center justify-center text-[10px] font-bold text-orange-300 mb-0.5 shadow-lg">
                                  {third ? getInitials(third.u) : 'DK'}
                        </div>
                        <div className="bg-gradient-to-t from-orange-500/50 to-orange-400/20 w-12 h-8 rounded-t-lg flex items-end justify-center pb-1 border-t border-x border-orange-400/30 relative group">
                            <span className="text-xs font-bold text-orange-300">3</span>
                            <div className="absolute inset-0 bg-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg" />
                        </div>
                          </motion.div>
                        </>
                      )
                    })()}
                </div>

                {/* Table */}
                <Card className="glass-card border-white/10 flex-1 flex flex-col overflow-hidden min-h-0">
                    <div className="grid grid-cols-12 gap-2 p-2 bg-white/5 text-[9px] font-semibold text-gray-400 border-b border-white/10 uppercase tracking-wider">
                        <div className="col-span-2 text-center">Rank</div>
                        <div className="col-span-7">User</div>
                        <div className="col-span-3 text-right">Score</div>
                    </div>
                    <div 
                        ref={leaderboardScrollRef}
                        className="flex-1 overflow-y-auto divide-y divide-white/5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pb-2"
                    >
                         {leaderboardData.map((row, index) => (
                            <motion.div 
                                layout
                                key={row.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={leaderboardStep >= 3 ? { opacity: 1, x: 0 } : {}}
                                transition={{ 
                                    opacity: { delay: index * 0.1 },
                                    x: { delay: index * 0.1 },
                                    layout: { duration: 0.5 }
                                }}
                                className={`grid grid-cols-12 gap-2 p-2 text-xs items-center hover:bg-white/5 transition-colors ${row.r <= 3 ? row.b : ''}`}
                            >
                                <div className="col-span-2 text-center font-bold text-white">#{row.r}</div>
                                <div className="col-span-7 flex items-center gap-2 min-w-0">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border border-white/10 bg-white/5 flex-shrink-0`}>
                                        {row.u.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span className="text-gray-300 truncate">{row.u}</span>
                                    {row.r === 1 && <Crown className="w-2.5 h-2.5 text-yellow-400 flex-shrink-0" />}
                                </div>
                                <div className={`col-span-3 text-right font-bold ${row.c}`}>{row.s}</div>
                            </motion.div>
                         ))}
                    </div>
                </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black cyber-grid pt-24 pb-8">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 px-4 py-2 text-sm">
                🚀 Revolutionizing BPO Recruitment
              </Badge>
            </motion.div>

            {/* Main Heading */}
            <div className="space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
              >
                <span className="text-white">BPOC.IO</span>
                <br />
                <span className="gradient-text">Where BPO</span>
                <br />
                <span className="text-white">Careers Begin</span>
              </motion.h1>

              {/* Typing Animation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="h-12 flex items-center"
              >
                <span className="text-xl md:text-2xl text-cyan-400 font-medium">
                  {displayText}
                  <span className="animate-pulse">|</span>
                </span>
              </motion.div>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl"
            >
              AI-powered <span className="text-cyan-400 font-semibold">resume builder</span>, <span className="text-purple-400 font-semibold">career games</span>, and <span className="text-green-400 font-semibold">job matching</span> designed specifically for Filipino BPO professionals. Land your dream job with confidence.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Button 
                size="lg" 
                onClick={handleBuildResume}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-lg shadow-red-500/25 relative group overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                <span className="relative z-10 flex items-center">
                  Build Your Resume
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex items-center space-x-8 pt-6 border-t border-white/10"
            >
               <div className="text-center">
                 <div className="text-2xl font-bold text-cyan-400">
                   {loading ? '...' : formatNumber(platformStats.activeResumes)}
                 </div>
                 <div className="text-sm text-gray-400">Active Resumes</div>
               </div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-green-400">
                   {loading ? '...' : formatNumber(platformStats.activeJobs)}
                 </div>
                 <div className="text-sm text-gray-400">Active Jobs</div>
               </div>
               <div className="text-center">
                 <div className="text-2xl font-bold text-purple-400">
                   {loading ? '...' : formatNumber(platformStats.totalUsers)}
                 </div>
                 <div className="text-sm text-gray-400">Total Users</div>
               </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Interactive Demo/Visual */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            {/* Main Platform Demo Card */}
            <div className="glass-card p-4 rounded-2xl relative overflow-hidden h-[500px] lg:h-[550px] flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-green-400 rounded-t-2xl"></div>
              
              {/* Demo Header */}
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <AnimatedLogo className="w-full h-full" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">BPOC.IO</h3>
                    <p className="text-sm text-gray-400">Interactive Demo</p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <Play className="w-3 h-3 mr-1" />
                  Demo
                </Badge>
              </div>

              {/* Demo Navigation Tabs */}
              <div className="flex space-x-2 mb-4 flex-wrap gap-y-2 flex-shrink-0">
                {demoTabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(index)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all duration-300 flex items-center ${
                      activeTab === index 
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' 
                        : 'bg-white/10 text-gray-400 border-white/20 hover:bg-white/20'
                    }`}
                  >
                    <tab.icon className="w-3 h-3 mr-1" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Demo Content */}
              <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className={`h-full ${activeTab >= 2 ? '' : 'pointer-events-none select-none'}`}
                  >
                    {renderDemoContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Floating Achievement Cards */}
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="absolute -top-4 -right-4 glass-card p-3 rounded-lg z-20"
            >
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-sm font-medium text-white">Gold Rank</div>
                  <div className="text-xs text-gray-400">+150 XP</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ 
                y: [0, 10, 0],
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 1
              }}
              className="absolute -bottom-4 -left-4 glass-card p-3 rounded-lg z-20"
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-sm font-medium text-white">+45% Salary</div>
                  <div className="text-xs text-gray-400">Career Growth</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center"
      >
        <div className="text-sm text-gray-400 mb-2">Discover More</div>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1 h-3 bg-gradient-to-b from-cyan-400 to-transparent rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}