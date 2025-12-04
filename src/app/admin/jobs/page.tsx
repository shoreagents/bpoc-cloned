'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { getSessionToken } from '@/lib/auth-helpers'
import { Plus, MoreHorizontal, Edit, Trash2, MapPin, User, CheckCircle, AlertCircle, Pause, X, Loader2, Briefcase } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import AdminLayout from '@/components/layout/AdminLayout'
import React from 'react'

const industryOptions = [
  'Technology','Healthcare','Finance/Banking','Education','Manufacturing','Retail/E-commerce','Real Estate','Marketing/Advertising','Hospitality/Tourism','Construction','Government','Non-profit','Transportation/Logistics','Media/Entertainment','Food & Beverage','Others',
]
const departmentOptions = [
  'Engineering','Information Technology (IT)','Sales','Marketing','Human Resources','Finance/Accounting','Operations','Customer Service','Administration','Research & Development','Legal','Design/Creative','Project Management','Quality Assurance','Business Development','Supply Chain','Others',
]

// Helper function to format time display
const formatTimeAgo = (postedDays: number, createdAt?: string) => {
  if (postedDays > 0) {
    return `${postedDays}d ago`
  }
  
  if (createdAt) {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMs = now.getTime() - created.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}h ago`
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ago`
    }
  }
  
  return 'Just now'
}

interface JobCard {
  id: string
  company: string
  companyLogo: string
  title: string
  location: string
  locationType: 'on-site' | 'remote' | 'hybrid'
  salary: string
  employmentType: string[]
  postedDays: number
  applicants: number
  status: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  source?: 'original'
  applicationDeadline?: string
  createdAt?: string
  workArrangement?: string
  experienceLevel?: string
  shift?: string
  industry?: string
  department?: string
  jobDescription?: string
  requirements?: string | string[]
  responsibilities?: string | string[]
  benefits?: string | string[]
  skills?: string | string[]
}

interface StatusColumn {
  id: string
  title: string
  color: string
  icon: any
}

function JobsPage() {
  const [jobs, setJobs] = useState<JobCard[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [columns, setColumns] = useState<StatusColumn[]>([
    { id: 'job-request', title: 'New Job Request', color: 'bg-yellow-500', icon: Pause },
    { id: 'hiring', title: 'Active/Hiring', color: 'bg-green-500', icon: CheckCircle },
    { id: 'closed', title: 'Closed', color: 'bg-gray-500', icon: X }
  ])
  const [draggedJob, setDraggedJob] = useState<string | null>(null)
  const [isAddJobDialogOpen, setIsAddJobDialogOpen] = useState(false)
  const [isAddStatusDialogOpen, setIsAddStatusDialogOpen] = useState(false)
  const [isEditJobDialogOpen, setIsEditJobDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [jobToDelete, setJobToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [members, setMembers] = useState<Array<{ company_id: string, company: string }>>([])
  const [addingQuickJob, setAddingQuickJob] = useState<boolean>(false)
  const [editingJob, setEditingJob] = useState<any | null>(null)
  const [isImproving, setIsImproving] = useState<boolean>(false)
  const [isImprovingNew, setIsImprovingNew] = useState<boolean>(false)
  const [pendingChanges, setPendingChanges] = useState<any>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [newJobData, setNewJobData] = useState({
    company: '',
    title: '',
    salary: '',
    salaryMin: '' as string | number,
    salaryMax: '' as string | number,
    salaryType: 'monthly',
    workArrangement: 'onsite',
    experienceLevel: '' as '' | 'entry-level' | 'mid-level' | 'senior-level',
    applicationDeadline: '' as string,
    industry: '',
    department: '',
    requirements: '' as string,
    responsibilities: '' as string,
    benefits: '' as string,
    skills: '' as string,
    jobDescription: '' as string,
    status: 'job-request',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    shift: 'day' as 'day' | 'night'
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Refs for auto-resizing textareas
  const jobDescriptionRef = useRef<HTMLTextAreaElement>(null)
  const requirementsRef = useRef<HTMLTextAreaElement>(null)
  const responsibilitiesRef = useRef<HTMLTextAreaElement>(null)
  const benefitsRef = useRef<HTMLTextAreaElement>(null)
  const skillsRef = useRef<HTMLTextAreaElement>(null)
  
  // Auto-resize textarea function
  const autoResizeTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }
  
  // Effect to auto-resize textareas when content changes
  useEffect(() => {
    autoResizeTextarea(jobDescriptionRef.current)
    autoResizeTextarea(requirementsRef.current)
    autoResizeTextarea(responsibilitiesRef.current)
    autoResizeTextarea(benefitsRef.current)
    autoResizeTextarea(skillsRef.current)
  }, [newJobData.jobDescription, newJobData.requirements, newJobData.responsibilities, newJobData.benefits, newJobData.skills])
  const [isValidating, setIsValidating] = useState(false)

  // Format salary input with commas for better readability
  const formatSalaryInput = (value: string) => {
    // Remove all non-numeric characters except decimal points
    const numericValue = value.replace(/[^\d.]/g, '')
    // Add commas for thousands separator
    if (numericValue) {
      const parts = numericValue.split('.')
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return parts.join('.')
    }
    return numericValue
  }
  const [newStatusData, setNewStatusData] = useState({
    title: '',
    color: 'bg-blue-500'
  })

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        setLoadError(null)
        const token = await getSessionToken()
        if (!token) throw new Error('Not authenticated')
        const res = await fetch('/api/admin/jobs', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to load jobs')
        }
        const data = await res.json()
        setJobs(data.jobs || [])

        // load members for company dropdown
        const mres = await fetch('/api/admin/members', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        })
        if (mres.ok) {
          const mdata = await mres.json()
          const existingMembers = mdata.members || []
          
          // Add ShoreAgents if it doesn't already exist
          const hasShoreAgents = existingMembers.some((member: any) => member.company === 'ShoreAgents')
          if (!hasShoreAgents) {
            existingMembers.unshift({ company_id: 'shoreagents', company: 'ShoreAgents' })
          }
          
          setMembers(existingMembers)
        } else {
          // If API fails, at least provide ShoreAgents as an option
          setMembers([{ company_id: 'shoreagents', company: 'ShoreAgents' }])
        }
      } catch (e) {
        console.error('Failed to load job requests', e)
        setLoadError(e instanceof Error ? e.message : 'Failed to load jobs')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    // Prevent dragging closed jobs
    if (job?.status === 'closed') {
      e.preventDefault()
      return
    }
    setDraggedJob(jobId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', jobId)
    // Set drag image for smoother visual feedback
    const target = e.currentTarget as HTMLElement
    if (target) {
      const dragImage = target.cloneNode(true) as HTMLElement
      dragImage.style.opacity = '0.8'
      dragImage.style.transform = 'rotate(2deg)'
      document.body.appendChild(dragImage)
      dragImage.style.position = 'absolute'
      dragImage.style.top = '-1000px'
      e.dataTransfer.setDragImage(dragImage, e.clientX - target.getBoundingClientRect().left, e.clientY - target.getBoundingClientRect().top)
      setTimeout(() => document.body.removeChild(dragImage), 0)
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedJob(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault()
    if (!draggedJob) return
    const jobId = draggedJob
    setDraggedJob(null)

    const job = jobs.find(j => j.id === jobId)
    if (!job) return

    // Extract numeric ID from prefixed ID (e.g., "job_requests_123" -> "123")
    const numericId = jobId.replace(/^(job_requests_|processed_job_requests_)/, '')

    // Once in Closed, do not allow moving anywhere
    if (job.status === 'closed') return

    // Moving from job-request to hiring: process job (improve with AI) and activate
    if (job.status === 'job-request' && status === 'hiring') {
      const prev = jobs
      
      // Optimistically move the job to hiring column immediately (real-time)
      setJobs(prevJobs => prevJobs.map(j => 
        j.id === jobId ? { ...j, status: 'hiring' } : j
      ))
      
      // Process in background without blocking UI
      ;(async () => {
        try {
          const token = await getSessionToken()
          if (!token) throw new Error('Not authenticated')
          const res = await fetch('/api/admin/jobs/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id: numericId, asIs: false, to: 'active' })
          })
          if (!res.ok) {
            const errorText = await res.text()
            console.error('❌ API error response:', errorText)
            throw new Error(`Failed to activate job: ${res.status} - ${errorText}`)
          }
          const data = await res.json()
          // Silently update with processed job data in background
          setJobs(prevJobs => {
            const withoutOriginal = prevJobs.filter(j => j.id !== String(data.originalJobId))
            const processed = data.processedJob || {}
            const existing = prevJobs.find(j => j.id === String(data.originalJobId)) || ({} as any)
            const priority = processed.priority || existing.priority || 'medium'
            return [{ ...processed, status: 'hiring', priority }, ...withoutOriginal]
          })
        } catch (err) {
          console.error(err)
          // Silently revert to previous state on error
          setJobs(prev)
        }
      })()
      return
    }

    // Moving from hiring to closed: update status
    if ((job.status === 'hiring' || job.status === 'active') && status === 'closed') {
      const prev = jobs
      setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, status: 'closed' } : j))
      try {
        const token = await getSessionToken()
        if (!token) throw new Error('Not authenticated')
        const res = await fetch('/api/admin/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'update', data: { id: numericId, status: 'closed' } })
        })
        if (!res.ok) throw new Error('Failed to close job')
      } catch (err) {
        console.error(err)
        setJobs(prev)
      }
      return
    }

    // Moving from job-request to closed: not allowed (must be active first)
    if (job.status === 'job-request' && status === 'closed') {
      return
    }

    // Other moves: update status directly
    if (status === 'hiring' || status === 'closed' || status === 'job-request') {
      const prev = jobs
      const dbStatus = status === 'hiring' ? 'active' : status === 'closed' ? 'closed' : 'active'
      setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, status } : j))
      try {
        const token = await getSessionToken()
        if (!token) throw new Error('Not authenticated')
        const res = await fetch('/api/admin/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'update', data: { id: numericId, status: dbStatus } })
        })
        if (!res.ok) throw new Error('Failed to update job status')
      } catch (err) {
        console.error(err)
        setJobs(prev)
      }
      return
    }
    const prev = jobs
    setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, status } : j))
    try {
      const token = await getSessionToken()
      if (!token) throw new Error('Not authenticated')
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'move', data: { id: numericId, toStatus: status } })
      })
      if (!res.ok) throw new Error('Failed to move')
    } catch (err) {
      console.error(err)
      setJobs(prev)
    }
  }

  // Real-time validation for individual fields
  const validateField = (field: string, value: any) => {
    const errors: Record<string, string> = {}
    
    switch (field) {
      case 'company':
        if (!value?.trim()) {
          errors.company = 'Please select a company'
        }
        break
        
      case 'title':
        if (!value?.trim()) {
          errors.title = 'Job title is required'
        } else if (value.trim().length < 3) {
          errors.title = 'Job title must be at least 3 characters'
        } else if (value.trim().length > 100) {
          errors.title = 'Job title must be less than 100 characters'
        }
        break
        
      case 'jobDescription':
        if (value?.trim() && value.length < 50) {
          errors.jobDescription = 'Job description must be at least 50 characters if provided'
        } else if (value?.trim() && value.length > 5000) {
          errors.jobDescription = 'Job description must be less than 5000 characters'
        }
        break
        
      case 'experienceLevel':
        if (!value) {
          errors.experienceLevel = 'Please select an experience level'
        }
        break
        
      case 'workArrangement':
        if (!value) {
          errors.workArrangement = 'Please select a work arrangement'
        }
        break
        
      case 'shift':
        if (!value) {
          errors.shift = 'Please select a shift'
        }
        break
        
      case 'applicationDeadline':
        if (!value) {
          errors.applicationDeadline = 'Application deadline is required'
        } else {
          // Parse date in YYYY-MM-DD format (from HTML date input)
          const deadline = new Date(value + 'T00:00:00')
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          console.log('🔍 Date Debug:', {
            inputValue: value,
            deadline: deadline,
            today: today,
            deadlineTime: deadline.getTime(),
            todayTime: today.getTime(),
            isDeadlineValid: !isNaN(deadline.getTime()),
            isDeadlineAfterToday: deadline > today,
            comparison: deadline <= today
          })
          
          if (isNaN(deadline.getTime())) {
            errors.applicationDeadline = 'Please enter a valid date'
          } else if (deadline <= today) {
            errors.applicationDeadline = 'Deadline must be a future date'
          } else {
            const oneYearFromNow = new Date()
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
            if (deadline > oneYearFromNow) {
              errors.applicationDeadline = 'Deadline cannot be more than 1 year in the future'
            } else {
              const daysDiff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              if (daysDiff < 7) {
                errors.applicationDeadline = 'Deadline should be at least 7 days from now'
              }
            }
          }
        }
        break
        
      case 'salary':
        // Parse salary values, removing all non-numeric characters except decimal points
        const min = parseFloat(String(newJobData.salaryMin || '').replace(/[^\d.]/g, ''))
        const max = parseFloat(String(newJobData.salaryMax || '').replace(/[^\d.]/g, ''))
        
        // Only validate if both fields have reasonable values (not just single digits)
        const minStr = String(newJobData.salaryMin || '')
        const maxStr = String(newJobData.salaryMax || '')
        
        // Skip validation if max is clearly incomplete (less than 4 digits)
        if (maxStr.length < 4 && maxStr.length > 0) {
          console.log('🔍 Skipping validation - max value appears incomplete:', { maxStr, max })
          return errors
        }
        
        // Skip validation if min is clearly incomplete (less than 4 digits)
        if (minStr.length < 4 && minStr.length > 0) {
          console.log('🔍 Skipping validation - min value appears incomplete:', { minStr, min })
          return errors
        }
        
        // Debug logging to see what's happening
        console.log('🔍 Salary Debug:', {
          rawMin: newJobData.salaryMin,
          rawMax: newJobData.salaryMax,
          parsedMin: min,
          parsedMax: max,
          isMinValid: !isNaN(min),
          isMaxValid: !isNaN(max),
          comparison: min < max,
          equal: min === max,
          difference: max - min,
          bothPresent: !!(newJobData.salaryMin && newJobData.salaryMax),
          validationChecks: {
            bothValid: !isNaN(min) && !isNaN(max),
            minValid: min >= 10000 && min <= 1000000,
            maxValid: max >= 10000 && max <= 1000000,
            maxGreaterThanMin: max >= min,
            rangeValid: max - min >= 1000 || max === min
          },
          stateValues: {
            salaryMin: newJobData.salaryMin,
            salaryMax: newJobData.salaryMax
          }
        })
        
        if (newJobData.salaryMin && newJobData.salaryMax) {
          console.log('🔍 Running salary validation with:', { min, max })
          
          if (isNaN(min) || isNaN(max)) {
            console.log('❌ Invalid numbers:', { min, max })
            errors.salary = 'Salary values must be valid numbers'
          } else if (min < 0 || max < 0) {
            console.log('❌ Negative values:', { min, max })
            errors.salary = 'Salary values must be positive'
          } else if (min < 10000) {
            console.log('❌ Min too low:', { min })
            errors.salary = 'Minimum salary should be at least ₱10,000'
          } else if (max > 1000000) {
            console.log('❌ Max too high:', { max })
            errors.salary = 'Maximum salary should not exceed ₱1,000,000'
          } else if (max < min) {
            console.log('❌ Max less than min:', { min, max, difference: max - min })
            errors.salary = 'Maximum salary must be greater than or equal to minimum salary'
          } else if (max - min < 1000 && max !== min) {
            console.log('❌ Range too small:', { min, max, difference: max - min })
            errors.salary = 'Salary range should be at least ₱1,000 apart'
          } else {
            console.log('✅ Salary validation passed:', { min, max })
          }
          
          // If all validations pass, ensure no salary error is set
          if (!errors.salary) {
            delete errors.salary
          }
        } else if (newJobData.salaryMin && !newJobData.salaryMax) {
          if (isNaN(min)) {
            errors.salary = 'Minimum salary must be a valid number'
          } else if (min < 10000) {
            errors.salary = 'Minimum salary should be at least ₱10,000'
          } else {
            errors.salary = 'Please provide both minimum and maximum salary'
          }
        } else if (newJobData.salaryMax && !newJobData.salaryMin) {
          if (isNaN(max)) {
            errors.salary = 'Maximum salary must be a valid number'
          } else if (max > 1000000) {
            errors.salary = 'Maximum salary should not exceed ₱1,000,000'
          } else {
            errors.salary = 'Please provide both minimum and maximum salary'
          }
        }
        break
        
      case 'requirements':
      case 'responsibilities':
      case 'benefits':
      case 'skills':
        if (value && value.length > 5000) {
          const fieldName = field.charAt(0).toUpperCase() + field.slice(1)
          errors[field] = `${fieldName} must be less than 5000 characters (currently ${value.length})`
        }
        break
    }
    
    return errors
  }

  const validateJobForm = () => {
    const errors: Record<string, string> = {}
    
    // Required fields
    if (!newJobData.company?.trim()) {
      errors.company = 'Please select a company'
    }
    
    if (!newJobData.title?.trim()) {
      errors.title = 'Job title is required'
    } else if (newJobData.title.trim().length < 3) {
      errors.title = 'Job title must be at least 3 characters'
    } else if (newJobData.title.trim().length > 100) {
      errors.title = 'Job title must be less than 100 characters'
    }
    
    if (newJobData.jobDescription?.trim() && newJobData.jobDescription.length < 50) {
      errors.jobDescription = 'Job description must be at least 50 characters if provided'
    } else if (newJobData.jobDescription?.trim() && newJobData.jobDescription.length > 5000) {
      errors.jobDescription = 'Job description must be less than 5000 characters'
    }
    
    if (!newJobData.experienceLevel) {
      errors.experienceLevel = 'Please select an experience level'
    }
    
    if (!newJobData.workArrangement) {
      errors.workArrangement = 'Please select a work arrangement'
    }
    
    if (!newJobData.shift) {
      errors.shift = 'Please select a shift'
    }
    
    if (!newJobData.applicationDeadline) {
      errors.applicationDeadline = 'Application deadline is required'
    }
    
    // Enhanced salary validation
    if (newJobData.salaryMin && newJobData.salaryMax) {
      const min = parseFloat(String(newJobData.salaryMin).replace(/[^\d.]/g, ''))
      const max = parseFloat(String(newJobData.salaryMax).replace(/[^\d.]/g, ''))
      
      console.log('🔍 Main Validation Debug:', {
        rawMin: newJobData.salaryMin,
        rawMax: newJobData.salaryMax,
        parsedMin: min,
        parsedMax: max,
        isMinValid: !isNaN(min),
        isMaxValid: !isNaN(max),
        comparison: min < max,
        equal: min === max,
        difference: max - min
      })
      
      if (isNaN(min) || isNaN(max)) {
        errors.salary = 'Salary values must be valid numbers'
      } else if (min < 0 || max < 0) {
        errors.salary = 'Salary values must be positive'
      } else if (min < 10000) {
        errors.salary = 'Minimum salary should be at least ₱10,000'
      } else if (max > 1000000) {
        errors.salary = 'Maximum salary should not exceed ₱1,000,000'
      } else if (max < min) {
        errors.salary = 'Maximum salary must be greater than or equal to minimum salary'
      } else if (max - min < 1000 && max !== min) {
        errors.salary = 'Salary range should be at least ₱1,000 apart'
      }
      // If all validations pass, ensure no salary error is set
      if (!errors.salary) {
        delete errors.salary
      }
    } else if (newJobData.salaryMin && !newJobData.salaryMax) {
      const min = parseFloat(String(newJobData.salaryMin).replace(/[^\d.]/g, ''))
      if (isNaN(min)) {
        errors.salary = 'Minimum salary must be a valid number'
      } else if (min < 10000) {
        errors.salary = 'Minimum salary should be at least ₱10,000'
      } else {
        errors.salary = 'Please provide both minimum and maximum salary'
      }
    } else if (newJobData.salaryMax && !newJobData.salaryMin) {
      const max = parseFloat(String(newJobData.salaryMax).replace(/[^\d.]/g, ''))
      if (isNaN(max)) {
        errors.salary = 'Maximum salary must be a valid number'
      } else if (max > 1000000) {
        errors.salary = 'Maximum salary should not exceed ₱1,000,000'
      } else {
        errors.salary = 'Please provide both minimum and maximum salary'
      }
    }
    
    // Enhanced deadline validation
    if (newJobData.applicationDeadline) {
      // Parse date in YYYY-MM-DD format (from HTML date input)
      const deadline = new Date(newJobData.applicationDeadline + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (isNaN(deadline.getTime())) {
        errors.applicationDeadline = 'Please enter a valid date'
      } else if (deadline <= today) {
        errors.applicationDeadline = 'Deadline must be a future date'
      } else {
        const oneYearFromNow = new Date()
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
        if (deadline > oneYearFromNow) {
          errors.applicationDeadline = 'Deadline cannot be more than 1 year in the future'
        }
        
        // Check if deadline is too close (less than 7 days)
        const daysDiff = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff < 7) {
          errors.applicationDeadline = 'Deadline should be at least 7 days from now'
        }
      }
    }
    
    // Enhanced text area validations
    const textAreas = [
      { field: 'requirements', name: 'Requirements' },
      { field: 'responsibilities', name: 'Responsibilities' },
      { field: 'benefits', name: 'Benefits' },
      { field: 'skills', name: 'Skills' }
    ]
    
    textAreas.forEach(({ field, name }) => {
      const value = newJobData[field as keyof typeof newJobData] as string
      if (value && value.length > 5000) {
        errors[field] = `${name} must be less than 5000 characters (currently ${value.length})`
      }
    })
    
    return errors
  }

  const handleAddJob = async () => {
    // Clear previous errors
    setFormErrors({})
    
    // Validate form
    const errors = validateJobForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      // Scroll to top to show error banner
      const modalContent = document.querySelector('.job-modal-scroll')
      if (modalContent) {
        modalContent.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }
    
    setIsSubmitting(true)
    try {
      const token = await getSessionToken()
      if (!token) throw new Error('Not authenticated')
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'create',
          data: {
        company: newJobData.company,
        title: newJobData.title,
            location: '',
            salary: newJobData.salary || (newJobData.salaryMin || newJobData.salaryMax ? `₱${newJobData.salaryMin || ''} - ₱${newJobData.salaryMax || ''} / ${newJobData.salaryType}` : ''),
            status: 'job-request',
            workArrangement: newJobData.workArrangement,
            workType: 'full-time',
            experienceLevel: newJobData.experienceLevel || null,
            application_deadline: newJobData.applicationDeadline || null,
            industry: newJobData.industry || null,
            department: newJobData.department || null,
            jobDescription: newJobData.jobDescription || '',
            requirements: newJobData.requirements ? newJobData.requirements.split('\n') : [],
            responsibilities: newJobData.responsibilities ? newJobData.responsibilities.split('\n') : [],
            benefits: newJobData.benefits ? newJobData.benefits.split('\n') : [],
            skills: newJobData.skills ? newJobData.skills.split('\n') : [],
        priority: newJobData.priority,
        shift: newJobData.shift
      }
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(()=>({}))
        throw new Error(err.error || 'Failed to create job')
      }
      const data = await res.json()
      if (data?.job) setJobs((prev: any) => [data.job, ...prev])
      setNewJobData({
        company: '', title: '', salary: '', salaryMin: '', salaryMax: '', salaryType: 'monthly',
        workArrangement: 'onsite', experienceLevel: '', applicationDeadline: '', industry: '', department: '',
        requirements: '', responsibilities: '', benefits: '', skills: '', jobDescription: '', status: 'job-request', priority: 'medium', shift: 'day'
      })
      setFormErrors({})
      setIsAddJobDialogOpen(false)
    } catch (err) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Failed to add job'
      alert(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddStatus = () => {
    if (newStatusData.title) {
      const newStatus: StatusColumn = {
        id: newStatusData.title.toLowerCase().replace(/\s+/g, '-'),
        title: newStatusData.title,
        color: newStatusData.color,
        icon: CheckCircle
      }
      setColumns(prev => [...prev, newStatus])
      setNewStatusData({
        title: '',
        color: 'bg-blue-500'
      })
      setIsAddStatusDialogOpen(false)
    }
  }

  const handleEditJob = async (job: JobCard) => {
    try {
      const token = await getSessionToken()
      if (!token) throw new Error('Not authenticated')
      
      // Extract numeric ID from prefixed ID (e.g., "job_requests_123" -> "123")
      const numericId = job.id.replace(/^(job_requests_|processed_job_requests_)/, '')
      
      // Always prefer processed row if exists; fallback to original
      let jobData: any = null
      let isProcessedSource = false
      try {
        const resProcessed = await fetch(`/api/admin/processed-jobs/${numericId}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        if (resProcessed.ok) {
          const pdata = await resProcessed.json()
          jobData = pdata.job
          isProcessedSource = true
        }
      } catch {}
      if (!jobData) {
        const resOrig = await fetch(`/api/admin/jobs/${numericId}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        const odata = await resOrig.json()
        if (!resOrig.ok) throw new Error(odata.error || 'Failed to load job')
        jobData = odata.job
      }
      // also load comments
      let comments: any[] = []
      try {
        const cres = await fetch(`/api/admin/jobs/${numericId}/comments`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
        if (cres.ok) { const cdata = await cres.json(); comments = cdata.comments || [] }
      } catch {}
      setEditingJob({ ...(jobData||{}), __comments: comments, __source: isProcessedSource ? 'processed' : 'original' })
      setPendingChanges({}) // Clear any pending changes
      setHasUnsavedChanges(false) // Reset unsaved changes flag
      setIsEditJobDialogOpen(true)
    } catch (e) {
      console.error(e)
      alert('Failed to open job for editing')
    }
  }

  const handleUpdateJob = async () => {
    if (!editingJob) return
    try {
      const token = await getSessionToken()
      if (!token) throw new Error('Not authenticated')
      const payload = {
        id: editingJob.id,
        title: editingJob.job_title,
        location: editingJob.location,
        salary: formatEditSalary(editingJob.currency, editingJob.salary_min, editingJob.salary_max, editingJob.salary_type),
        status: mapEnumToUi(editingJob.status),
        workArrangement: editingJob.work_arrangement,
        workType: 'full-time',
        experienceLevel: editingJob.experience_level
      }
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'update', data: { ...payload, companyId: editingJob.company_id, salaryType: editingJob.salary_type, currency: editingJob.currency } })
      })
      if (!res.ok) throw new Error('Failed to update job')
      // refresh list
      setJobs(prev => prev.map(j => j.id === String(editingJob.id) ? {
        ...j,
        title: editingJob.job_title,
        location: editingJob.location,
        salary: formatSalaryDisplay(editingJob.currency, editingJob.salary_min, editingJob.salary_max, editingJob.salary_type),
        status: mapEnumToUi(editingJob.status) === 'job-request' ? 'job-request' : j.status
      } : j))
      setIsEditJobDialogOpen(false)
      setEditingJob(null)
    } catch (err) {
      console.error(err)
      alert('Failed to update job')
    }
  }

  const formatEditSalary = (currency: string, min: number | null, max: number | null, type: string) => {
    const sym = (currency || 'PHP').toUpperCase() === 'PHP' ? '₱' : (currency || 'PHP')
    if (min != null && max != null) return `${sym}${min} - ${sym}${max} / ${type}`
    if (min != null) return `${sym}${min} / ${type}`
    if (max != null) return `${sym}${max} / ${type}`
    return ''
  }

  const formatSalaryDisplay = (currency: string, min: number | null, max: number | null, type: string) => {
    const sym = (currency || 'PHP').toUpperCase() === 'PHP' ? '₱' : (currency || 'PHP')
    const fmt = (n: number) => n.toLocaleString('en-PH')
    if (min != null && max != null) return `${sym}${fmt(min)} - ${sym}${fmt(max)} / ${type}`
    if (min != null) return `${sym}${fmt(min)} / ${type}`
    if (max != null) return `${sym}${fmt(max)} / ${type}`
    return ''
  }

  const mapEnumToUi = (db: string): 'job-request' | 'approved' | 'hiring' | 'closed' => {
    const s = String(db || '').toLowerCase()
    if (s === 'active') return 'hiring'
    if (s === 'inactive') return 'job-request'
    if (s === 'processed' || s === 'approved') return 'approved'
    if (s === 'closed') return 'closed'
    return 'job-request'
  }

  const mapUiToEnum = (ui: string): 'active' | 'inactive' | 'closed' => {
    const s = String(ui || '').toLowerCase()
    if (s === 'hiring') return 'active'
    if (s === 'closed') return 'closed'
    return 'inactive'
  }

  // Build salary string for API parser
  const buildSalaryString = (currency: string, min: number | null, max: number | null, type: string) => {
    const sym = (currency || 'PHP').toUpperCase() === 'PHP' ? '₱' : (currency || 'PHP')
    const v = (n: number | null) => (n == null ? '' : String(n))
    if (min != null && max != null) return `${sym}${v(min)} - ${sym}${v(max)} / ${type}`
    if (min != null) return `${sym}${v(min)} / ${type}`
    if (max != null) return `${sym}${v(max)} / ${type}`
    return ''
  }

  // Track changes without immediate save
  const trackChange = (changes: any, localMutate?: (draft: any) => any) => {
    if (!editingJob) return
    
    // Update pending changes
    setPendingChanges((prev: any) => ({ ...prev, ...changes }))
    setHasUnsavedChanges(true)
    
    // Apply local mutation immediately for UI feedback
    if (localMutate) {
      setEditingJob((prev: any) => ({ ...(prev || {}), ...localMutate(prev) }))
    }
  }

  // Save all pending changes at once
  const saveAllChanges = async () => {
    if (!editingJob || Object.keys(pendingChanges).length === 0) return
    
    try {
      setIsSaving(true)
      const token = await getSessionToken()
      if (!token) throw new Error('Not authenticated')
      
      // Prepare payload, converting empty strings to null for date fields
      const cleanedChanges = { ...pendingChanges }
      if (cleanedChanges.application_deadline === '') {
        cleanedChanges.application_deadline = null
      }
      
      const payload = { id: editingJob.id, ...cleanedChanges }
      const endpoint = '/api/admin/jobs'
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'update', data: payload })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Update failed:', errorData)
        throw new Error(errorData.error || `Update failed: ${res.status} ${res.statusText}`)
      }
      
      // Update jobs list with saved changes
      setJobs(prev => prev.map(j => j.id === String(editingJob.id)
        ? {
            ...j,
            // Update all fields that could have been changed
            title: (pendingChanges.title ?? j.title),
            location: (pendingChanges.location ?? j.location),
            priority: (pendingChanges.priority ?? j.priority),
            salary: (pendingChanges.salary ?? j.salary),
            workArrangement: (pendingChanges.workArrangement ?? j.workArrangement),
            experienceLevel: (pendingChanges.experienceLevel ?? j.experienceLevel),
            shift: (pendingChanges.shift ?? j.shift),
            industry: (pendingChanges.industry ?? j.industry),
            department: (pendingChanges.department ?? j.department),
            applicationDeadline: (pendingChanges.application_deadline ? String(pendingChanges.application_deadline).split('T')[0] : j.applicationDeadline),
            jobDescription: (pendingChanges.jobDescription ?? j.jobDescription),
            requirements: (pendingChanges.requirements ?? j.requirements),
            responsibilities: (pendingChanges.responsibilities ?? j.responsibilities),
            benefits: (pendingChanges.benefits ?? j.benefits),
            skills: (pendingChanges.skills ?? j.skills),
            // Update company info if changed
            company: (pendingChanges.companyId ? 
              (members.find(m => m.company_id === pendingChanges.companyId)?.company ?? j.company) : 
              j.company
            )
          }
        : j
      ))
      
             // Clear pending changes
       setPendingChanges({})
       setHasUnsavedChanges(false)
       
       setSuccessMessage('Changes saved successfully!')
       setShowSuccessAlert(true)
       
     } catch (e: any) {
       console.error(e)
       setSuccessMessage('Error saving changes: ' + e.message)
       setShowSuccessAlert(true)
     } finally {
       setIsSaving(false)
     }
  }

  // Legacy function for backward compatibility (now just tracks changes)
  const savePartialUpdate = async (partial: any, localMutate?: (draft: any) => any) => {
    trackChange(partial, localMutate)
  }

  const handleDeleteJob = async (jobId: string) => {
    // Set the job to delete and open the confirmation dialog
    setJobToDelete(jobId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return

    const prev = jobs
    // Extract numeric ID from jobId (remove prefixes like "job_requests_" or "processed_job_requests_")
    const numericId = jobToDelete.replace(/^(job_requests_|processed_job_requests_)/, '')
    
    setIsDeleting(true)
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobToDelete))
    
    try {
      const token = await getSessionToken()
      if (!token) throw new Error('Not authenticated')
      const res = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'delete', data: { id: numericId } })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete')
      }
      // Close the dialog on success
      setIsDeleteDialogOpen(false)
      setJobToDelete(null)
    } catch (err) {
      console.error('Error deleting job:', err)
      setJobs(prev)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete job'
      alert(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600/20 text-red-500 border-red-600/30'
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent'
      case 'high': return 'High'
      case 'medium': return 'Medium'
      case 'low': return 'Low'
      default: return 'Unknown'
    }
  }

  const getLocationTypeColor = (locationType: string) => {
    switch (locationType) {
      case 'on-site': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'remote': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'hybrid': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getLocationTypeLabel = (locationType: string) => {
    switch (locationType) {
      case 'on-site': return 'On-Site'
      case 'remote': return 'Remote'
      case 'hybrid': return 'Hybrid'
      default: return 'On-Site'
    }
  }

  // Show the board UI but do not render job cards

  return (
    <AdminLayout 
      title="Job Management" 
      description="Manage job postings and applications"
      titleContent={null}
    >
      <div className="space-y-8">

        {/* Kanban Board */}
        <div className="flex gap-6 overflow-x-auto pb-4 mt-12 min-h-[80vh]">
          {columns.map((column) => {
            const columnJobs: JobCard[] =
              column.id === 'job-request'
                ? jobs.filter(job => job.status === 'job-request' || job.status === 'inactive')
                  : column.id === 'hiring'
                    ? jobs.filter(job => job.status === 'hiring' || job.status === 'active' || job.status === 'approved')
                    : column.id === 'closed'
                      ? jobs.filter(job => job.status === 'closed')
                      : []
            const IconComponent = column.icon

            return (
                             <div
                 key={column.id}
                 className={`flex-shrink-0 w-[360px] min-h-[70vh] border-2 border-dashed transition-all duration-200 ${
                   draggedJob ? 'border-purple-500/30 bg-purple-500/5' : 'border-transparent hover:border-white/20'
                 }`}
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onDrop={(e) => handleDrop(e, column.id)}
               >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3.5 h-3.5 rounded-full ${column.color}`}></div>
                    <h3 className="text-xl font-semibold text-white">{column.title}</h3>
                    <Badge className="bg-white/10 text-white border-white/20 text-sm px-2.5 py-1">
                       {columnJobs.length}
                    </Badge>
                  </div>
                  {column.id === 'job-request' ? (
                    <Button
                      size="sm"
                      onClick={() => setIsAddJobDialogOpen(true)}
                      className="h-7 px-2 text-xs bg-white/10 hover:bg-white/15 border border-white/15 text-white"
                    >
                      + Add Job
                    </Button>
                  ) : (
                  <IconComponent className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                {column.id === 'job-request' || column.id === 'hiring' || column.id === 'closed' ? (
                <div className="relative">
                  <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-3 pb-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
                  {columnJobs.map((job) => (
                                                             <div
                      key={job.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, job.id)}
                      onDragEnd={handleDragEnd}
                        onClick={() => handleEditJob(job)}
                        role="button"
                        tabIndex={0}
                        className={`cursor-move active:cursor-grabbing hover:scale-[1.02] transition-all duration-200 outline-none focus:ring-2 focus:ring-purple-500/40 rounded-md ${
                          draggedJob === job.id ? 'opacity-50 scale-95 rotate-1' : 'opacity-100'
                        }`}
                    >
                      <Card className={`glass-card border-white/10 hover:border-white/15 transition-all duration-200 ${
                        draggedJob === job.id ? 'shadow-2xl shadow-purple-500/20' : ''
                      }`}>
                        <CardContent className="p-5">
                          {/* Header with title and menu */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-semibold text-white text-base line-clamp-2 mb-2">
                                {job.title || 'Untitled Role'}
                              </h3>
                              <p className="text-sm text-gray-400">{job.company || 'ShoreAgents'}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white flex-shrink-0" onClick={(e)=> e.stopPropagation()}>
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="glass-card border-white/10 backdrop-blur-md">
                                <DropdownMenuItem 
                                  className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
                                  onClick={(e) => { 
                                    e.stopPropagation()
                                    handleDeleteJob(job.id)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Status indicator */}
                          <div className="flex items-center mb-4">
                            <div className={`w-2.5 h-2.5 rounded-full mr-2.5 ${
                              column.id === 'job-request' 
                                ? 'bg-yellow-500'
                                : column.id === 'approved'
                                  ? 'bg-orange-500'
                                  : column.id === 'hiring'
                                    ? 'bg-green-500'
                                    : 'bg-gray-500'
                            }`}></div>
                            <span className="text-sm text-gray-400 capitalize">
                              {column.id === 'job-request' ? 'New Request' : 
                               column.id === 'approved' ? 'Approved' :
                               column.id === 'hiring' ? 'Active' : 'Closed'}
                            </span>
                          </div>
                          
                          {/* Key info */}
                          <div className="space-y-3 mb-4">
                            <div className="flex items-center text-sm text-gray-300">
                              <span className="font-semibold">₱{job.salary.replace('₱', '')}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-400">
                              <span>{formatTimeAgo(job.postedDays, job.createdAt || undefined)}</span>
                              <span>{job.applicants} applicants</span>
                            </div>
                            {job.applicationDeadline && (
                              <div className="flex items-center text-sm text-gray-400">
                                <span className="text-orange-400 font-medium">Deadline: {(() => {
                                  try {
                                    // Format date string (YYYY-MM-DD) to MM/DD/YYYY without timezone conversion
                                    const dateStr = String(job.applicationDeadline).split('T')[0].trim();
                                    // Check if it's in YYYY-MM-DD format
                                    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                                      const [year, month, day] = dateStr.split('-');
                                      return `${month}/${day}/${year}`;
                                    }
                                    // Try parsing as Date object if it's not in expected format
                                    const dateObj = new Date(job.applicationDeadline);
                                    if (!isNaN(dateObj.getTime())) {
                                      // Format as MM/DD/YYYY
                                      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                                      const day = String(dateObj.getDate()).padStart(2, '0');
                                      const year = dateObj.getFullYear();
                                      return `${month}/${day}/${year}`;
                                    }
                                    // If all else fails, return the string as-is
                                    return dateStr || String(job.applicationDeadline);
                                  } catch (error) {
                                    // Fallback: return the raw value
                                    return String(job.applicationDeadline);
                                  }
                                })()}</span>
                              </div>
                            )}
                          </div>

                          {/* Priority badge */}
                          <div className="flex justify-end">
                            <Badge 
                              className={`text-sm px-3 py-1.5 ${
                                job.priority === 'high' 
                                  ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                                  : job.priority === 'medium'
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                                    : 'bg-green-500/20 text-green-400 border-green-500/30'
                              }`}
                            >
                              {job.priority}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                  </div>
                  {/* Gradient indicators for scrollable content */}
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#0b0b0d] to-transparent pointer-events-none z-10"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#0b0b0d] to-transparent pointer-events-none z-10"></div>
                </div>
                ) : (
                  <div className="min-h-[120px] rounded-lg border border-white/10 bg-white/5" />
                )}
              </div>
            )
          })}
        </div>

        {/* Add Job Dialog (full form) */}
                    <Dialog open={isAddJobDialogOpen} onOpenChange={(open) => {
              setIsAddJobDialogOpen(open)
              if (open) {
                // Clear all errors when modal opens
                setFormErrors({})
                setIsSubmitting(false)
              } else {
                setFormErrors({})
                setIsSubmitting(false)
              }
            }}>
          <DialogContent className="bg-[#0b0b0d] text-white border border-white/10 w-[96vw] sm:max-w-6xl xl:max-w-7xl max-w-[1400px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Create Job Request</DialogTitle>
              <DialogDescription className="text-gray-300">Provide details for the new job request. All fields can be edited later.</DialogDescription>
            </DialogHeader>
            
            {/* Sticky Error Banner */}
            {Object.keys(formErrors).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                    <span className="text-red-400 text-sm">!</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-red-400 font-semibold text-sm mb-2">
                      Please fix the following errors:
                    </h4>
                    <ul className="space-y-1">
                      {Object.entries(formErrors).map(([field, error]) => (
                        <li key={field} className="text-red-300 text-xs flex items-center gap-2">
                          <span className="w-1 h-1 bg-red-400 rounded-full flex-shrink-0"></span>
                          <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="space-y-5 overflow-y-auto max-h-[75vh] pr-2 job-modal-scroll">
              {/* Member & Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Member <span className="text-red-400">*</span>
                  </label>
                  <select
                    className={`w-full job-select border rounded-lg px-3 py-2 ${
                      formErrors.company ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                    }`}
                    value={newJobData.company}
                    onChange={(e)=> {
                      const value = e.target.value
                      setNewJobData(p=> ({...p, company: value}))
                      
                      // Real-time validation
                      const fieldErrors = validateField('company', value)
                      setFormErrors(prev => {
                        const newErrors = { ...prev }
                        if (fieldErrors.company) {
                          newErrors.company = fieldErrors.company
                        } else {
                          delete newErrors.company
                        }
                        return newErrors
                      })
                    }}
                  >
                    <option value="">Select company</option>
                    {members.map(m => (
                      <option key={m.company_id} value={m.company}>{m.company}</option>
                    ))}
                  </select>
                  {formErrors.company && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.company}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Job Title <span className="text-red-400">*</span>
                  </label>
                  <Input 
                    value={newJobData.title} 
                    onChange={(e)=> {
                      const value = e.target.value
                      setNewJobData(p=> ({...p, title: value}))
                      
                      // Real-time validation
                      const fieldErrors = validateField('title', value)
                      setFormErrors(prev => {
                        const newErrors = { ...prev }
                        if (fieldErrors.title) {
                          newErrors.title = fieldErrors.title
                        } else {
                          delete newErrors.title
                        }
                        return newErrors
                      })
                    }} 
                    placeholder="Enter job title" 
                    className={`bg-white/10 border text-white placeholder:text-gray-400 ${
                      formErrors.title ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                    }`} 
                  />
                  {formErrors.title && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.title}</p>
                  )}
                </div>
              </div>

              {/* Salary Min/Max & Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Salary Min (in pesos)</label>
                  <div className="relative">
                    {newJobData.salaryMin && (
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">₱</span>
                    )}
                    <Input 
                      value={formatSalaryInput(String(newJobData.salaryMin || ''))} 
                      onChange={(e)=> {
                        const value = e.target.value
                        // Store the raw numeric value for validation
                        const numericValue = value.replace(/[^\d.]/g, '')
                        setNewJobData(p=> ({...p, salaryMin: numericValue}))
                        
                        // Clear any existing salary errors when user starts typing
                        setFormErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.salary
                          return newErrors
                        })
                      }} 
                      placeholder="e.g., 20,000" 
                      className={`bg-white/10 border text-white ${newJobData.salaryMin ? 'pl-8' : ''} ${
                        formErrors.salary ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                      }`} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Salary Max (in pesos)</label>
                  <div className="relative">
                    {newJobData.salaryMax && (
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">₱</span>
                    )}
                    <Input 
                      value={formatSalaryInput(String(newJobData.salaryMax || ''))} 
                      onChange={(e)=> {
                        const value = e.target.value
                        // Store the raw numeric value for validation
                        const numericValue = value.replace(/[^\d.]/g, '')
                        setNewJobData(p=> ({...p, salaryMax: numericValue}))
                        
                        // Clear any existing salary errors when user starts typing
                        setFormErrors(prev => {
                          const newErrors = { ...prev }
                          delete newErrors.salary
                          return newErrors
                        })
                      }} 
                      placeholder="e.g., 25,000" 
                      className={`bg-white/10 border text-white ${newJobData.salaryMax ? 'pl-8' : ''} ${
                        formErrors.salary ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                      }`} 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Salary Type</label>
                  <select className="w-full job-select border border-white/20 rounded-lg px-3 py-2" value={newJobData.salaryType} onChange={(e)=> setNewJobData(p=> ({...p, salaryType: e.target.value}))}>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              </div>
              {formErrors.salary && (
                <p className="text-red-400 text-xs mt-1">{formErrors.salary}</p>
              )}

              {/* Work Arrangement, Experience & Shift */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Work Arrangement <span className="text-red-400">*</span>
                  </label>
                  <select 
                    className={`w-full job-select border rounded-lg px-3 py-2 ${
                      formErrors.workArrangement ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                    }`} 
                    value={newJobData.workArrangement} 
                    onChange={(e)=> {
                      const value = e.target.value
                      setNewJobData(p=> ({...p, workArrangement: value}))
                      
                      // Real-time validation
                      const fieldErrors = validateField('workArrangement', value)
                      setFormErrors(prev => {
                        const newErrors = { ...prev }
                        if (fieldErrors.workArrangement) {
                          newErrors.workArrangement = fieldErrors.workArrangement
                        } else {
                          delete newErrors.workArrangement
                        }
                        return newErrors
                      })
                    }}
                  >
                    <option value="onsite">Onsite</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                  {formErrors.workArrangement && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.workArrangement}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Experience Level <span className="text-red-400">*</span>
                  </label>
                  <select 
                    className={`w-full job-select border rounded-lg px-3 py-2 ${
                      formErrors.experienceLevel ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                    }`} 
                    value={newJobData.experienceLevel} 
                    onChange={(e)=> {
                      const value = e.target.value
                      setNewJobData(p=> ({...p, experienceLevel: value as any}))
                      
                      // Real-time validation
                      const fieldErrors = validateField('experienceLevel', value)
                      setFormErrors(prev => {
                        const newErrors = { ...prev }
                        if (fieldErrors.experienceLevel) {
                          newErrors.experienceLevel = fieldErrors.experienceLevel
                        } else {
                          delete newErrors.experienceLevel
                        }
                        return newErrors
                      })
                    }}
                  >
                    <option value="">Select level</option>
                    <option value="entry-level">Entry-level</option>
                    <option value="mid-level">Mid-level</option>
                    <option value="senior-level">Senior-level</option>
                  </select>
                  {formErrors.experienceLevel && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.experienceLevel}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Shift <span className="text-red-400">*</span>
                  </label>
                  <select 
                    value={newJobData.shift} 
                    onChange={(e)=> {
                      const value = e.target.value
                      setNewJobData(p=> ({...p, shift: value as 'day' | 'night'}))
                      
                      // Real-time validation
                      const fieldErrors = validateField('shift', value)
                      setFormErrors(prev => {
                        const newErrors = { ...prev }
                        if (fieldErrors.shift) {
                          newErrors.shift = fieldErrors.shift
                        } else {
                          delete newErrors.shift
                        }
                        return newErrors
                      })
                    }} 
                    className={`w-full job-select border rounded-lg px-3 py-2 ${
                      formErrors.shift ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                    }`}
                  >
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                  </select>
                  {formErrors.shift && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.shift}</p>
                  )}
                </div>
              </div>

              {/* Deadline, Industry, Department */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Application Deadline <span className="text-red-400">*</span>
                    <span className="text-xs text-gray-400 ml-2">(DD/MM/YY)</span>
                  </label>
                  <Input 
                    type="date" 
                    value={newJobData.applicationDeadline} 
                    onChange={(e)=> {
                      const value = e.target.value
                      console.log('🔍 Date Input Change:', { value, length: value.length })
                      setNewJobData(p=> ({...p, applicationDeadline: value}))
                      
                      // Real-time validation
                      const fieldErrors = validateField('applicationDeadline', value)
                      setFormErrors(prev => {
                        const newErrors = { ...prev }
                        if (fieldErrors.applicationDeadline) {
                          newErrors.applicationDeadline = fieldErrors.applicationDeadline
                        } else {
                          delete newErrors.applicationDeadline
                        }
                        return newErrors
                      })
                    }} 
                    className={`bg-white/10 border text-white ${
                      formErrors.applicationDeadline ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                    }`}
                    style={{
                      textAlign: 'left',
                      paddingRight: '40px'
                    }}
                  />
                  {formErrors.applicationDeadline && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.applicationDeadline}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Industry</label>
                  <select
                    className="w-full job-select border border-white/20 rounded-lg px-3 py-2"
                    value={newJobData.industry}
                    onChange={(e)=> setNewJobData(p=> ({...p, industry: e.target.value}))}
                  >
                    <option value="">Select industry</option>
                    {industryOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Department</label>
                  <select
                    className="w-full job-select border border-white/20 rounded-lg px-3 py-2"
                    value={newJobData.department}
                    onChange={(e)=> setNewJobData(p=> ({...p, department: e.target.value}))}
                  >
                    <option value="">Select department</option>
                    {departmentOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description & Lists */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Job Description
                </label>
                <textarea 
                  ref={jobDescriptionRef}
                  value={newJobData.jobDescription} 
                  onChange={(e)=> {
                    const value = e.target.value
                    setNewJobData(p=> ({...p, jobDescription: value}))
                    autoResizeTextarea(e.target)
                    
                    // Real-time validation
                    const fieldErrors = validateField('jobDescription', value)
                    setFormErrors(prev => {
                      const newErrors = { ...prev }
                      if (fieldErrors.jobDescription) {
                        newErrors.jobDescription = fieldErrors.jobDescription
                      } else {
                        delete newErrors.jobDescription
                      }
                      return newErrors
                    })
                  }}
                  onPaste={(e) => {
                    // Auto-resize after paste
                    setTimeout(() => autoResizeTextarea(e.currentTarget), 0)
                  }}
                  className={`w-full min-h-[100px] bg-white/10 border rounded-lg px-3 py-2 text-white resize-none overflow-hidden ${
                    formErrors.jobDescription ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                  }`} 
                  placeholder="Describe the role, responsibilities, and what makes this position unique..."
                />
                {formErrors.jobDescription && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.jobDescription}</p>
                )}
                <p className="text-gray-400 text-xs">
                  {newJobData.jobDescription.length}/5000 characters (minimum 50 if provided)
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Requirements (one per line)</label>
                <textarea 
                  ref={requirementsRef}
                  value={newJobData.requirements} 
                  onChange={(e)=> {
                    const value = e.target.value
                    setNewJobData(p=> ({...p, requirements: value}))
                    autoResizeTextarea(e.target)
                    
                    // Real-time validation
                    const fieldErrors = validateField('requirements', value)
                    setFormErrors(prev => {
                      const newErrors = { ...prev }
                      if (fieldErrors.requirements) {
                        newErrors.requirements = fieldErrors.requirements
                      } else {
                        delete newErrors.requirements
                      }
                      return newErrors
                    })
                  }}
                  onPaste={(e) => {
                    setTimeout(() => autoResizeTextarea(e.currentTarget), 0)
                  }}
                  className={`w-full min-h-[80px] bg-white/10 border rounded-lg px-3 py-2 text-white resize-none overflow-hidden ${
                    formErrors.requirements ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                  }`} 
                  placeholder="• Bachelor's degree in Computer Science&#10;• 3+ years of experience&#10;• Strong communication skills"
                />
                {formErrors.requirements && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.requirements}</p>
                )}
                <p className="text-gray-400 text-xs">{newJobData.requirements.length}/5000 characters</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Responsibilities (one per line)</label>
                <textarea 
                  ref={responsibilitiesRef}
                  value={newJobData.responsibilities} 
                  onChange={(e)=> {
                    const value = e.target.value
                    setNewJobData(p=> ({...p, responsibilities: value}))
                    autoResizeTextarea(e.target)
                    
                    // Real-time validation
                    const fieldErrors = validateField('responsibilities', value)
                    setFormErrors(prev => {
                      const newErrors = { ...prev }
                      if (fieldErrors.responsibilities) {
                        newErrors.responsibilities = fieldErrors.responsibilities
                      } else {
                        delete newErrors.responsibilities
                      }
                      return newErrors
                    })
                  }}
                  onPaste={(e) => {
                    setTimeout(() => autoResizeTextarea(e.currentTarget), 0)
                  }}
                  className={`w-full min-h-[80px] bg-white/10 border rounded-lg px-3 py-2 text-white resize-none overflow-hidden ${
                    formErrors.responsibilities ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                  }`} 
                  placeholder="• Develop and maintain web applications&#10;• Collaborate with cross-functional teams&#10;• Write clean, maintainable code"
                />
                {formErrors.responsibilities && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.responsibilities}</p>
                )}
                <p className="text-gray-400 text-xs">{newJobData.responsibilities.length}/5000 characters</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Benefits (one per line)</label>
                <textarea 
                  ref={benefitsRef}
                  value={newJobData.benefits} 
                  onChange={(e)=> {
                    const value = e.target.value
                    setNewJobData(p=> ({...p, benefits: value}))
                    autoResizeTextarea(e.target)
                    
                    // Real-time validation
                    const fieldErrors = validateField('benefits', value)
                    setFormErrors(prev => {
                      const newErrors = { ...prev }
                      if (fieldErrors.benefits) {
                        newErrors.benefits = fieldErrors.benefits
                      } else {
                        delete newErrors.benefits
                      }
                      return newErrors
                    })
                  }}
                  onPaste={(e) => {
                    setTimeout(() => autoResizeTextarea(e.currentTarget), 0)
                  }}
                  className={`w-full min-h-[80px] bg-white/10 border rounded-lg px-3 py-2 text-white resize-none overflow-hidden ${
                    formErrors.benefits ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                  }`} 
                  placeholder="• Health insurance&#10;• 401(k) matching&#10;• Flexible work hours"
                />
                {formErrors.benefits && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.benefits}</p>
                )}
                <p className="text-gray-400 text-xs">{newJobData.benefits.length}/5000 characters</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Skills (one per line)</label>
                <textarea 
                  ref={skillsRef}
                  value={newJobData.skills} 
                  onChange={(e)=> {
                    const value = e.target.value
                    setNewJobData(p=> ({...p, skills: value}))
                    autoResizeTextarea(e.target)
                    
                    // Real-time validation
                    const fieldErrors = validateField('skills', value)
                    setFormErrors(prev => {
                      const newErrors = { ...prev }
                      if (fieldErrors.skills) {
                        newErrors.skills = fieldErrors.skills
                      } else {
                        delete newErrors.skills
                      }
                      return newErrors
                    })
                  }}
                  onPaste={(e) => {
                    setTimeout(() => autoResizeTextarea(e.currentTarget), 0)
                  }}
                  className={`w-full min-h-[80px] bg-white/10 border rounded-lg px-3 py-2 text-white resize-none overflow-hidden ${
                    formErrors.skills ? 'border-red-400 bg-red-500/10' : 'border-white/20'
                  }`} 
                  placeholder="• JavaScript/TypeScript&#10;• React.js&#10;• Node.js&#10;• PostgreSQL"
                />
                {formErrors.skills && (
                  <p className="text-red-400 text-xs mt-1">{formErrors.skills}</p>
                )}
                <p className="text-gray-400 text-xs">{newJobData.skills.length}/5000 characters</p>
              </div>

              {/* Priority + AI improve (status is implicitly New Job Request/inactive) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Priority</label>
                  <select value={newJobData.priority} onChange={(e)=> setNewJobData(p=> ({...p, priority: e.target.value as any}))} className="w-full job-select border border-white/20 rounded-lg px-3 py-2">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">AI Assistant</label>
                  <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                      className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                      disabled={!newJobData.title || !newJobData.experienceLevel || isImprovingNew}
                      onClick={async ()=>{
                        try {
                          setIsImprovingNew(true)
                          const token = await getSessionToken()
                          if (!token) throw new Error('Not authenticated')
                          const payload = {
                            job_title: newJobData.title,
                            experience_level: newJobData.experienceLevel,
                            job_description: newJobData.jobDescription || '',
                            requirements: newJobData.requirements ? newJobData.requirements.split('\n') : [],
                            responsibilities: newJobData.responsibilities ? newJobData.responsibilities.split('\n') : [],
                            benefits: newJobData.benefits ? newJobData.benefits.split('\n') : [],
                            skills: newJobData.skills ? newJobData.skills.split('\n') : []
                          }
                          const res = await fetch('/api/admin/jobs/improve', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ data: payload })
                          })
                          if (!res.ok) throw new Error('AI improve failed')
                          const data = await res.json()
                          const imp = data.improved
                          setNewJobData(prev => ({
                            ...prev,
                            title: imp.job_title || prev.title,
                            experienceLevel: (imp.experience_level as any) || prev.experienceLevel,
                            jobDescription: imp.job_description || prev.jobDescription,
                            requirements: (imp.requirements || []).join('\n'),
                            responsibilities: (imp.responsibilities || []).join('\n'),
                            benefits: (imp.benefits || []).join('\n'),
                            skills: (imp.skills || []).join('\n')
                          }))
                        } catch (e) {
                          console.error(e)
                          alert('Failed to improve with AI')
                        } finally {
                          setIsImprovingNew(false)
                        }
                      }}
                    >
                      {isImprovingNew ? 'Improving…' : 'Improve with AI'}
                </Button>
                    <span className="text-xs text-gray-400">Requires Job Title and Experience Level</span>
                  </div>
                </div>
              </div>


              
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={handleAddJob} 
                  disabled={isSubmitting || Object.keys(formErrors).length > 0}

                  className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Job Request'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={()=> setIsAddJobDialogOpen(false)} 
                  disabled={isSubmitting}
                  className="border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Status Dialog */}
        <Dialog open={isAddStatusDialogOpen} onOpenChange={setIsAddStatusDialogOpen}>
          <DialogContent className="bg-gray-900/95 backdrop-blur-md border border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Add New Status Group</DialogTitle>
              <DialogDescription className="text-gray-300">
                Create a new status column to organize your job postings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Status Name</label>
                <Input
                  value={newStatusData.title}
                  onChange={(e) => setNewStatusData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Approved, In Review, Final Stage"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Color</label>
                <select
                  value={newStatusData.color}
                  onChange={(e) => setNewStatusData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white [&>option]:bg-gray-800 [&>option]:text-white"
                >
                  <option value="bg-blue-500">Blue</option>
                  <option value="bg-green-500">Green</option>
                  <option value="bg-purple-500">Purple</option>
                  <option value="bg-pink-500">Pink</option>
                  <option value="bg-indigo-500">Indigo</option>
                  <option value="bg-teal-500">Teal</option>
                  <option value="bg-orange-500">Orange</option>
                  <option value="bg-red-500">Red</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAddStatus}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                >
                  Add Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddStatusDialogOpen(false)}
                  className="border-white/10 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
                 </Dialog>

        {/* Edit Job Dialog */}
        <Dialog open={isEditJobDialogOpen} onOpenChange={setIsEditJobDialogOpen}>
          <DialogContent className="bg-[#0b0b0d] text-white border border-white/10 job-edit-modal-v2">
            <DialogHeader>
              <DialogTitle className="sr-only">Edit Job</DialogTitle>
            </DialogHeader>
                         {/* Enhanced Header with buttons - always visible */}
             <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
               <div className="flex items-center gap-6">
                 <div className="flex items-center gap-3">
                   <div>
                     <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                       {editingJob?.company_name || 'Member'} | {editingJob?.job_title || 'Role Title'}
                     </h2>
                   </div>
                 </div>
                 
                 {/* Enhanced Status Badge */}
                 <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-medium text-gray-300">Status</span>
                     <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                       mapEnumToUi(editingJob?.status) === 'hiring' 
                         ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                         : mapEnumToUi(editingJob?.status) === 'job-request' 
                           ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                           : mapEnumToUi(editingJob?.status) === 'approved' 
                             ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                             : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                     }`}>
                       {mapEnumToUi(editingJob?.status) === 'hiring' ? 'Active' : mapEnumToUi(editingJob?.status) === 'job-request' ? 'Job Request' : mapEnumToUi(editingJob?.status) === 'approved' ? 'Processed' : 'Closed'}
                     </span>
                   </div>
                 </div>
               </div>
               
               <div className="flex items-center gap-4">
                 {hasUnsavedChanges && (
                   <div className="flex items-center gap-2 text-orange-400 text-sm bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20">
                     <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                     Unsaved changes
                   </div>
                 )}
                 
                 <div className="flex gap-3">
                   <Button
                     onClick={saveAllChanges}
                     disabled={!hasUnsavedChanges || isSaving}
                     className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white disabled:opacity-50 px-6"
                   >
                     {isSaving ? (
                       <>
                         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                         Saving...
                       </>
                     ) : (
                       <>
                         <CheckCircle className="h-4 w-4 mr-2" />
                         Save Changes
                       </>
                     )}
                   </Button>
                           
                           <Button
                             className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white px-6"
                             onClick={async ()=> {
                          if (!editingJob) return
                          try {
                            setIsImproving(true)
                            const token = await getSessionToken()
                            if (!token) throw new Error('Not authenticated')

                            // If editing a processed job, generate improvements and persist to processed table
                            if (editingJob.__source === 'processed') {
                              const payload = {
                                job_title: editingJob.job_title || '',
                                experience_level: editingJob.experience_level || '',
                                job_description: editingJob.job_description || '',
                                requirements: Array.isArray(editingJob.requirements) ? editingJob.requirements : [],
                                responsibilities: Array.isArray(editingJob.responsibilities) ? editingJob.responsibilities : [],
                                benefits: Array.isArray(editingJob.benefits) ? editingJob.benefits : [],
                                skills: Array.isArray(editingJob.skills) ? editingJob.skills : []
                              }
                              const res = await fetch('/api/admin/jobs/improve', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ data: payload })
                              })
                              if (!res.ok) throw new Error('AI improve failed')
                              const data = await res.json()
                              const imp = data.improved

                              // Update modal state immediately
                              setEditingJob((p:any)=> ({
                                ...(p||{}),
                                job_title: imp.job_title,
                                experience_level: imp.experience_level,
                                job_description: imp.job_description,
                                requirements: imp.requirements,
                                responsibilities: imp.responsibilities,
                                benefits: imp.benefits,
                                skills: imp.skills
                              }))

                              // Persist to processed table and reflect list
                              await savePartialUpdate({
                                title: imp.job_title,
                                experienceLevel: imp.experience_level,
                                jobDescription: imp.job_description,
                                requirements: imp.requirements,
                                responsibilities: imp.responsibilities,
                                benefits: imp.benefits,
                                skills: imp.skills
                              })
                              setJobs(prev => prev.map(j => j.id === String(editingJob.id) ? { ...j, title: imp.job_title } : j))
                            } else {
                              // Original job → process and create processed record
                              const res = await fetch('/api/admin/jobs/process', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ id: editingJob.id })
                              })
                              if (!res.ok) throw new Error('AI process failed')
                              const data = await res.json()
                              // Update board: remove original, add processed
                              setJobs(prev => {
                                const removed = prev.filter(j => j.id !== String(data.originalJobId))
                                return [data.processedJob, ...removed]
                              })
                              // Update modal header with processed data
                              setEditingJob((p:any)=> ({ ...(p||{}), status: 'processed', job_title: data.processedJob.title, __source: 'processed' }))
                            }
                          } catch (e) {
                            console.error(e)
                            alert('Failed to improve with AI')
                          } finally {
                            setIsImproving(false)
                          }
                        }}
                      >
                        {isImproving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Improving...
                          </>
                        ) : (
                          'Improve with AI'
                        )}
                      </Button>
                </div>
              </div>
            </div>
            
            {/* AI improvement note - below header */}
            {mapEnumToUi(editingJob?.status) === 'job-request' && (
              <div className="text-[11px] text-gray-400 mb-4 text-center">
                Once this job request is improved with AI, it will be moved to processed request
              </div>
            )}

                          <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
              {editingJob ? (
                <>
                                     {/* Left: Job Form (40% width) */}
                   <div className="flex-1 lg:flex-[2] space-y-6 overflow-y-auto job-modal-scroll pr-4">

                                         {/* Basic Information Section */}
                     <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                           <User className="w-4 h-4 text-white" />
                         </div>
                         <h3 className="text-xl font-bold text-white">Basic Information</h3>
                       </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Member */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Member</label>
                          <select
                            value={editingJob.company_id || ''}
                                                         onChange={(e) => savePartialUpdate({ companyId: e.target.value }, (prev: any) => ({ company_id: e.target.value, company_name: (members.find(m => m.company_id === e.target.value)?.company || editingJob.company_name) }))}
                            className="w-full job-select border border-white/20 rounded-lg px-3 py-2"
                          >
                            <option value="">Select company</option>
                            {members.map(m => (<option key={m.company_id} value={m.company_id}>{m.company}</option>))}
                          </select>
                        </div>
                        {/* Role Title */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Role Title</label>
                          <input
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                            value={editingJob.job_title || ''}
                            onChange={(e) => setEditingJob((p:any) => ({ ...(p||{}), job_title: e.target.value }))}
                            onBlur={(e) => savePartialUpdate({ title: e.currentTarget.value })}
                          />
                        </div>
                      </div>
                    </div>
                    
                                         {/* Work Details Section */}
                     <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                           <Briefcase className="w-4 h-4 text-white" />
                         </div>
                         <h3 className="text-xl font-bold text-white">Work Details</h3>
                       </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Work Arrangement */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Work Arrangement</label>
                          <select
                            className="w-full job-select border border-white/20 rounded-lg px-3 py-2"
                            value={editingJob.work_arrangement || 'onsite'}
                            onChange={(e) => { setEditingJob((p:any) => ({ ...(p||{}), work_arrangement: e.target.value })); savePartialUpdate({ workArrangement: e.target.value }) }}
                          >
                            <option value="onsite">Onsite</option>
                            <option value="remote">Remote</option>
                            <option value="hybrid">Hybrid</option>
                          </select>
                        </div>
                        {/* Experience Level */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Experience Level</label>
                          <select
                            className="w-full job-select border border-white/20 rounded-lg px-3 py-2"
                            value={editingJob.experience_level || ''}
                            onChange={(e) => { setEditingJob((p:any) => ({ ...(p||{}), experience_level: e.target.value })); savePartialUpdate({ experienceLevel: e.target.value }) }}
                          >
                            <option value="">Select level</option>
                            <option value="entry-level">Entry-level</option>
                            <option value="mid-level">Mid-level</option>
                            <option value="senior-level">Senior-level</option>
                          </select>
                        </div>
                        {/* Shift */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Shift</label>
                          <select 
                            className="w-full job-select border border-white/20 rounded-lg px-3 py-2" 
                            value={editingJob.shift || 'day'} 
                            onChange={(e)=> { setEditingJob((p:any)=> ({...(p||{}), shift: e.target.value })); savePartialUpdate({ shift: e.target.value }) }}
                          >
                            <option value="day">Day</option>
                            <option value="night">Night</option>
                          </select>
                        </div>
                      </div>
                    </div>
                                         {/* Compensation & Priority Section */}
                     <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                           <span className="text-white font-bold text-sm">₱</span>
                         </div>
                         <h3 className="text-xl font-bold text-white">Compensation & Priority</h3>
                       </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Salary Range */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Salary Range</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="number" 
                              placeholder="Min"
                              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white" 
                              value={editingJob.salary_min ?? ''} 
                              onChange={(e)=> setEditingJob((p:any)=>({...(p||{}), salary_min: e.target.value===''? null: Number(e.target.value)}))} 
                              onBlur={()=> savePartialUpdate({ salary: buildSalaryString(editingJob.currency || 'PHP', editingJob.salary_min ?? null, editingJob.salary_max ?? null, editingJob.salary_type || 'monthly'), salaryType: editingJob.salary_type || 'monthly', currency: editingJob.currency || 'PHP' })} 
                            />
                            <input 
                              type="number" 
                              placeholder="Max"
                              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white" 
                              value={editingJob.salary_max ?? ''} 
                              onChange={(e)=> setEditingJob((p:any)=>({...(p||{}), salary_max: e.target.value===''? null: Number(e.target.value)}))} 
                              onBlur={()=> savePartialUpdate({ salary: buildSalaryString(editingJob.currency || 'PHP', editingJob.salary_min ?? null, editingJob.salary_max ?? null, editingJob.salary_type || 'monthly'), salaryType: editingJob.salary_type || 'monthly', currency: editingJob.currency || 'PHP' })} 
                            />
                          </div>
                        </div>
                        {/* Salary Type */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Salary Type</label>
                          <select 
                            className="w-full job-select border border-white/20 rounded-lg px-3 py-2" 
                            value={editingJob.salary_type || 'monthly'} 
                            onChange={(e)=> { setEditingJob((p:any)=> ({...(p||{}), salary_type: e.target.value })); savePartialUpdate({ salaryType: e.target.value }) }}
                          >
                            <option value="monthly">Monthly</option>
                            <option value="annual">Annual</option>
                          </select>
                        </div>
                        {/* Priority */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Priority</label>
                          <select 
                            className="w-full job-select border border-white/20 rounded-lg px-3 py-2" 
                            value={editingJob.priority || 'medium'} 
                            onChange={(e)=> { setEditingJob((p:any)=> ({...(p||{}), priority: e.target.value })); savePartialUpdate({ priority: e.target.value }) }}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                                         {/* Additional Details Section */}
                     <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                           <MapPin className="w-4 h-4 text-white" />
                         </div>
                         <h3 className="text-xl font-bold text-white">Additional Details</h3>
                       </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Industry */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Industry</label>
                          <input 
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white" 
                            value={editingJob.industry || ''} 
                            onChange={(e)=> setEditingJob((p:any)=> ({...(p||{}), industry: e.target.value}))} 
                            onBlur={(e)=> savePartialUpdate({ industry: e.currentTarget.value })} 
                            placeholder="e.g. Technology, Finance"
                          />
                        </div>
                        {/* Department */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Department</label>
                          <input 
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white" 
                            value={editingJob.department || ''} 
                            onChange={(e)=> setEditingJob((p:any)=> ({...(p||{}), department: e.target.value}))} 
                            onBlur={(e)=> savePartialUpdate({ department: e.currentTarget.value })} 
                            placeholder="e.g. Engineering, Marketing"
                          />
                        </div>
                        {/* Application Deadline */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Application Deadline</label>
                          <input 
                            type="date" 
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white" 
                            value={editingJob.application_deadline ? String(editingJob.application_deadline).slice(0,10) : ''} 
                            onChange={(e)=> { setEditingJob((p:any)=> ({...(p||{}), application_deadline: e.target.value })); savePartialUpdate({ application_deadline: e.target.value }) }} 
                          />
                        </div>
                      </div>
                    </div>
                                         {/* Job Description Section */}
                     <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                           <Edit className="w-4 h-4 text-white" />
                         </div>
                         <h3 className="text-xl font-bold text-white">Job Description</h3>
                       </div>
                      <div className="space-y-2">
                        <textarea 
                          className="w-full min-h-[120px] bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white resize-y" 
                          value={editingJob.job_description || ''} 
                          onChange={(e)=> setEditingJob((p:any)=> ({...(p||{}), job_description: e.target.value }))} 
                          onBlur={(e)=> savePartialUpdate({ jobDescription: e.currentTarget.value })} 
                          placeholder="Enter detailed job description..."
                        />
                      </div>
                    </div>
                    
                                         {/* Requirements & Responsibilities Section */}
                     <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                           <CheckCircle className="w-4 h-4 text-white" />
                         </div>
                         <h3 className="text-xl font-bold text-white">Requirements & Responsibilities</h3>
                       </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Requirements */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Requirements</label>
                          <textarea 
                            className="w-full min-h-[100px] bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white resize-y" 
                            value={(editingJob.requirements || []).join('\n')} 
                            onChange={(e)=> setEditingJob((p:any)=> ({...(p||{}), requirements: e.target.value.split('\n')}))} 
                            onBlur={(e)=> savePartialUpdate({ requirements: e.currentTarget.value.split('\n') })} 
                            placeholder="Enter requirements (one per line)..."
                          />
                        </div>
                        {/* Responsibilities */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Responsibilities</label>
                          <textarea 
                            className="w-full min-h-[100px] bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white resize-y" 
                            value={(editingJob.responsibilities || []).join('\n')} 
                            onChange={(e)=> setEditingJob((p:any)=> ({...(p||{}), responsibilities: e.target.value.split('\n')}))} 
                            onBlur={(e)=> savePartialUpdate({ responsibilities: e.currentTarget.value.split('\n') })} 
                            placeholder="Enter responsibilities (one per line)..."
                          />
                        </div>
                      </div>
                    </div>
                    
                                         {/* Benefits & Skills Section */}
                     <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                       <div className="flex items-center gap-3 mb-6">
                         <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                           <span className="text-white font-bold text-sm">★</span>
                         </div>
                         <h3 className="text-xl font-bold text-white">Benefits & Skills</h3>
                       </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Benefits */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Benefits</label>
                          <textarea 
                            className="w-full min-h-[100px] bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white resize-y" 
                            value={(editingJob.benefits || []).join('\n')} 
                            onChange={(e)=> setEditingJob((p:any)=> ({...(p||{}), benefits: e.target.value.split('\n')}))} 
                            onBlur={(e)=> savePartialUpdate({ benefits: e.currentTarget.value.split('\n') })} 
                            placeholder="Enter benefits (one per line)..."
                          />
                        </div>
                        {/* Skills */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-300">Skills</label>
                          <textarea 
                            className="w-full min-h-[100px] bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white resize-y" 
                            value={(editingJob.skills || []).join('\n')} 
                            onChange={(e)=> setEditingJob((p:any)=> ({...(p||{}), skills: e.target.value.split('\n')}))} 
                            onBlur={(e)=> savePartialUpdate({ skills: e.currentTarget.value.split('\n') })} 
                            placeholder="Enter skills (one per line)..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                                                        {/* Right: Activity (full space) */}
                    <div className="w-full lg:flex-1 p-6 flex flex-col h-full">
                     <div className="flex items-center gap-3 mb-6">
                       <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                         <span className="text-white font-bold text-sm">💬</span>
                       </div>
                       <div className="text-sm text-gray-300 font-semibold">Activity Feed</div>
                     </div>
                    <div id="comments" className="flex-1 overflow-y-auto space-y-3 pr-1 job-modal-scroll min-h-0">
                      {/* Comments will be loaded below */}
                      {(editingJob.__comments || []).map((c:any)=> (
                        <div key={c.id} className="text-sm text-white/80 bg-white/5 border border-white/10 rounded-md p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <img src={c.user_avatar || '/vercel.svg'} alt="avatar" className="h-6 w-6 rounded-full object-cover" />
                            <div className="text-xs text-gray-300 font-medium">{c.user_name || 'User'}</div>
                            <div className="text-xs text-gray-500 ml-auto">{new Date(c.created_at).toLocaleString()}</div>
                          </div>
                          <div className="leading-relaxed">{c.comment}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto pt-4">
                      <div className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-gray-400 text-sm text-center">
                        Comments feature has been disabled
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  No job selected
                </div>
              )}
            </div>
                     </DialogContent>
         </Dialog>

         {/* Success Alert Dialog */}
         <AlertDialog open={showSuccessAlert} onOpenChange={setShowSuccessAlert}>
           <AlertDialogContent className="bg-[#0b0b0d] text-white border border-white/10">
             <AlertDialogHeader>
               <AlertDialogTitle className="text-white">
                 {successMessage.includes('Error') ? 'Error' : 'Success'}
               </AlertDialogTitle>
               <AlertDialogDescription className="text-gray-300">
                 {successMessage}
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogAction 
               className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white"
               onClick={() => {
                 setShowSuccessAlert(false)
                 // Also close the edit job dialog if it's a success message
                 if (!successMessage.includes('Error')) {
                   setIsEditJobDialogOpen(false)
                   setEditingJob(null)
                   // Reload the page to show updated changes
                   window.location.reload()
                 }
               }}
             >
               OK
             </AlertDialogAction>
           </AlertDialogContent>
         </AlertDialog>

         {/* Delete Confirmation Dialog */}
         <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
           <AlertDialogContent className="bg-[#0b0b0d] text-white border border-white/10">
             <AlertDialogHeader>
               <AlertDialogTitle className="text-white flex items-center gap-2">
                 <Trash2 className="h-5 w-5 text-red-400" />
                 Delete Job
               </AlertDialogTitle>
               <AlertDialogDescription className="text-gray-300">
                 Are you sure you want to delete this job? This action cannot be undone and will permanently remove the job from the database.
               </AlertDialogDescription>
             </AlertDialogHeader>
             <AlertDialogFooter>
               <AlertDialogCancel 
                 className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
                 onClick={() => {
                   setIsDeleteDialogOpen(false)
                   setJobToDelete(null)
                 }}
                 disabled={isDeleting}
               >
                 Cancel
               </AlertDialogCancel>
               <AlertDialogAction
                 className="bg-red-600 hover:bg-red-700 text-white"
                 onClick={confirmDeleteJob}
                 disabled={isDeleting}
               >
                 {isDeleting ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Deleting...
                   </>
                 ) : (
                   'Delete'
                 )}
               </AlertDialogAction>
             </AlertDialogFooter>
           </AlertDialogContent>
         </AlertDialog>

        </div>
      </AdminLayout>
    )
} 

export default function Page() {
  return <JobsPage />
} 