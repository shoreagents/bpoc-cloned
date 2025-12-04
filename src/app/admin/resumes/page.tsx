'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  FileText, 
  Search, 
  MoreHorizontal, 
  Download, 
  Eye, 
  Trash2,
  Calendar,
  User,
  Mail,
  File,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  RefreshCw,
  ChevronDown,
  TrendingUp,
  BarChart3,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import AdminLayout from '@/components/layout/AdminLayout'

interface Resume {
  id: string
  user_id: string
  resume_title: string
  template_used: string
  view_count: number
  created_at: string
  updated_at: string
  user_name: string
  user_email: string
  user_avatar?: string
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [previewResume, setPreviewResume] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [deleteResumeId, setDeleteResumeId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingResumes, setDeletingResumes] = useState<Set<string>>(new Set())
  const [forceDeleteMode, setForceDeleteMode] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)
  const [sortOrder, setSortOrder] = useState<string>('latest')
  const [exportingResumeId, setExportingResumeId] = useState<string | null>(null)

  // Fetch resumes from database
  const fetchResumes = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/resumes?t=${Date.now()}`, { cache: 'no-store' })
      const data = await response.json()
      
      if (response.ok) {
        console.log('📋 Fetched resumes:', data.resumes);
        console.log('📋 First resume slug:', data.resumes[0]?.resume_slug);
        setResumes(data.resumes)
      } else {
        toast.error('Failed to fetch resumes')
      }
    } catch (error) {
      toast.error('Error fetching resumes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])



  // Filter resumes based on search term and sort by date
  const filteredResumes = resumes.filter((resume) => {
    const matchesSearch = 
      resume.resume_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.template_used.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  }).sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return sortOrder === 'latest' ? dateB - dateA : dateA - dateB
  })



  // Pagination logic
  const totalPages = Math.ceil(filteredResumes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentResumes = filteredResumes.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortOrder])

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
    return variants[status as keyof typeof variants] || variants.draft
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleViewResume = async (resumeId: string) => {
    try {
      setPreviewLoading(true)
      setPreviewOpen(true)
      
      const response = await fetch(`/api/admin/resumes/${resumeId}/preview?t=${Date.now()}`, { cache: 'no-store' })
      const data = await response.json()
      
      if (response.ok) {
        console.log('🔍 Preview resume data:', data.resume);
        console.log('🔍 Preview resume slug:', data.resume?.resume_slug);
        setPreviewResume(data.resume)
      } else {
        toast.error('Failed to fetch resume preview')
      }
    } catch (error) {
      toast.error('Error fetching resume preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  // Export to PDF function (for when preview is already open)
  const exportToPDF = async () => {
    if (!previewResume) {
      toast.error('No resume to export')
      return
    }

    setExportingResumeId(previewResume.id)

    try {
      // Wait for fonts to load
      await document.fonts.ready

      let element: HTMLElement | null = null

      // Try to get the resume content element
      // First, try to get from iframe if it exists
      if (previewResume?.resume_slug) {
        // Wait a bit for iframe to load
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const iframe = document.querySelector('iframe[title="Resume Preview"]') as HTMLIFrameElement
        if (iframe?.contentDocument) {
          element = iframe.contentDocument.getElementById('resume-content')
          if (!element) {
            // Try to get the body of the iframe
            const iframeBody = iframe.contentDocument.body
            if (iframeBody) {
              element = iframeBody
            }
          }
        }
      }

      // If not found in iframe, try to get from the HTML content div
      if (!element) {
        const htmlContentDiv = document.querySelector('.resume-preview-content') as HTMLElement
        if (htmlContentDiv) {
          element = htmlContentDiv
        }
      }

      if (!element) {
        toast.error('Resume content not found. Please ensure the preview is loaded.')
        return
      }

      await generatePDFFromElement(element, previewResume.user_name || 'Resume')

    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Error generating PDF. Please try again.')
    } finally {
      setExportingResumeId(null)
    }
  }

  // Direct export function (fetches resume and exports without opening preview)
  const exportResumeToPDF = async (resumeId: string, userName: string) => {
    setExportingResumeId(resumeId)

    try {
      // First, get the resume slug from the resume list or fetch it
      const resume = resumes.find(r => r.id === resumeId)
      if (!resume || !resume.resume_slug) {
        toast.error('Resume not found')
        return
      }

      // Fetch actual resume data using the same API as the resume view page
      const response = await fetch(`/api/get-saved-resume/${resume.resume_slug}`, {
        cache: 'no-store'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch resume data')
      }

      const data = await response.json()
      if (!data.success || !data.resume) {
        throw new Error('Resume not found')
      }

      const resumeData = data.resume

      // Wait for fonts to load
      await document.fonts.ready

      let element: HTMLElement | null = null

      // Always generate HTML from resume_data to ensure it matches what's displayed
      if (!resumeData.data) {
        throw new Error('No resume data available to export')
      }

      // Generate HTML from resume_data structure (same as what's displayed on the page)
      const resumeDataObj = typeof resumeData.data === 'string' 
        ? JSON.parse(resumeData.data) 
        : resumeData.data
      
      // Pass user data to match the same priority as the resume view page
      const htmlContent = generateResumeHTMLFromData(
        resumeDataObj, 
        resumeData.user?.fullName || userName,
        resumeData.user // Pass full user object
      )

      // Create a properly attached container in the main document
      const hiddenContainer = document.createElement('div')
      hiddenContainer.id = 'pdf-export-container'
      hiddenContainer.style.position = 'fixed'
      hiddenContainer.style.left = '0'
      hiddenContainer.style.top = '0'
      hiddenContainer.style.width = '800px' // Match the content width
      hiddenContainer.style.minHeight = '297mm'
      hiddenContainer.style.backgroundColor = '#ffffff'
      hiddenContainer.style.zIndex = '9999'
      hiddenContainer.style.opacity = '0'
      hiddenContainer.style.pointerEvents = 'none'
      hiddenContainer.style.overflow = 'visible' // Allow content to flow naturally
      
      // Ensure it's attached to the main document body
      document.body.appendChild(hiddenContainer)

      try {
        // Create the resume content div
        const htmlDiv = document.createElement('div')
        htmlDiv.id = 'resume-content'
        htmlDiv.className = 'resume-preview-content'
        htmlDiv.style.padding = '40px'
        htmlDiv.style.backgroundColor = 'white'
        htmlDiv.style.color = '#333'
        htmlDiv.style.fontSize = '14px'
        htmlDiv.style.lineHeight = '1.6'
        htmlDiv.style.fontFamily = 'Arial, sans-serif'
        htmlDiv.style.width = '800px' // Fixed width for consistent rendering
        htmlDiv.style.maxWidth = '800px'
        htmlDiv.style.margin = '0 auto'
        htmlDiv.style.boxSizing = 'border-box'
        htmlDiv.style.overflow = 'hidden' // Prevent content overflow
        htmlDiv.innerHTML = htmlContent
        hiddenContainer.appendChild(htmlDiv)
        element = htmlDiv
        
        // Force a reflow to ensure content is rendered
        await new Promise(resolve => setTimeout(resolve, 500))

        // Wait for content to render and images to load
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Wait for any images to load
        const images = htmlDiv.getElementsByTagName('img')
        if (images.length > 0) {
          await Promise.all(
            Array.from(images).map(img => {
              if (img.complete) return Promise.resolve()
              return new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = resolve // Continue even if image fails
                setTimeout(resolve, 3000) // Timeout after 3 seconds
              })
            })
          )
        }

        // Generate PDF from the element
        await generatePDFFromElement(element, userName)

      } finally {
        // Clean up hidden container
        if (hiddenContainer.parentNode) {
          document.body.removeChild(hiddenContainer)
        }
      }

    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Error generating PDF. Please try again.')
    } finally {
      setExportingResumeId(null)
    }
  }

  // Helper function to generate HTML from resume data (matches the resume view page structure)
  const generateResumeHTMLFromData = (resumeData: any, userName: string, userData?: any): string => {
    // Extract the actual content structure
    const content = resumeData?.content || resumeData
    const template = resumeData?.template || {}
    const headerInfo = resumeData?.headerInfo || {}
    const profilePhoto = resumeData?.profilePhoto
    
    const primaryColor = template?.primaryColor || '#6366f1'
    const secondaryColor = template?.secondaryColor || '#6b7280'
    const fontFamily = template?.fontFamily || 'Inter, sans-serif'
    
    // Get name, title, location - match the same priority as resume view page
    // Priority: user data > resume data content > resume data headerInfo
    const name = userData?.fullName || content?.name || headerInfo?.name || userName || 'Professional'
    const title = userData?.position || content?.bestJobTitle || headerInfo?.title || content?.title || 'Professional'
    const location = userData?.location || headerInfo?.location || content?.location || ''
    const email = headerInfo?.email || content?.email || userData?.email || ''
    const phone = headerInfo?.phone || content?.phone || userData?.phone || ''
    
    let html = `<div id="resume-content" style="font-family: ${fontFamily}, sans-serif; width: 100%; max-width: 800px; margin: 0 auto; padding: 40px; background: white; color: #1f2937; box-sizing: border-box; overflow: hidden;">`
    
    // Header Section
    html += `<div style="margin-bottom: 32px; position: relative;">`
    if (profilePhoto) {
      html += `<div style="text-align: left;">`
    } else {
      html += `<div style="text-align: center;">`
    }
    html += `<h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px; color: ${primaryColor};">${escapeHtml(name)}</h1>`
    html += `<p style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: ${secondaryColor};">${escapeHtml(title)}</p>`
    if (location) {
      html += `<p style="color: #4b5563; margin-bottom: 8px;">${escapeHtml(location)}</p>`
    }
    // Note: Email and phone are NOT displayed in the resume view page, so we don't include them here
    html += `</div>`
    
    if (profilePhoto) {
      html += `<div style="position: absolute; top: 0; right: 0;">`
      html += `<img src="${profilePhoto}" alt="Profile" style="width: 128px; height: 128px; border-radius: 8px; object-fit: cover; border: 4px solid ${primaryColor}; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />`
      html += `</div>`
    }
    html += `</div>`
    
    // Divider (use template primary color with 0.3 opacity, matching resume view page)
    html += `<div data-divider="true" class="w-full h-0.5 my-6" style="width: 100%; height: 0.5px; margin: 24px 0; background-color: ${primaryColor}; opacity: 0.3;"></div>`
    
    // Professional Summary
    if (content?.summary) {
      html += `<div style="margin-bottom: 24px;">`
      html += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">`
      html += `<div style="width: 4px; height: 24px; border-radius: 2px; background-color: ${primaryColor};"></div>`
      html += `<h2 style="font-size: 18px; font-weight: 600; color: ${primaryColor};">Professional Summary</h2>`
      html += `</div>`
      html += `<p style="color: #374151; line-height: 1.75; padding-left: 12px; border-left: 2px solid ${secondaryColor};">${escapeHtml(content.summary)}</p>`
      html += `</div>`
    }
    
    // Work Experience
    if (content?.experience && Array.isArray(content.experience) && content.experience.length > 0) {
      html += `<div style="margin-bottom: 24px;">`
      html += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">`
      html += `<div style="width: 4px; height: 24px; border-radius: 2px; background-color: ${primaryColor};"></div>`
      html += `<h2 style="font-size: 18px; font-weight: 600; color: ${primaryColor};">Work Experience</h2>`
      html += `</div>`
      html += `<div style="space-y: 16px;">`
      content.experience.forEach((exp: any) => {
        html += `<div style="border-left: 4px solid ${secondaryColor}; padding-left: 16px; margin-bottom: 16px;">`
        html += `<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">`
        html += `<h3 style="font-weight: 600; color: #1f2937; margin: 0;">${escapeHtml(exp.title || exp.position || '')}</h3>`
        if (exp.duration) {
          html += `<span style="font-size: 14px; color: #6b7280; background: #f3f4f6; padding: 4px 8px; border-radius: 9999px;">${escapeHtml(exp.duration)}</span>`
        }
        html += `</div>`
        if (exp.company) {
          html += `<p style="color: #4b5563; margin-bottom: 8px; font-weight: 500;">${escapeHtml(exp.company)}</p>`
        }
        if (exp.description) {
          html += `<p style="color: #374151; font-size: 14px; margin-bottom: 8px;">${escapeHtml(exp.description)}</p>`
        }
        if (exp.achievements && Array.isArray(exp.achievements) && exp.achievements.length > 0) {
          html += `<ul style="list-style: disc; padding-left: 20px; margin: 8px 0; font-size: 14px; color: #374151;">`
          exp.achievements.forEach((ach: string) => {
            html += `<li style="margin-bottom: 4px;">${escapeHtml(ach)}</li>`
          })
          html += `</ul>`
        }
        html += `</div>`
      })
      html += `</div>`
      html += `</div>`
    }
    
    // Education
    if (content?.education && Array.isArray(content.education) && content.education.length > 0) {
      html += `<div style="margin-bottom: 24px;">`
      html += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">`
      html += `<div style="width: 4px; height: 24px; border-radius: 2px; background-color: ${primaryColor};"></div>`
      html += `<h2 style="font-size: 18px; font-weight: 600; color: ${primaryColor};">Education</h2>`
      html += `</div>`
      html += `<div style="space-y: 16px;">`
      content.education.forEach((edu: any) => {
        html += `<div style="border-left: 4px solid ${secondaryColor}; padding-left: 16px; margin-bottom: 16px;">`
        html += `<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">`
        html += `<h3 style="font-weight: 600; color: #1f2937; margin: 0;">${escapeHtml(edu.degree || '')}</h3>`
        if (edu.year) {
          html += `<span style="font-size: 14px; color: #6b7280; background: #f3f4f6; padding: 4px 8px; border-radius: 9999px;">${escapeHtml(edu.year)}</span>`
        }
        html += `</div>`
        if (edu.institution) {
          html += `<p style="color: #4b5563; margin-bottom: 8px; font-weight: 500;">${escapeHtml(edu.institution)}</p>`
        }
        if (edu.major) {
          html += `<p style="color: #374151; font-size: 14px; margin-bottom: 8px;">Major: ${escapeHtml(edu.major)}</p>`
        }
        if (edu.highlights && Array.isArray(edu.highlights) && edu.highlights.length > 0) {
          html += `<ul style="list-style: disc; padding-left: 20px; margin: 8px 0; font-size: 14px; color: #374151;">`
          edu.highlights.forEach((highlight: string) => {
            html += `<li style="margin-bottom: 4px;">${escapeHtml(highlight)}</li>`
          })
          html += `</ul>`
        }
        html += `</div>`
      })
      html += `</div>`
      html += `</div>`
    }
    
    // Skills
    if (content?.skills) {
      html += `<div style="margin-bottom: 24px;">`
      html += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">`
      html += `<div style="width: 4px; height: 24px; border-radius: 2px; background-color: ${primaryColor};"></div>`
      html += `<h2 style="font-size: 18px; font-weight: 600; color: ${primaryColor};">Skills</h2>`
      html += `</div>`
      html += `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">`
      
      if (content.skills.technical && Array.isArray(content.skills.technical) && content.skills.technical.length > 0) {
        html += `<div>`
        html += `<h3 style="font-weight: 500; color: #1f2937; margin-bottom: 12px;">Technical Skills</h3>`
        html += `<div style="display: flex; flex-wrap: wrap; gap: 8px;">`
        content.skills.technical.forEach((skill: string) => {
          html += `<span style="background-color: ${secondaryColor}; color: white; font-size: 12px; padding: 4px 8px; border-radius: 4px;">${escapeHtml(skill)}</span>`
        })
        html += `</div>`
        html += `</div>`
      }
      
      if (content.skills.soft && Array.isArray(content.skills.soft) && content.skills.soft.length > 0) {
        html += `<div>`
        html += `<h3 style="font-weight: 500; color: #1f2937; margin-bottom: 12px;">Soft Skills</h3>`
        html += `<div style="display: flex; flex-wrap: wrap; gap: 8px;">`
        content.skills.soft.forEach((skill: string) => {
          html += `<span style="border: 1px solid #d1d5db; color: #374151; font-size: 12px; padding: 4px 8px; border-radius: 4px;">${escapeHtml(skill)}</span>`
        })
        html += `</div>`
        html += `</div>`
      }
      
      if (content.skills.languages && Array.isArray(content.skills.languages) && content.skills.languages.length > 0) {
        html += `<div>`
        html += `<h3 style="font-weight: 500; color: #1f2937; margin-bottom: 12px;">Languages</h3>`
        html += `<div style="display: flex; flex-wrap: wrap; gap: 8px;">`
        content.skills.languages.forEach((skill: string) => {
          html += `<span style="border: 1px solid #60a5fa; color: #1e40af; font-size: 12px; padding: 4px 8px; border-radius: 4px;">${escapeHtml(skill)}</span>`
        })
        html += `</div>`
        html += `</div>`
      }
      
      html += `</div>`
      html += `</div>`
    }
    
    // Certifications
    if (content?.certifications && Array.isArray(content.certifications) && content.certifications.length > 0) {
      html += `<div style="margin-bottom: 24px;">`
      html += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">`
      html += `<div style="width: 4px; height: 24px; border-radius: 2px; background-color: ${primaryColor};"></div>`
      html += `<h2 style="font-size: 18px; font-weight: 600; color: ${primaryColor};">Certifications</h2>`
      html += `</div>`
      html += `<div style="space-y: 12px;">`
      content.certifications.forEach((cert: string) => {
        html += `<div style="border-left: 4px solid ${secondaryColor}; padding-left: 16px;">`
        html += `<p style="color: #374151; font-size: 14px;">${escapeHtml(cert)}</p>`
        html += `</div>`
      })
      html += `</div>`
      html += `</div>`
    }
    
    // Projects
    if (content?.projects && Array.isArray(content.projects) && content.projects.length > 0) {
      html += `<div style="margin-bottom: 24px;">`
      html += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">`
      html += `<div style="width: 4px; height: 24px; border-radius: 2px; background-color: ${primaryColor};"></div>`
      html += `<h2 style="font-size: 18px; font-weight: 600; color: ${primaryColor};">Projects</h2>`
      html += `</div>`
      html += `<div style="space-y: 16px;">`
      content.projects.forEach((proj: any) => {
        html += `<div style="border-left: 4px solid ${secondaryColor}; padding-left: 16px; margin-bottom: 16px;">`
        if (proj.title) {
          html += `<h3 style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">${escapeHtml(proj.title)}</h3>`
        }
        if (proj.description) {
          html += `<p style="color: #374151; font-size: 14px; margin-bottom: 8px; line-height: 1.6;">${escapeHtml(proj.description)}</p>`
        }
        if (proj.technologies && Array.isArray(proj.technologies) && proj.technologies.length > 0) {
          html += `<p style="color: #6b7280; font-size: 12px; margin-top: 8px;"><strong>Technologies:</strong> ${escapeHtml(proj.technologies.join(', '))}</p>`
        }
        if (proj.impact && Array.isArray(proj.impact) && proj.impact.length > 0) {
          html += `<ul style="list-style: disc; padding-left: 20px; margin: 8px 0; font-size: 14px; color: #374151;">`
          proj.impact.forEach((impact: string) => {
            html += `<li style="margin-bottom: 4px;">${escapeHtml(impact)}</li>`
          })
          html += `</ul>`
        }
        html += `</div>`
      })
      html += `</div>`
      html += `</div>`
    }
    
    html += `</div>`
    return html
  }
  
  // Helper function to escape HTML
  const escapeHtml = (text: string): string => {
    if (!text) return ''
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  // Helper function to generate PDF using Puppeteer API
  const generatePDFFromElement = async (element: HTMLElement, userName: string) => {
    console.log('Preparing resume content for PDF generation...')

    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement
    
    // Get computed styles and apply them inline
    const styles = window.getComputedStyle(element)
    clonedElement.style.width = styles.width
    clonedElement.style.maxWidth = styles.maxWidth
    clonedElement.style.backgroundColor = styles.backgroundColor || '#ffffff'
    clonedElement.style.color = styles.color || '#1f2937'
    clonedElement.style.fontFamily = styles.fontFamily || 'Inter, sans-serif'
    
    // Get all computed styles for child elements
    const allElements = element.querySelectorAll('*')
    allElements.forEach((el) => {
      const computedStyle = window.getComputedStyle(el)
      const htmlEl = el as HTMLElement
      // Preserve important styles
      if (computedStyle.color) htmlEl.style.color = computedStyle.color
      if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        htmlEl.style.backgroundColor = computedStyle.backgroundColor
      }
      if (computedStyle.fontSize) htmlEl.style.fontSize = computedStyle.fontSize
      if (computedStyle.fontWeight) htmlEl.style.fontWeight = computedStyle.fontWeight
      if (computedStyle.fontFamily) htmlEl.style.fontFamily = computedStyle.fontFamily
      if (computedStyle.margin) htmlEl.style.margin = computedStyle.margin
      if (computedStyle.padding) htmlEl.style.padding = computedStyle.padding
    })
    
    // Remove any black backgrounds, shadows, gradients, or problematic styles from cloned element
    const allClonedElements = clonedElement.querySelectorAll('*')
    allClonedElements.forEach((el) => {
      const htmlEl = el as HTMLElement
      const computedStyle = window.getComputedStyle(el)
      
      // Check if it's a divider (preserve dividers even if black)
      const isDivider = htmlEl.getAttribute('data-divider') === 'true' ||
                       htmlEl.classList.contains('h-0.5') ||
                       htmlEl.classList.contains('h-px') ||
                       htmlEl.classList.contains('my-6') ||
                       (parseFloat(computedStyle.height) <= 2 && computedStyle.width === '100%')
      
      // Remove black backgrounds (but preserve dividers)
      if (!isDivider && (htmlEl.style.backgroundColor === 'black' || 
          htmlEl.style.backgroundColor === '#000000' ||
          htmlEl.style.backgroundColor === 'rgb(0, 0, 0)' ||
          htmlEl.style.backgroundColor === 'rgba(0, 0, 0, 1)')) {
        htmlEl.style.backgroundColor = 'transparent'
      }
      
      // Remove shadows
      htmlEl.style.boxShadow = 'none'
      htmlEl.style.textShadow = 'none'
      htmlEl.style.filter = 'none'
      
      // Remove gradients
      if (computedStyle.backgroundImage && computedStyle.backgroundImage.includes('gradient')) {
        htmlEl.style.backgroundImage = 'none'
      }
      if (htmlEl.style.backgroundImage && htmlEl.style.backgroundImage.includes('gradient')) {
        htmlEl.style.backgroundImage = 'none'
      }
      
      // Remove backdrop filters
      htmlEl.style.backdropFilter = 'none'
      htmlEl.style.webkitBackdropFilter = 'none'
      
      // Ensure no black borders
      if (htmlEl.style.borderColor === 'black' || 
          htmlEl.style.borderColor === '#000000') {
        htmlEl.style.borderColor = 'transparent'
      }
      
      // Remove opacity effects that might cause shadows
      if (computedStyle.opacity && parseFloat(computedStyle.opacity) < 1) {
        htmlEl.style.opacity = '1'
      }
    })
    
    // Ensure the main element has white background
    clonedElement.style.backgroundColor = '#ffffff'
    clonedElement.style.color = '#1f2937'
    
    // Create a complete HTML document with styles
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body {
              font-family: ${styles.fontFamily || 'Inter, sans-serif'};
              color: #1f2937;
              background: #ffffff !important;
              padding: 0;
              margin: 0;
              width: 100%;
              height: auto;
              min-height: 100vh;
            }
            body > * {
              background: #ffffff !important;
            }
            /* Override any black backgrounds */
            [style*="background: black"],
            [style*="background-color: black"],
            [style*="background: #000"],
            [style*="background-color: #000"],
            [style*="background: rgb(0, 0, 0)"],
            [style*="background-color: rgb(0, 0, 0)"] {
              background: #ffffff !important;
              background-color: #ffffff !important;
            }
            /* Ensure all divs have proper backgrounds */
            div {
              background: transparent !important;
            }
            div[class*="bg-"] {
              background: #ffffff !important;
            }
            /* Remove any black overlays or pseudo-elements */
            ::before,
            ::after {
              background: transparent !important;
              box-shadow: none !important;
              text-shadow: none !important;
              display: none !important;
            }
            /* Remove all shadows */
            * {
              box-shadow: none !important;
              text-shadow: none !important;
              filter: none !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
            /* Remove gradients */
            [style*="gradient"],
            [class*="gradient"],
            [class*="shadow"] {
              background-image: none !important;
              box-shadow: none !important;
            }
            /* Remove glass effects */
            [class*="glass"],
            [class*="backdrop"] {
              background: #ffffff !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
            }
            ${Array.from(document.styleSheets)
              .map((sheet) => {
                try {
                  return Array.from(sheet.cssRules)
                    .map((rule) => {
                      const ruleText = rule.cssText
                      // Filter out any rules that might cause black backgrounds
                      if (ruleText.includes('background: black') || 
                          ruleText.includes('background-color: black') ||
                          ruleText.includes('background: #000') ||
                          ruleText.includes('background-color: #000')) {
                        return ''
                      }
                      return ruleText
                    })
                    .join('\n')
                } catch (e) {
                  return ''
                }
              })
              .join('\n')}
          </style>
        </head>
        <body style="background: #ffffff !important; color: #1f2937;">
          ${clonedElement.outerHTML}
        </body>
      </html>
    `

    // Format filename as FirstName-LastName-BPOC-Resume.pdf
    const fullName = userName || 'Resume'
    const nameParts = fullName.trim().split(/\s+/)
    const firstName = nameParts[0] || 'Resume'
    const lastName = nameParts.slice(1).join('-') || 'User'
    const fileName = `${firstName}-${lastName}-BPOC-Resume.pdf`
    const pdfTitle = `${fullName} - Resume | BPOC.IO`

    // Add title to HTML for PDF metadata
    const htmlWithTitle = htmlContent.replace(
      '<head>',
      `<head>\n            <title>${pdfTitle}</title>`
    )

    console.log('Sending request to PDF generation API...')

    // Call Puppeteer API
    const response = await fetch('/api/resume/export-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        html: htmlWithTitle,
        fileName: fileName,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate PDF')
    }

    // Get PDF blob
    const blob = await response.blob()
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    console.log('PDF downloaded successfully')
    toast.success('Resume exported to PDF successfully!')
  }



  const handleDeleteResume = async (resumeId: string, force: boolean = false) => {
    try {
      setDeletingResumes(prev => new Set(prev).add(resumeId))
      
      const url = force 
        ? `/api/admin/resumes/${resumeId}?force=true`
        : `/api/admin/resumes/${resumeId}`
      
      const response = await fetch(url, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        // Remove the deleted resume from the list
        setResumes(prevResumes => prevResumes.filter(resume => resume.id !== resumeId))
        setShowDeleteDialog(false)
        setDeleteResumeId(null)
        setForceDeleteMode(false)
        
        // Show success toast
        toast.success('Resume deleted successfully')
      } else {
        const errorData = await response.json()
        
        // Check if it's a constraint violation and offer force delete
        if (response.status === 400 && (errorData.error.includes('applications') || errorData.error.includes('referenced'))) {
          setForceDeleteMode(true)
          setDeleteResumeId(resumeId) // Make sure we keep the resume ID
          setShowDeleteDialog(true) // Open the dialog to show force delete option
          toast.error('Resume has applications. Use force delete to remove all references.')
        } else {
          toast.error(errorData.error || 'Failed to delete resume')
        }
      }
    } catch (error) {
      toast.error('Error deleting resume')
    } finally {
      setDeletingResumes(prev => {
        const newSet = new Set(prev)
        newSet.delete(resumeId)
        return newSet
      })
    }
  }



  return (
    <AdminLayout title="Resume Management" description="Manage user resumes and documents">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Resumes</p>
                  <p className="text-2xl font-bold text-white">{resumes.length}</p>
                  <p className="text-xs text-green-400">All time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Resumes This Month</p>
                  <p className="text-2xl font-bold text-white">
                    {resumes.filter(r => {
                      const createdDate = new Date(r.created_at)
                      const now = new Date()
                      return createdDate.getMonth() === now.getMonth() && 
                             createdDate.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                  <p className="text-xs text-green-400">New this month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg Views/Resume</p>
                  <p className="text-2xl font-bold text-white">
                    {resumes.length > 0 
                      ? Math.round(resumes.reduce((sum, r) => sum + r.view_count, 0) / resumes.length)
                      : 0}
                  </p>
                  <p className="text-xs text-yellow-400">Average engagement</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Users</p>
                  <p className="text-2xl font-bold text-white">
                    {new Set(resumes.map(r => r.user_id)).size}
                  </p>
                  <p className="text-xs text-purple-400">With resumes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search resumes, users, or file types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-white/20 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 invalid:border-white/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={fetchResumes}
                  className="border-transparent text-white hover:bg-white/10"
                  disabled={loading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-transparent text-white hover:bg-white/10">
                      {sortOrder === 'latest' ? 'Latest Resumes' : 'Oldest Resumes'}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-white/10">
                    <DropdownMenuItem 
                      onClick={() => setSortOrder('latest')}
                      className="text-white hover:bg-white/10"
                    >
                      Latest Resumes
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem 
                      onClick={() => setSortOrder('oldest')}
                      className="text-white hover:bg-white/10"
                    >
                      Oldest Resumes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumes Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        ) : filteredResumes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No resumes found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Resume Cards Grid - 12 cards per page: 1 col mobile, 2 cols tablet, 3 cols desktop, 4 cols xl */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentResumes.map((resume) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="glass-card hover:bg-white/5 transition-all duration-200 cursor-pointer">
                    <CardContent className="p-4">
                                             {/* Header with User Info */}
                       <div className="flex items-center space-x-3 mb-3">
                         <Avatar className="w-10 h-10">
                           <AvatarImage 
                             src={resume.user_avatar} 
                             alt={resume.user_name}
                           />
                           <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-600 text-white text-sm">
                             {getInitials(resume.user_name)}
                           </AvatarFallback>
                         </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{resume.user_name}</p>
                          <p className="text-gray-400 text-xs truncate">{resume.user_email}</p>
                        </div>
                      </div>

                                             {/* Resume Title */}
                       <div className="mb-3">
                         <h3 className="text-white font-semibold text-sm mb-1 truncate">
                           {resume.resume_title && !resume.resume_title.toLowerCase().includes('candidate') 
                             ? resume.resume_title 
                             : `${resume.user_name || 'User'}'s Resume`}
                         </h3>
                         <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                           {resume.template_used}
                         </Badge>
                       </div>

                       {/* Resume Info */}
                       <div className="space-y-2 mb-4">
                         <div className="flex items-center justify-between text-xs">
                           <div className="flex items-center space-x-1">
                             <Eye className="w-3 h-3 text-gray-400" />
                             <span className="text-gray-400">Views</span>
                           </div>
                           <span className="text-gray-300">{resume.view_count}</span>
                         </div>
                         
                         <div className="flex items-center justify-between text-xs">
                           <div className="flex items-center space-x-1">
                             <Calendar className="w-3 h-3 text-gray-400" />
                             <span className="text-gray-400">Created</span>
                           </div>
                           <span className="text-gray-300">{formatDate(resume.created_at)}</span>
                         </div>
                       </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <div className="flex items-center space-x-1">
                                                     <Button
                             variant="ghost"
                             size="sm"
                             className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                             title="View Resume"
                             onClick={() => handleViewResume(resume.id)}
                           >
                             <Eye className="w-3 h-3" />
                           </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                            title="Download PDF"
                            onClick={() => exportResumeToPDF(resume.id, resume.user_name)}
                            disabled={exportingResumeId === resume.id}
                          >
                            {exportingResumeId === resume.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                          </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-gray-800 border-white/10 text-white">
                                {exportingResumeId === resume.id ? 'Exporting PDF...' : 'Download PDF'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          title="Delete"
                          disabled={deletingResumes.has(resume.id)}
                          onClick={() => {
                            setDeleteResumeId(resume.id)
                            setForceDeleteMode(false)
                            setShowDeleteDialog(true)
                          }}
                        >
                          {deletingResumes.has(resume.id) ? (
                            <div className="w-3 h-3 animate-spin rounded-full border-2 border-red-400 border-t-transparent"></div>
                          ) : (
                          <Trash2 className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {!loading && filteredResumes.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/10 flex-wrap gap-4 w-full mt-6">
                <div className="text-sm text-gray-400 whitespace-nowrap">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredResumes.length)} of {filteredResumes.length} resumes
                </div>
                <div className="flex items-center space-x-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={
                            currentPage === pageNum
                              ? "bg-cyan-500 text-white hover:bg-cyan-600"
                              : "border-white/10 text-white hover:bg-white/10"
                          }
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
                 )}

                           {/* Resume Preview Modal */}
        {previewOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-white/10 flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-white">Resume Preview</h2>
                  {previewResume?.resume_slug && (
                    <span className="text-sm text-gray-400">Slug: {previewResume.resume_slug}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToPDF}
                    disabled={exportingResumeId !== null || !previewResume}
                    className="border-white/10 text-white hover:bg-white/10 px-4 py-2"
                  >
                    {exportingResumeId !== null ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                  {previewResume?.resume_slug && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/${previewResume.resume_slug}`, '_blank')}
                      className="border-white/10 text-white hover:bg-white/10 px-4 py-2"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Full Resume
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewOpen(false)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {previewLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                </div>
              ) : previewResume ? (
                <div className="space-y-6 px-6 py-6 flex-1 overflow-y-auto">
                  {/* Resume Header */}
                  <div className="flex items-center justify-between p-6 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {previewResume.resume_title && !previewResume.resume_title.toLowerCase().includes('candidate')
                          ? previewResume.resume_title
                          : `${previewResume.user_name || 'User'}'s Resume`}
                      </h2>
                      <p className="text-gray-400 text-lg">Created by {previewResume.user_name}</p>
                    </div>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-lg px-4 py-2">
                      {previewResume.template_used}
                    </Badge>
                  </div>

                  {/* Resume Content */}
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1">
                    {previewResume?.resume_slug ? (
                      <iframe
                        src={`/${previewResume.resume_slug}`}
                        className="w-full"
                        style={{ height: '70vh', border: '0' }}
                        title="Resume Preview"
                      />
                    ) : (
                      <div 
                        className="resume-preview-content"
                        style={{
                          height: '100%',
                          overflowY: 'auto',
                          padding: '40px',
                          backgroundColor: 'white',
                          color: '#333',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          fontFamily: 'Arial, sans-serif'
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: previewResume?.resume_html || 'No preview available' 
                        }}
                      />
                    )}
                  </div>
                  
                </div>
              ) : (
                <div className="flex items-center justify-center flex-1">
                  <p className="text-gray-400">No resume data available</p>
                </div>
              )}
            </div>
          </div>
        )}
       </div>

       {/* Delete Confirmation Dialog */}
       <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
         if (!open) {
           setForceDeleteMode(false)
           setDeleteResumeId(null)
         }
         setShowDeleteDialog(open)
       }}>
         <AlertDialogContent className="bg-gray-900 border-gray-700 text-white z-[9999]">
           <AlertDialogHeader>
             <AlertDialogTitle className="text-white">Delete Resume</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {forceDeleteMode ? (
                <>
                  This resume has applications that reference it. 
                  <br /><br />
                  <strong>Force delete will remove:</strong>
                  <br />• The resume
                  <br />• All related applications
                  <br /><br />
                  <span className="text-yellow-400">This action cannot be undone!</span>
                </>
              ) : (
                <>
                  Are you sure you want to delete this resume?
                  <br /><br />
                  <strong>This will permanently delete:</strong>
                  <br />• The resume
                  <br />• All related applications
                  <br /><br />
                  <span className="text-yellow-400">This action cannot be undone!</span>
                </>
              )}
            </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel 
               className="border-gray-700 text-gray-300 hover:bg-gray-800"
               onClick={() => {
                 setForceDeleteMode(false)
                 setShowDeleteDialog(false)
                 setDeleteResumeId(null)
               }}
             >
               Cancel
             </AlertDialogCancel>
             {forceDeleteMode ? (
               <AlertDialogAction
                 onClick={() => {
                   deleteResumeId && handleDeleteResume(deleteResumeId, true)
                 }}
                 disabled={deleteResumeId ? deletingResumes.has(deleteResumeId) : false}
                 className="bg-red-700 hover:bg-red-800 text-white disabled:opacity-50"
               >
                 {deleteResumeId && deletingResumes.has(deleteResumeId) ? 'Force Deleting...' : 'Force Delete'}
               </AlertDialogAction>
             ) : (
             <AlertDialogAction
               onClick={() => {
                 deleteResumeId && handleDeleteResume(deleteResumeId)
               }}
                 disabled={deleteResumeId ? deletingResumes.has(deleteResumeId) : false}
                 className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
             >
                 {deleteResumeId && deletingResumes.has(deleteResumeId) ? 'Deleting...' : 'Delete'}
             </AlertDialogAction>
             )}
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>




     </AdminLayout>
   )
 } 