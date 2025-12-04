'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft,
  Target,
  Clock,
  DollarSign,
  BookmarkIcon,
  Building2,
  Search,
  Filter,
  X,
  FileText,
  CheckCircle,
  CheckCircle2,
  Star,
  Gift,
  Share2,
  Copy,
  Linkedin,
  ChevronDown,
  ChevronUp,
  Brain,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users
} from 'lucide-react';
import { PacmanLoader } from 'react-spinners';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSessionToken } from '@/lib/auth-helpers';

function JobMatchingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // Add CSS styles for search input
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Remove red outline from search input */
      .search-input-no-red:focus,
      .search-input-no-red:focus-visible,
      .search-input-no-red:invalid {
        border-color: rgba(255, 255, 255, 0.2) !important;
        box-shadow: none !important;
        outline: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any | null>(null);
  const [shareJobId, setShareJobId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWorkType, setFilterWorkType] = useState('all');
  const [filterShift, setFilterShift] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isShiftFilterOpen, setIsShiftFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPageSelectorOpen, setIsPageSelectorOpen] = useState(false);
  const [isSignInDialogOpen, setIsSignInDialogOpen] = useState(false);
  const [isGetStartedDialogOpen, setIsGetStartedDialogOpen] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [applicationType, setApplicationType] = useState<'success' | 'error' | 'info'>('success');
  const [appliedMap, setAppliedMap] = useState<Record<string, boolean>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [shareModalData, setShareModalData] = useState<{ platform: string; text: string; url: string }>({ platform: '', text: '', url: '' });
  // Use Header's auth modals by toggling URL search params
  const shareRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const shiftFilterRef = useRef<HTMLDivElement>(null);
  const pageSelectorRef = useRef<HTMLDivElement>(null);
  const itemsPerPage = 6;

  // Open job modal if arrived via shared URL /jobs/[id] -> /jobs/job-matching?jobId=XYZ
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const jobId = params.get('jobId')
      if (jobId) {
        setSelectedJob(jobId)
      }
    } catch {}
  }, [])

  // Close share dropdown, filter dropdown, and page selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setShareJobId(null);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (shiftFilterRef.current && !shiftFilterRef.current.contains(event.target as Node)) {
        setIsShiftFilterOpen(false);
      }
      if (pageSelectorRef.current && !pageSelectorRef.current.contains(event.target as Node)) {
        setIsPageSelectorOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShareJobId(null);
        setIsFilterOpen(false);
        setIsPageSelectorOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle application success modal
  useEffect(() => {
    const applicationStatus = searchParams.get('application');
    if (applicationStatus === 'success') {
      setShowSuccessModal(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('application');
      const newQuery = params.toString();
      router.replace(newQuery ? `/jobs/job-matching?${newQuery}` : '/jobs/job-matching', { scroll: false });
    }
  }, [searchParams, router]);

  const [jobs, setJobs] = useState<any[]>([])
  const [matchScores, setMatchScores] = useState<{[key: string]: any}>({})
  const [isLoadingMatches, setIsLoadingMatches] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [hasResume, setHasResume] = useState<boolean | null>(null)
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  
  // Use ref to track max progress to prevent going backwards
  const maxProgressRef = useRef(0)
  const isMatchingRef = useRef(false)


  // Fetch jobs and calculate match scores
  useEffect(() => {
    (async () => {
      try {
        // Check if user has a resume first - only if user is logged in
        if (user?.id) {
          try {
            const token = await getSessionToken()
            const resumeCheck = await fetch(`/api/user/saved-resumes`, { 
              headers: { Authorization: `Bearer ${token}` },
              cache: 'no-store' 
            })
            
            if (resumeCheck.ok) {
              const resumeData = await resumeCheck.json()
              console.log('Resume check result:', resumeData)
              
              if (!resumeData.hasSavedResume) {
                setHasResume(false)
                setShowResumeModal(true)
                return // Don't proceed with job fetching
              } else {
                setHasResume(true)
              }
            } else {
              console.error('Failed to check resume:', resumeCheck.status)
              // If we can't check, assume they have a resume to avoid blocking
              setHasResume(true)
            }
          } catch (error) {
            console.error('Error checking resume:', error)
            // If there's an error, assume they have a resume to avoid blocking
            setHasResume(true)
          }
        } else {
          // No user logged in, don't show resume modal
          setHasResume(null)
        }

        // Combined endpoint for active jobs (includes both processed_job_requests and recruiter_jobs)
        const res = await fetch('/api/jobs/combined', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load jobs')
        const data = await res.json()
        const active = data.jobs || []
        const mapped = active.map((row: any) => ({
          id: row.id,
          originalId: row.originalId,
          source: row.source,
          company: row.company,
          companyLogo: row.companyLogo || '🏢',
          postedDays: row.postedDays ?? 0,
          title: row.title,
          employmentType: row.employmentType || [],
          salary: row.salary || '',
          location: row.location || '',
          matchPercentage: 0, // Will be updated with real scores
          // NEW FIELDS - All requested database fields
          priority: row.priority,
          work_arrangement: row.work_arrangement,
          shift: row.shift,
          industry: row.industry,
          department: row.department,
          application_deadline: row.application_deadline,
          experience_level: row.experience_level,
          work_type: row.work_type,
          // details will be loaded on demand
          description: row.job_description || '',
          responsibilities: row.responsibilities || [],
          qualifications: row.requirements || [],
          perks: row.benefits || []
        }))
        setJobs(mapped)

        // Calculate match scores for each job if user is logged in and has resume
        if (user?.id && hasResume && !isMatchingRef.current) {
          isMatchingRef.current = true
          setIsLoadingMatches(true)
          maxProgressRef.current = 0
          setAnalysisProgress(0)
          
          // Helper function to update progress (only increases)
          const updateProgress = (newProgress: number) => {
            if (newProgress > maxProgressRef.current) {
              maxProgressRef.current = newProgress
              setAnalysisProgress(newProgress)
            }
          }
          
          try {
            const jobIds = mapped.map((job: any) => job.originalId)
            updateProgress(10) // Initial progress
            
            const response = await fetch('/api/jobs/batch-match', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: user.id,
                jobIds: jobIds
              })
            })

            updateProgress(40) // After request sent

            if (response.ok) {
              updateProgress(60) // Response received
              
              const data = await response.json()
              updateProgress(75) // Data parsed
              
              const scores: {[key: string]: any} = {}
              
              // Process results - map originalId back to combined job.id
              if (data.results) {
                const totalResults = Object.keys(data.results).length
                let processedCount = 0
                
                Object.entries(data.results).forEach(([originalId, result]: [string, any]) => {
                  // Find the corresponding job with this originalId
                  // Normalize IDs for comparison (recruiter jobs use UUIDs)
                  const normalizedOriginalId = String(originalId).toLowerCase().trim();
                  const job = mapped.find((j: any) => {
                    const jobOriginalId = String(j.originalId).toLowerCase().trim();
                    return jobOriginalId === normalizedOriginalId;
                  });
                  
                  if (job) {
                    scores[job.id] = {
                      score: result.score,
                      reasoning: result.reasoning,
                      breakdown: result.breakdown,
                      cached: result.cached,
                      error: result.error || result.failed || false
                    }
                    console.log(`✅ Mapped match result: originalId=${originalId}, job.id=${job.id}, job.originalId=${job.originalId}, score=${result.score}, error=${result.error || result.failed || false}`);
                  } else {
                    console.warn(`⚠️ Could not find job for originalId=${originalId} in mapped jobs`);
                    console.warn(`⚠️ Available originalIds:`, mapped.map((j: any) => ({ id: j.id, originalId: j.originalId })));
                  }
                  
                  processedCount++
                  // Update progress as we process each result
                  const processingProgress = 75 + Math.round((processedCount / totalResults) * 20)
                  updateProgress(processingProgress)
                })
              }
              
              setMatchScores(scores)
              updateProgress(100)
            } else {
              const errorText = await response.text()
              console.error('Batch match API error:', response.status, errorText)
              throw new Error(`Failed to analyze jobs: ${response.status} ${errorText}`)
            }
          } catch (error) {
            console.error('Error in batch job matching:', error)
            
            // Fallback to default scores - don't throw error, just use defaults
            const scores: {[key: string]: any} = {}
            mapped.forEach((job: any) => {
              scores[job.id] = { 
                score: 75, 
                reasoning: 'Using default score due to analysis error', 
                breakdown: {},
                cached: false
              }
            })
            setMatchScores(scores)
            // Update progress even in error case
            if (maxProgressRef.current < 100) {
              maxProgressRef.current = 100
              setAnalysisProgress(100)
            }
          }
          
          setTimeout(() => {
            setIsLoadingMatches(false)
            isMatchingRef.current = false
            // Don't reset progress to 0 - keep it at 100 briefly, then fade out
            setTimeout(() => {
              setAnalysisProgress(0)
              maxProgressRef.current = 0
            }, 300)
          }, 500)
        }
      } catch (e) {
        console.error('Error loading jobs:', e)
        setJobs([])
      }
    })()
  }, [user?.id, hasResume])

  // Refresh match scores when user changes (fallback for individual matching)
  useEffect(() => {
    if (user?.id && jobs.length > 0 && hasResume && !isMatchingRef.current) {
      // Check if we already have match scores for all jobs
      const hasAllScores = jobs.every(job => matchScores[job.id])
      
      if (hasAllScores) {
        // Already have scores, don't show loading modal
        return
      }
      
      (async () => {
        try {
          isMatchingRef.current = true
          setIsLoadingMatches(true)
          maxProgressRef.current = 0
          setAnalysisProgress(0)
          
          // Helper function to update progress (only increases)
          const updateProgress = (newProgress: number) => {
            if (newProgress > maxProgressRef.current) {
              maxProgressRef.current = newProgress
              setAnalysisProgress(newProgress)
            }
          }
          
          const scores: {[key: string]: any} = {}
          const totalJobs = jobs.length
          
          for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i]
            // Calculate progress: 5% base + 90% for jobs + 5% final
            const progress = 5 + Math.round(((i + 1) / totalJobs) * 90)
            updateProgress(progress)
            
            try {
              // Normalize originalId for the API call (ensure it's the database ID)
              const normalizedJobId = String(job.originalId).trim();
              console.log(`🔄 Fetching individual match for job: id=${job.id}, originalId=${normalizedJobId}, source=${job.source}`);
              
              const matchRes = await fetch(`/api/jobs/match?userId=${user.id}&jobId=${normalizedJobId}`)
              if (matchRes.ok) {
                const matchData = await matchRes.json()
                scores[job.id] = { 
                  score: Math.round(matchData.matchScore),
                  reasoning: matchData.reasoning,
                  breakdown: matchData.breakdown,
                  error: false
                }
                console.log(`✅ Individual match result for ${job.id}: score=${matchData.matchScore}, error=false`);
              } else {
                let errorData: any = {};
                let errorText = '';
                
                try {
                  // Try to get the response as text first
                  errorText = await matchRes.clone().text();
                  
                  // Try to parse as JSON
                  if (errorText && errorText.trim().startsWith('{')) {
                    try {
                      errorData = JSON.parse(errorText);
                    } catch (parseErr) {
                      errorData = { 
                        error: `Server error (${matchRes.status})`,
                        details: errorText || `Failed to parse JSON. Status: ${matchRes.status} ${matchRes.statusText}`
                      };
                    }
                  } else if (errorText && errorText.trim().length > 0) {
                    errorData = { error: errorText, details: errorText };
                  } else {
                    errorData = { 
                      error: `Server error (${matchRes.status})`,
                      details: `The server returned an error but no error message. Status: ${matchRes.status} ${matchRes.statusText}`
                    };
                  }
                } catch (parseError: any) {
                  console.error('Error parsing error response:', parseError);
                  errorData = { 
                    error: `HTTP ${matchRes.status}: ${matchRes.statusText}`,
                    details: errorText || `Failed to parse error response. Status: ${matchRes.status}. Parse error: ${parseError?.message || 'Unknown'}`
                  };
                }
                
                // Ensure errorData has meaningful content
                if (!errorData.error && !errorData.details) {
                  errorData = {
                    error: `HTTP ${matchRes.status}: ${matchRes.statusText}`,
                    details: `No error details available. Status: ${matchRes.status}`
                  };
                }
                
                scores[job.id] = { 
                  score: null,
                  reasoning: errorData.error || errorData.details || `Analysis failed (${matchRes.status})`,
                  breakdown: {},
                  error: true
                }
                console.error(`❌ Individual match failed for ${job.id}:`, {
                  status: matchRes.status,
                  statusText: matchRes.statusText,
                  errorData: errorData,
                  errorText: errorText || '(empty)',
                  hasErrorData: !!errorData.error || !!errorData.details,
                  jobId: normalizedJobId
                });
              }
            } catch (error: any) {
              console.error('Error fetching match score for job:', job.id, error)
              const errorMessage = error instanceof Error ? error.message : (error?.toString() || 'Network error');
              scores[job.id] = { 
                score: null, 
                reasoning: errorMessage, 
                breakdown: {},
                error: true
              }
              console.error(`❌ Network/fetch error for ${job.id}:`, {
                message: errorMessage,
                stack: error instanceof Error ? error.stack : undefined,
                jobId: job.originalId
              });
            }
            
            // Small delay to show progress
            await new Promise(resolve => setTimeout(resolve, 200))
          }
          
          updateProgress(100)
          setMatchScores(scores)
        } catch (error) {
          console.error('Error in individual job matching:', error)
          // Set default scores if everything fails
          const scores: {[key: string]: any} = {}
          jobs.forEach((job: any) => {
            scores[job.id] = { score: 75, reasoning: 'Using default score due to analysis error', breakdown: {} }
          })
          setMatchScores(scores)
        } finally {
          setTimeout(() => {
            setIsLoadingMatches(false)
            isMatchingRef.current = false
            // Don't reset progress to 0 - keep it at 100 briefly, then fade out
            setTimeout(() => {
              setAnalysisProgress(0)
              maxProgressRef.current = 0
            }, 300)
          }, 500)
        }
      })()
    }
  }, [user?.id, jobs, hasResume, matchScores])

  // Load full job details when a job is selected (public endpoint so logged-out users can view)
  useEffect(() => {
    (async () => {
      if (!selectedJob) { setSelectedJobDetails(null); return }
      try {
        const res = await fetch(`/api/jobs/combined/${selectedJob}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load job details')
        const data = await res.json()
        setSelectedJobDetails(data.job || null)
      } catch (e) {
        setSelectedJobDetails(null)
      }
    })()
  }, [selectedJob])

  

  // No placeholder fallback; show message when empty

  const handleJobClick = (jobId: string) => {
    setSelectedJob(jobId);
  };

  const handleShare = async (platform: string, job: any) => {
    const jobUrl = `${window.location.origin}/jobs/${job.id}`;
    
    switch (platform) {
      case 'facebook':
        const facebookShareText = `💼 Amazing Job Opportunity at ${job.company}!\n\n📋 Position: ${job.title}\n💰 Salary: ${job.salary}\n📍 Location: ${job.location}\n\n🚀 Ready to advance your BPO career?\n\nBPOC.IO connects you with:\n✅ Top BPO employers\n✅ AI-powered job matching\n✅ Career development tools\n✅ Skills assessments\n\nJoin thousands of professionals building their future!\n\n${jobUrl}\n\n#BPO #JobOpportunity #CareerGrowth #BPOIO`;
        
        try {
          await navigator.clipboard.writeText(facebookShareText);
          setShareModalData({ platform: 'Facebook', text: facebookShareText, url: jobUrl });
          setShowShareModal(true);
          setTimeout(() => {
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`;
            window.open(facebookUrl, '_blank', 'width=600,height=400');
          }, 1500);
        } catch (err) {
          const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(jobUrl)}`;
          window.open(facebookUrl, '_blank', 'width=600,height=400');
        }
        setShareJobId(null);
        break;
        
      case 'linkedin':
        const linkedinShareText = `💼 Exciting Job Opportunity: ${job.title} at ${job.company}\n\n📋 Position Details:\n• Title: ${job.title}\n• Salary: ${job.salary}\n• Location: ${job.location}\n• Work Arrangement: ${job.work_arrangement || 'Not specified'}\n\n💼 Looking for your next BPO career move?\n\nBPOC.IO offers:\n✅ AI-powered job matching\n✅ Direct connections to top employers\n✅ Career development resources\n✅ Professional skills assessments\n\n🚀 Ready to take the next step in your career?\n\n${jobUrl}\n\n#BPO #JobOpportunity #CareerDevelopment #ProfessionalGrowth #BPOIO`;
        
        try {
          await navigator.clipboard.writeText(linkedinShareText);
          setShareModalData({ platform: 'LinkedIn', text: linkedinShareText, url: jobUrl });
          setShowShareModal(true);
          setTimeout(() => {
            const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`;
            window.open(linkedinUrl, '_blank', 'width=600,height=400');
          }, 1500);
        } catch (err) {
          const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(jobUrl)}`;
          window.open(linkedinUrl, '_blank', 'width=600,height=400');
        }
        setShareJobId(null);
        break;
        
      case 'copy':
        try {
          await navigator.clipboard.writeText(jobUrl);
          // Optional: Show a toast or notification
        } catch (err) {
          console.error('Failed to copy link:', err);
        }
        setShareJobId(null);
        break;
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 95) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (percentage >= 85) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (percentage >= 75) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (percentage >= 65) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (percentage >= 55) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (percentage >= 45) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getMatchLabel = (percentage: number) => {
    if (percentage >= 95) return `${percentage}% Perfect Match`;
    if (percentage >= 85) return `${percentage}% Excellent Match`;
    if (percentage >= 75) return `${percentage}% Very Good Match`;
    if (percentage >= 65) return `${percentage}% Good Match`;
    if (percentage >= 55) return `${percentage}% Fair Match`;
    if (percentage >= 45) return `${percentage}% Poor Match`;
    return `${percentage}% Not Suitable`;
  };

  const getWorkType = (job: any) => {
    // Use actual work_arrangement from job data if available
    if (job.work_arrangement) {
      return job.work_arrangement;
    }
    
    // Fallback to mock work type based on company
    const workTypes: { [key: string]: string } = {
      'Amazon': 'remote',
      'Google': 'hybrid',
      'Microsoft': 'onsite',
      'Shopee': 'remote',
      'Accenture': 'onsite',
      'Concentrix': 'hybrid',
      'Netflix': 'remote',
      'Spotify': 'hybrid',
      'ShoreAgents': 'onsite'
    };
    return workTypes[job.company] || 'onsite';
  };

  const getWorkTypeLabel = (workType: string) => {
    const labels: { [key: string]: string } = {
      'all': 'All Work Types',
      'remote': 'Remote',
      'hybrid': 'Hybrid',
      'onsite': 'On-site'
    };
    return labels[workType] || workType;
  };

  const getShiftLabel = (shift: string) => {
    const labels: { [key: string]: string } = {
      'all': 'All Shifts',
      'day': 'Day Shift',
      'night': 'Night Shift'
    };
    return labels[shift] || shift;
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to page 1 when search changes
  };

  const handleFilterChange = (workType: string) => {
    setFilterWorkType(workType);
    setIsFilterOpen(false);
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  const handleShiftFilterChange = (shift: string) => {
    setFilterShift(shift);
    setIsShiftFilterOpen(false);
    setCurrentPage(1); // Reset to page 1 when filter changes
  };

  const triggerHeaderSignUp = () => {
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('signup', 'true')
      // Use client router to notify App Router hooks
      router.replace(url.pathname + url.search)
    } catch {}
  }

  const handleSignIn = () => {
    triggerHeaderSignUp()
  };

  const handleGetStarted = () => {
    triggerHeaderSignUp()
  };

  const list = jobs

  const filteredJobs = useMemo(() => {
    let filtered = list.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Work type filter
      const matchesWorkType = filterWorkType === 'all' || getWorkType(job) === filterWorkType;
      
      // Shift filter
      const matchesShift = filterShift === 'all' || job.shift === filterShift;
      
      return matchesSearch && matchesWorkType && matchesShift;
    });

    // Sort by match percentage if user is logged in and match scores are available
    if (user?.id && Object.keys(matchScores).length > 0) {
      filtered.sort((a, b) => {
        const scoreA = matchScores[a.id]?.score;
        const scoreB = matchScores[b.id]?.score;
        
        // Handle null scores - put them at the end
        if (scoreA === null && scoreB === null) return 0;
        if (scoreA === null) return 1;
        if (scoreB === null) return -1;
        
        return (scoreB || 0) - (scoreA || 0); // Sort by highest match first
      });
    }

    return filtered;
  }, [searchTerm, filterWorkType, filterShift, list, user?.id, matchScores]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredJobs.length / itemsPerPage);
  }, [filteredJobs.length, itemsPerPage]);

  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredJobs.slice(start, end);
  }, [currentPage, filteredJobs, itemsPerPage]);

  const selectedJobData = selectedJob ? list.find(job => job.id === selectedJob) : null;

  // Check applications using the same API as "My Applications" page
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user?.id || jobs.length === 0) return
      
      try {
        const response = await fetch(`/api/applications?userId=${user?.id}`, { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          const applications = data.applications || []
          
          // Create a set of applied job IDs
          const appliedJobIds = new Set(applications.map((app: any) => String(app.jobId)))
          
          // Check each job against applied jobs (compare originalId with stored jobId)
          const results: Record<string, boolean> = {}
          for (const job of jobs) {
            results[job.id] = appliedJobIds.has(String(job.originalId))
          }
          
          setAppliedMap(results)
        } else {
          console.error('Failed to fetch applications:', response.status)
          // Reset all to not applied
          const results: Record<string, boolean> = {}
          for (const job of jobs) results[job.id] = false
          setAppliedMap(results)
        }
      } catch (error) {
        console.error('Error fetching applications:', error)
        // Reset all to not applied
        const results: Record<string, boolean> = {}
        for (const job of jobs) results[job.id] = false
        setAppliedMap(results)
      }
    }

    fetchApplications()
  }, [user?.id, jobs.length])

  return (
    <div className="min-h-screen cyber-grid overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <Header />
      
      <div className="pt-16 relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="mr-4 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-400 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-white">Job Matching</h1>
                  <p className="text-gray-400">AI-powered job recommendations for you</p>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 w-64 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-white/20 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/20 invalid:border-white/20 search-input-no-red"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                
                {/* Work Type Filter */}
                <div className="relative" ref={filterRef}>
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm flex items-center gap-2 min-w-[140px] justify-between hover:bg-white/20 transition-colors"
                  >
                    <span>{getWorkTypeLabel(filterWorkType)}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {isFilterOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-gray-800 border border-white/20 rounded-lg shadow-lg z-50">
                      {['all', 'remote', 'hybrid', 'onsite'].map((workType) => (
                        <button
                          key={workType}
                          onClick={() => handleFilterChange(workType)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                            filterWorkType === workType ? 'bg-cyan-500/20 text-cyan-400' : 'text-white'
                          }`}
                        >
                          {getWorkTypeLabel(workType)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Shift Filter */}
                <div className="relative" ref={shiftFilterRef}>
                  <button
                    onClick={() => setIsShiftFilterOpen(!isShiftFilterOpen)}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm flex items-center gap-2 min-w-[120px] justify-between hover:bg-white/20 transition-colors"
                  >
                    <span>{getShiftLabel(filterShift)}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  
                  {isShiftFilterOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-gray-800 border border-white/20 rounded-lg shadow-lg z-50">
                      {['all', 'day', 'night'].map((shift) => (
                        <button
                          key={shift}
                          onClick={() => handleShiftFilterChange(shift)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                            filterShift === shift ? 'bg-purple-500/20 text-purple-400' : 'text-white'
                          }`}
                        >
                          {getShiftLabel(shift)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>
                  {totalPages > 1 
                    ? `Showing ${((currentPage - 1) * itemsPerPage) + 1}-${Math.min(currentPage * itemsPerPage, filteredJobs.length)} of ${filteredJobs.length} jobs`
                    : user?.id && hasResume
                      ? `Showing ${filteredJobs.length} jobs matched to your profile`
                      : user?.id && hasResume === false
                        ? 'Resume required for job matching'
                        : `Showing ${filteredJobs.length} active jobs`
                  }
                </span>
                <span>
                  {totalPages > 1 
                    ? `Page ${currentPage} of ${totalPages}` 
                    : user?.id && hasResume && Object.keys(matchScores).length > 0
                      ? 'Sorted by match percentage'
                      : user?.id && hasResume === false
                        ? 'Create resume to continue'
                        : 'Sign in to see personalized matches'
                  }
                </span>
              </div>
            </div>
          </motion.div>

          {/* Job Cards */}
          {!user?.id ? (
            <div className="py-16 text-center text-gray-400">
              <Target className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold mb-2">Sign in to see personalized job matches</h3>
              <p className="text-gray-500">Get AI-powered recommendations based on your skills and preferences</p>
            </div>
          ) : hasResume === false ? (
            <div className="py-16 text-center text-gray-400">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold mb-2">Resume Required</h3>
              <p className="text-gray-500 mb-4">Create your resume to get personalized job matches</p>
              <Button 
                onClick={() => router.push('/resume-builder')}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0"
              >
                <FileText className="w-4 h-4 mr-2" />
                Build Resume
              </Button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-16 text-center text-gray-400">No active jobs</div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="glass-card border-white/10 hover:border-purple-400/30 h-full transition-all duration-300 cursor-pointer"
                  onClick={() => handleJobClick(job.id)}
                >
                  <CardHeader className="pb-4">
                    {/* Company and Actions */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                          <span className="text-lg">{job.companyLogo}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-white">{job.company}</p>
                            <p className="text-xs text-gray-400">
                              {typeof job.postedDays === 'string' ? job.postedDays : `${job.postedDays} days ago`}
                            </p>
                          </div>
                          {/* Priority Badge next to company name */}
                          {job.priority && (
                            <Badge 
                              className={`px-2 py-0.5 text-xs font-semibold ml-2 ${
                                job.priority === 'urgent' ? 'bg-red-600/20 text-red-400 border-red-600/30' :
                                job.priority === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                job.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                'bg-green-500/20 text-green-300 border-green-500/30'
                              }`}
                            >
                              {job.priority === 'urgent' ? '🚨' : job.priority === 'high' ? '⚡' : job.priority === 'medium' ? '⚠️' : '✅'} {job.priority?.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                                             <div className="flex items-center gap-1">
                         <div className="relative" ref={shareJobId === job.id ? shareRef : null}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setShareJobId(shareJobId === job.id ? null : job.id);
                            }}
                            className="text-gray-400 hover:text-white"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          
                          {shareJobId === job.id && (
                            <div className="absolute top-full right-0 mt-1 bg-gray-800/95 backdrop-blur-md border border-white/20 rounded-lg shadow-xl z-50 min-w-[240px]">
                              <div className="py-2">
                                {/* Facebook Share */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare('facebook', job);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors text-white flex items-center gap-3"
                                >
                                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">f</div>
                                  <span className="font-medium">Share on Facebook</span>
                                </button>
                                
                                {/* LinkedIn Share */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare('linkedin', job);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors text-white flex items-center gap-3"
                                >
                                  <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-sm font-bold">in</div>
                                  <span className="font-medium">Share on LinkedIn</span>
                                </button>

                                <div className="border-t border-white/10 my-1"></div>
                                
                                {/* Copy Link */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare('copy', job);
                                  }}
                                  className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors text-white flex items-center gap-3"
                                >
                                  <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">📋</div>
                                  <span className="font-medium">Copy Link</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Job Title */}
                    <h2 className="text-xl font-bold text-white mb-2">
                      {job.title}
                    </h2>

                    {/* Employment Type + Work Info Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.employmentType
                        .filter((type: string) => type.toLowerCase() !== 'full-time')
                        .map((type: string, idx: number) => (
                        <Badge 
                          key={idx}
                          className="bg-white/10 text-gray-300 border-white/20 px-2 py-1 text-xs"
                        >
                          {type}
                        </Badge>
                      ))}
                      
                      {/* Work Arrangement Badge */}
                      {job.work_arrangement && (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 py-1 text-xs">
                          <Building2 className="w-3 h-3 mr-1" />
                          {job.work_arrangement === 'onsite' ? 'Onsite' : 
                           job.work_arrangement === 'remote' ? 'Remote' : 
                           job.work_arrangement === 'hybrid' ? 'Hybrid' : 
                           job.work_arrangement}
                        </Badge>
                      )}

                      {/* Shift Badge */}
                      {job.shift && (
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-2 py-1 text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {job.shift === 'day' ? 'Day' : 'Night'}
                        </Badge>
                      )}
                    </div>

                    {/* Match Percentage */}
                    <div className="mb-4">
                      {!user?.id ? (
                        <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 px-3 py-1 text-sm">
                          Sign in to see match
                        </Badge>
                      ) : isLoadingMatches ? (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1 text-sm animate-pulse">
                          AI Analyzing...
                        </Badge>
                      ) : matchScores[job.id] !== undefined ? (
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            {matchScores[job.id].error || matchScores[job.id].score === null ? (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 px-3 py-1 text-sm">
                                AI Failed
                              </Badge>
                            ) : (
                              <Badge className={`${getMatchColor(matchScores[job.id].score)} px-3 py-1 text-sm`}>
                                {getMatchLabel(matchScores[job.id].score)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 px-3 py-1 text-sm">
                          No match data
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Salary */}
                    <div className="flex items-center text-green-400 font-semibold">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span className="text-white text-sm">{job.salary}</span>
                    </div>

                    {/* Application Deadline - Bottom */}
                    {job.application_deadline && (
                      <div className="flex items-center text-xs text-gray-400 pt-1">
                        <Clock className="w-3 h-3 mr-1.5 text-red-400 flex-shrink-0" />
                        <span>Apply by {new Date(job.application_deadline).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                      </div>
                    )}

                    {/* Quick Apply Button */}
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        setSelectedJob(job.id);
                      }}
                      disabled={Boolean(
                        !!appliedMap[job.id] || 
                        (user?.id && matchScores[job.id]?.score !== undefined && matchScores[job.id].score !== null && matchScores[job.id].score < 65)
                      )}
                    >
                      {!!appliedMap[job.id] 
                        ? 'Already Applied' 
                        : (user?.id && matchScores[job.id]?.score !== undefined && matchScores[job.id].score !== null && matchScores[job.id].score < 65)
                          ? 'Not Recommended'
                          : 'View & Apply'
                      }
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between mt-8 py-4"
            >
              {/* Left side - Info */}
              <div className="text-gray-300 text-sm">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
              </div>

              {/* Right side - Pagination Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2"
                >
                  Previous
                </Button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(4, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page 
                        ? "bg-blue-600 text-white border-blue-600 px-4 py-2" 
                        : "bg-gray-800/50 border-gray-600 text-white hover:bg-gray-700/50 px-4 py-2"
                      }
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2"
                >
                  Next
                </Button>
              </div>
            </motion.div>
          )}



          {/* Job Details Modal */}
          <Dialog open={!!selectedJob && !!selectedJobData} onOpenChange={() => setSelectedJob(null)}>
            <DialogContent 
              className="bg-gray-900/95 backdrop-blur-md border-white/10 rounded-2xl !max-w-[1000px] w-full max-h-[85vh] p-0 overflow-hidden"
              showCloseButton={true}
            >
              <VisuallyHidden>
                <DialogTitle>Job Details - {selectedJobData?.title} at {selectedJobData?.company}</DialogTitle>
              </VisuallyHidden>
              {selectedJobData && (
                <>
                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="absolute top-4 right-4 z-10 w-8 h-8 bg-gray-800/80 hover:bg-gray-700/80 rounded-full flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 h-[85vh]">
                  {/* Selected Job Card - Left Side */}
                  <ScrollArea className="p-6 border-r border-white/10 job-modal-scroll">
                    <div>
                      {/* Company and Save */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                            <span className="text-lg">{selectedJobData.companyLogo}</span>
                          </div>
                          <div>
                            <p className="font-medium text-white text-lg">{selectedJobData.company}</p>
                            <p className="text-gray-400 text-sm">
                              {typeof selectedJobData.postedDays === 'string' ? selectedJobData.postedDays : `${selectedJobData.postedDays} days ago`}
                            </p>
                          </div>
                        </div>
                        
                        
                      </div>

                      {/* Job Title */}
                      <h2 className="text-2xl font-bold text-white mb-4">
                        {selectedJobData.title}
                      </h2>

                      {/* Job Details */}
                      <div className="space-y-3 mb-6">
                        {/* Industry */}
                        {selectedJobData.industry && (
                          <div className="flex items-center text-gray-300">
                            <Target className="w-5 h-5 mr-3 text-orange-400" />
                            <div>
                              <span className="text-xs text-gray-400">Industry:</span>
                              <span className="ml-2 font-medium text-base">{selectedJobData.industry}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Department */}
                        {selectedJobData.department && (
                          <div className="flex items-center text-gray-300">
                            <FileText className="w-5 h-5 mr-3 text-cyan-400" />
                            <div>
                              <span className="text-xs text-gray-400">Department:</span>
                              <span className="ml-2 font-medium text-base">{selectedJobData.department}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Applicants */}
                        <div className="flex items-center text-gray-300">
                          <span className="text-xs">Applicants:</span>
                          <span className="ml-2 font-medium text-sm">{(selectedJobDetails?.applicants ?? 0).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Match Percentage */}
                      <div className="mb-4">
                        {!user?.id ? (
                          <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 px-3 py-1 text-sm">
                            Sign in to see match
                          </Badge>
                        ) : isLoadingMatches ? (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1 text-sm animate-pulse">
                            AI Analyzing...
                          </Badge>
                        ) : matchScores[selectedJobData.id] !== undefined ? (
                          matchScores[selectedJobData.id].error || matchScores[selectedJobData.id].score === null ? (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 px-3 py-1 text-sm">
                              AI Failed
                            </Badge>
                          ) : (
                            <Badge className={`${getMatchColor(matchScores[selectedJobData.id].score)} px-3 py-1 text-sm`}>
                              {getMatchLabel(matchScores[selectedJobData.id].score)}
                            </Badge>
                          )
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30 px-3 py-1 text-sm">
                            No match data
                          </Badge>
                        )}
                      </div>

                      {/* AI Match Analysis */}
                      {user?.id && matchScores[selectedJobData.id] && !isLoadingMatches && (
                        <div className="mb-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-lg border border-white/10 overflow-hidden">
                          {/* Header - Clickable Dropdown */}
                          <button
                            onClick={() => setShowAIAnalysis(!showAIAnalysis)}
                            className="w-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 px-4 py-3 border-b border-white/10 hover:from-purple-500/30 hover:to-cyan-500/30 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-md flex items-center justify-center">
                                  <Target className="w-3 h-3 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-base font-bold text-white">
                                    {matchScores[selectedJobData.id].error ? 'AI Analysis Error' : 'AI Match Analysis'}
                                  </h3>
                                  <p className="text-xs text-gray-300">
                                    {matchScores[selectedJobData.id].error ? 'Unable to analyze match' : 'Detailed compatibility assessment'}
                                  </p>
                                </div>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showAIAnalysis ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {/* Collapsible Content */}
                          {showAIAnalysis && (
                            <div className="p-4 max-h-96 overflow-y-auto job-modal-scroll">
                            {matchScores[selectedJobData.id].error ? (
                              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <X className="w-3 h-3 text-red-400" />
                                  </div>
                                  <div>
                                    <h4 className="text-red-400 font-semibold mb-2">Analysis Failed</h4>
                                    <p className="text-red-300 text-sm mb-3">Failed to analyze job match. This could be due to:</p>
                                    <ul className="text-red-300 text-sm space-y-1 mb-3">
                                      <li>• Missing API configuration</li>
                                      <li>• Insufficient user or job data</li>
                                      <li>• API rate limiting</li>
                                      <li>• Network connectivity issues</li>
                                    </ul>
                                    <div className="bg-red-500/5 border border-red-500/20 rounded p-2">
                                      <p className="text-xs text-red-400 font-mono break-words">
                                        {matchScores[selectedJobData.id].reasoning || 'Unknown error occurred during analysis'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {/* Match Breakdown */}
                                {matchScores[selectedJobData.id].breakdown && Object.keys(matchScores[selectedJobData.id].breakdown).length > 0 && (
                                  <div>
                                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                                      <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full shadow-lg shadow-purple-400/20"></div>
                                      Match Breakdown
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {Object.entries(matchScores[selectedJobData.id].breakdown).map(([key, value]) => {
                                        const score = Math.round(Number(value));
                                        const getScoreColor = (score: number) => {
                                          if (score >= 90) return 'text-emerald-400';
                                          if (score >= 80) return 'text-green-400';
                                          if (score >= 70) return 'text-blue-400';
                                          if (score >= 60) return 'text-yellow-400';
                                          if (score >= 50) return 'text-orange-400';
                                          return 'text-red-400';
                                        };
                                        
                                        const getScoreBg = (score: number) => {
                                          if (score >= 90) return 'bg-emerald-500/20 border-emerald-500/30';
                                          if (score >= 80) return 'bg-green-500/20 border-green-500/30';
                                          if (score >= 70) return 'bg-blue-500/20 border-blue-500/30';
                                          if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
                                          if (score >= 50) return 'bg-orange-500/20 border-orange-500/30';
                                          return 'bg-red-500/20 border-red-500/30';
                                        };

                                        const getFactorIcon = (key: string) => {
                                          if (key.includes('skills')) return <Star className="w-4 h-4" />;
                                          if (key.includes('experience')) return <Clock className="w-4 h-4" />;
                                          if (key.includes('career')) return <Target className="w-4 h-4" />;
                                          if (key.includes('salary')) return <DollarSign className="w-4 h-4" />;
                                          if (key.includes('work') || key.includes('setup')) return <Building2 className="w-4 h-4" />;
                                          if (key.includes('location')) return <MapPin className="w-4 h-4" />;
                                          if (key.includes('industry')) return <FileText className="w-4 h-4" />;
                                          if (key.includes('shift')) return <Clock className="w-4 h-4" />;
                                          if (key.includes('cultural')) return <Users className="w-4 h-4" />;
                                          return <CheckCircle className="w-4 h-4" />;
                                        };

                                        return (
                                          <div key={key} className={`${getScoreBg(score)} border rounded-md p-3 transition-all hover:scale-105`}>
                                            <div className="flex items-center justify-between mb-1">
                                              <div className="flex items-center gap-2">
                                                <div className="text-gray-300">
                                                  {getFactorIcon(key)}
                                                </div>
                                                <span className="text-xs font-medium text-gray-200 capitalize">
                                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                              </div>
                                              <div className={`text-sm font-bold ${getScoreColor(score)}`}>
                                                {score}%
                                              </div>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                                              <div 
                                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                                  score >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                                                  score >= 80 ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                                  score >= 70 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                                                  score >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                                  score >= 50 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                                                  'bg-gradient-to-r from-red-400 to-red-500'
                                                }`}
                                                style={{ width: `${score}%` }}
                                              ></div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                
                                {/* AI Reasoning */}
                                {matchScores[selectedJobData.id].reasoning && (
                                  <div>
                                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                                      <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full shadow-lg shadow-cyan-400/20"></div>
                                      AI Insights
                                    </h4>
                                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-md p-3 border border-white/10">
                                      <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 bg-gradient-to-br from-cyan-500/30 to-purple-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-cyan-500/20">
                                          <Target className="w-3 h-3 text-cyan-300" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-gray-200 leading-relaxed whitespace-pre-line text-sm">
                                            {matchScores[selectedJobData.id].reasoning}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            </div>
                          )}
                        </div>
                      )}

                                              {/* Apply Button */}
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-0 focus:border-0 focus:ring-0 text-base py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={Boolean(
                            !!appliedMap[selectedJobData.id] || 
                            (user?.id && matchScores[selectedJobData.id]?.score !== undefined && matchScores[selectedJobData.id].score !== null && matchScores[selectedJobData.id].score < 65)
                          )}
                          onClick={async () => {
                          try {
                            if (!user) { triggerHeaderSignUp(); return }
                            const token = await getSessionToken()
                            if (!token) { triggerHeaderSignUp(); return }
                            if (!user?.id) {
                              setApplicationMessage('You must be logged in to apply');
                              setApplicationType('error');
                              setShowApplicationDialog(true);
                              return;
                            }
                            
                            const chk = await fetch('/api/user/saved-resumes', { 
                              headers: { 
                                Authorization: `Bearer ${token}`,
                                'x-user-id': user.id
                              }, 
                              cache: 'no-store' 
                            })
                            const j = await chk.json()
                            if (!chk.ok || !j?.hasSavedResume) { 
                              setApplicationMessage('You must have a resume first before applying');
                              setApplicationType('info');
                              setShowApplicationDialog(true);
                              router.push('/resume-builder')
                              return 
                            }
                            
                            // Get resume ID and slug from the response
                            const resumeId = j.resumeId || j.id
                            const resumeSlug = j.resumeSlug
                            
                            if (!resumeId || !resumeSlug) {
                              setApplicationMessage('Resume data is incomplete. Please update your resume.');
                              setApplicationType('error');
                              setShowApplicationDialog(true);
                              return;
                            }
                            
                            // Extract the actual database ID from originalId (remove prefixes if present)
                            let dbJobId = selectedJobData.originalId;
                            if (typeof dbJobId === 'string') {
                              if (dbJobId.startsWith('recruiter_')) {
                                dbJobId = dbJobId.replace('recruiter_', '');
                              } else if (dbJobId.startsWith('processed_')) {
                                dbJobId = dbJobId.replace('processed_', '');
                              } else if (dbJobId.startsWith('job_request_')) {
                                dbJobId = dbJobId.replace('job_request_', '');
                              }
                            }
                            
                            console.log('Submitting application:', {
                              jobId: dbJobId,
                              resumeId,
                              resumeSlug,
                              userId: user.id
                            })
                            
                            let resp: Response | null = null
                            try {
                              resp = await fetch('/api/user/applications', {
                                method: 'POST',
                                headers: { 
                                  'Content-Type': 'application/json', 
                                  Authorization: `Bearer ${token}`,
                                  'x-user-id': user.id
                                },
                                body: JSON.stringify({ jobId: dbJobId, resumeId, resumeSlug })
                              })
                            } catch (fetchError: any) {
                              // Handle network errors
                              console.error('Network error during application submission:', fetchError)
                              setApplicationMessage('Network error. Please check your connection and try again.')
                              setApplicationType('error')
                              setShowApplicationDialog(true)
                              return
                            }
                            
                            if (!resp) {
                              return
                            }
                            
                            if (!resp.ok) {
                              let errorData: any = {}
                              let errorText = ''
                              
                              try {
                                // Try to get the response as text first
                                errorText = await resp.clone().text()
                                console.log('Raw error response text:', errorText)
                                
                                // Try to parse as JSON
                                if (errorText && errorText.trim().startsWith('{')) {
                                  try {
                                    errorData = JSON.parse(errorText)
                                  } catch (parseErr) {
                                    errorData = { error: errorText, details: errorText }
                                  }
                                } else if (errorText && errorText.trim()) {
                                  // If it's not JSON, use the text as the error message
                                  errorData = { error: errorText, details: errorText }
                                }
                              } catch (parseError) {
                                console.error('Error parsing error response:', parseError)
                              }
                              
                              // Always include status information
                              const errorMessage = errorData?.error || 
                                                  errorData?.details || 
                                                  errorData?.message || 
                                                  errorData?.hint ||
                                                  errorText ||
                                                  `Failed to submit application (${resp.status} ${resp.statusText})`
                              
                              // Log comprehensive error details - use JSON.stringify to ensure all properties are visible
                              const errorLogDetails = {
                                status: resp.status,
                                statusText: resp.statusText,
                                jobId: String(dbJobId),
                                resumeId: String(resumeId),
                                resumeSlug: String(resumeSlug),
                                userId: String(user.id),
                                errorText: errorText || '(empty response body)',
                                errorData: Object.keys(errorData).length > 0 ? errorData : '(no error data)',
                                errorMessage: String(errorMessage)
                              }
                              console.error('Application submission failed:', JSON.stringify(errorLogDetails, null, 2))
                              
                              setApplicationMessage(errorMessage)
                              setApplicationType('error')
                              setShowApplicationDialog(true)
                              return
                            }
                            
                            // Success - parse response
                            const result = await resp.json().catch(() => ({}))
                            
                            // Update local state to reflect application before redirect
                            setAppliedMap(prev => ({ ...prev, [selectedJobData.id]: true }));
                            setSelectedJob(null);
                            setSelectedJobDetails(null);
                            router.push('/jobs/job-matching?application=success');
                            return;
                          } catch (err: any) {
                            console.error('Unexpected error during application submission:', err)
                            const errorMsg = err?.message || err?.toString() || 'Unknown error occurred'
                            console.error('Error details:', {
                              message: errorMsg,
                              stack: err?.stack,
                              name: err?.name
                            })
                            setApplicationMessage(`Could not apply: ${errorMsg}`);
                            setApplicationType('error');
                            setShowApplicationDialog(true);
                          }
                        }}
                                                >
                                                         {!!appliedMap[selectedJobData.id] 
                               ? 'Already Applied' 
                               : (user?.id && matchScores[selectedJobData.id]?.score !== undefined && matchScores[selectedJobData.id].score !== null && matchScores[selectedJobData.id].score < 65)
                                 ? 'Not Recommended'
                                 : 'Apply now'
                             }
                          </Button>
                    </div>
                  </ScrollArea>

                  {/* Job Details - Right Side */}
                  <div className="p-4 job-modal-scroll overflow-y-auto h-full">
                    <div className="space-y-4 pb-4">
                      {/* Job Description */}
                      {(() => {
                        const description = selectedJobDetails?.description || selectedJobData?.description || '';
                        if (!description || description.trim() === '') {
                          return (
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <h3 className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                                <FileText className="h-5 w-5 text-cyan-400" />
                                Job Description
                              </h3>
                              <p className="text-gray-400 text-sm italic">No job description listed</p>
                            </div>
                          );
                        }
                        return (
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <h3 className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                              <FileText className="h-5 w-5 text-cyan-400" />
                              Job Description
                            </h3>
                            <p className="text-gray-300 leading-relaxed text-sm">{description}</p>
                          </div>
                        );
                      })()}

                      {/* Responsibilities */}
                      {(() => {
                        // Parse responsibilities from either selectedJobDetails or selectedJobData
                        let responsibilities: string[] = [];
                        
                        if (selectedJobDetails?.responsibilities) {
                          if (Array.isArray(selectedJobDetails.responsibilities)) {
                            responsibilities = selectedJobDetails.responsibilities.filter((r: any) => r && String(r).trim());
                          } else if (typeof selectedJobDetails.responsibilities === 'string') {
                            try {
                              const parsed = JSON.parse(selectedJobDetails.responsibilities);
                              responsibilities = Array.isArray(parsed) ? parsed.filter((r: any) => r && String(r).trim()) : [selectedJobDetails.responsibilities].filter((r: any) => r && String(r).trim());
                            } catch {
                              responsibilities = selectedJobDetails.responsibilities.split('\n\n').filter((s: string) => s.trim());
                            }
                          }
                        } else if (selectedJobData?.responsibilities) {
                          if (Array.isArray(selectedJobData.responsibilities)) {
                            responsibilities = selectedJobData.responsibilities.filter((r: any) => r && String(r).trim());
                          } else if (typeof selectedJobData.responsibilities === 'string') {
                            try {
                              const parsed = JSON.parse(selectedJobData.responsibilities);
                              responsibilities = Array.isArray(parsed) ? parsed.filter((r: any) => r && String(r).trim()) : [selectedJobData.responsibilities].filter((r: any) => r && String(r).trim());
                            } catch {
                              responsibilities = selectedJobData.responsibilities.split('\n\n').filter((s: string) => s.trim());
                            }
                          }
                        }
                        
                        if (responsibilities.length === 0) {
                          return (
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <h3 className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                Responsibilities
                              </h3>
                              <p className="text-gray-400 text-sm italic">No responsibilities listed</p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <h3 className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                              <CheckCircle className="h-5 w-5 text-green-400" />
                              Responsibilities
                            </h3>
                            <ul className="space-y-2">
                              {responsibilities.map((responsibility: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-3 text-gray-300">
                                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm">{responsibility}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}

                      {/* Qualifications */}
                      {(() => {
                        // Parse requirements/qualifications from either selectedJobDetails or selectedJobData
                        let qualifications: string[] = [];
                        
                        if (selectedJobDetails?.requirements) {
                          if (Array.isArray(selectedJobDetails.requirements)) {
                            qualifications = selectedJobDetails.requirements.filter((q: any) => q && String(q).trim());
                          } else if (typeof selectedJobDetails.requirements === 'string') {
                            try {
                              const parsed = JSON.parse(selectedJobDetails.requirements);
                              qualifications = Array.isArray(parsed) ? parsed.filter((q: any) => q && String(q).trim()) : [selectedJobDetails.requirements].filter((q: any) => q && String(q).trim());
                            } catch {
                              qualifications = selectedJobDetails.requirements.split('\n\n').filter((s: string) => s.trim());
                            }
                          }
                        } else if (selectedJobData?.qualifications) {
                          if (Array.isArray(selectedJobData.qualifications)) {
                            qualifications = selectedJobData.qualifications.filter((q: any) => q && String(q).trim());
                          } else if (typeof selectedJobData.qualifications === 'string') {
                            try {
                              const parsed = JSON.parse(selectedJobData.qualifications);
                              qualifications = Array.isArray(parsed) ? parsed.filter((q: any) => q && String(q).trim()) : [selectedJobData.qualifications].filter((q: any) => q && String(q).trim());
                            } catch {
                              qualifications = selectedJobData.qualifications.split('\n\n').filter((s: string) => s.trim());
                            }
                          }
                        }
                        
                        if (qualifications.length === 0) {
                          return (
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <h3 className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                                <Star className="h-5 w-5 text-yellow-400" />
                                Qualifications & Requirements
                              </h3>
                              <p className="text-gray-400 text-sm italic">No qualifications & requirements listed</p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <h3 className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                              <Star className="h-5 w-5 text-yellow-400" />
                              Qualifications & Requirements
                            </h3>
                            <ul className="space-y-2">
                              {qualifications.map((qualification: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-3 text-gray-300">
                                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm">{qualification}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}

                      {/* Perks & Benefits */}
                      {(() => {
                        // Parse benefits from either selectedJobDetails or selectedJobData
                        let benefits: string[] = [];
                        
                        if (selectedJobDetails?.benefits) {
                          if (Array.isArray(selectedJobDetails.benefits)) {
                            benefits = selectedJobDetails.benefits.filter((b: any) => b && String(b).trim());
                          } else if (typeof selectedJobDetails.benefits === 'string') {
                            try {
                              const parsed = JSON.parse(selectedJobDetails.benefits);
                              benefits = Array.isArray(parsed) ? parsed.filter((b: any) => b && String(b).trim()) : [selectedJobDetails.benefits].filter((b: any) => b && String(b).trim());
                            } catch {
                              benefits = selectedJobDetails.benefits.split('\n\n').filter((s: string) => s.trim());
                            }
                          }
                        } else if (selectedJobData?.perks) {
                          if (Array.isArray(selectedJobData.perks)) {
                            benefits = selectedJobData.perks.filter((b: any) => b && String(b).trim());
                          } else if (typeof selectedJobData.perks === 'string') {
                            try {
                              const parsed = JSON.parse(selectedJobData.perks);
                              benefits = Array.isArray(parsed) ? parsed.filter((b: any) => b && String(b).trim()) : [selectedJobData.perks].filter((b: any) => b && String(b).trim());
                            } catch {
                              benefits = selectedJobData.perks.split('\n\n').filter((s: string) => s.trim());
                            }
                          }
                        }
                        
                        if (benefits.length === 0) {
                          return (
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <h3 className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                                <Gift className="h-5 w-5 text-pink-400" />
                                Perks & Benefits
                              </h3>
                              <p className="text-gray-400 text-sm italic">No perks & benefits listed</p>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <h3 className="flex items-center gap-2 text-white text-lg font-semibold mb-3">
                              <Gift className="h-5 w-5 text-pink-400" />
                              Perks & Benefits
                            </h3>
                            <ul className="space-y-2">
                              {benefits.map((perk: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-3 text-gray-300">
                                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm">{perk}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Auth handled by Header via URL search param (?signup=true) */}
        </div>
      </div>

      {/* Application Status Alert Dialog */}
      <AlertDialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {applicationType === 'success' ? 'Application Submitted!' : 
               applicationType === 'error' ? 'Application Error' : 'Information'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {applicationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowApplicationDialog(false)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resume Required Modal */}
      <Dialog open={showResumeModal} onOpenChange={setShowResumeModal}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold flex items-center gap-3">
              <FileText className="h-6 w-6 text-cyan-400" />
              Resume Required
            </DialogTitle>
            <DialogDescription className="text-gray-300 mt-3">
              To get personalized job matches and apply to positions, you need to create your resume first.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="font-semibold text-white mb-2">Why you need a resume:</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Get AI-powered job matching</li>
                <li>• Apply to positions with one click</li>
                <li>• Showcase your skills and experience</li>
                <li>• Stand out to employers</li>
              </ul>
            </div>
            
                         <div className="flex gap-3">
               <Button 
                 onClick={() => router.push('/resume-builder')}
                 className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white border-0"
               >
                 <FileText className="w-4 h-4 mr-2" />
                 Build Resume
               </Button>
               <Button 
                 variant="outline"
                 onClick={() => router.push('/')}
                 className="border-white/20 text-white hover:bg-white/10"
               >
                 Go Home
               </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* AI Analysis Loading Modal */}
      {isLoadingMatches && hasResume && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 border border-white/20 rounded-2xl p-8 max-w-lg w-full mx-4">
            <div className="flex flex-col space-y-6">
              {/* Header */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Analyzing Job Matches...</h3>
                <p className="text-gray-400 text-sm">This usually takes about 1-2 minutes. We'll keep you updated with each step.</p>
              </div>
              
              {/* Pacman Loader */}
              <div className="flex justify-center py-4">
                <PacmanLoader 
                  color="#fbbf24" 
                  size={40}
                  margin={4}
                  speedMultiplier={1.2}
                />
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Progress</span>
                  <span className="text-sm font-medium text-white">{analysisProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${analysisProgress}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Analysis Steps */}
              <div className="space-y-2">
                <span className="text-sm text-gray-400">Analysis Steps</span>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${analysisProgress > 0 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <span>Profile analysis initialized</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${analysisProgress > 25 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <span>Job compatibility scanning</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${analysisProgress > 50 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <span>Skills matching analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${analysisProgress > 75 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <span>Experience evaluation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${analysisProgress === 100 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <span>Finalizing results</span>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* Application Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              Application Sent Successfully!
            </DialogTitle>
            <DialogDescription className="text-white mt-2">
              Your application has been submitted and is now being reviewed by the employer. You'll be notified about any updates.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <Button
              onClick={() => {
                setShowSuccessModal(false);
                router.push('/applications');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              View My Applications
            </Button>
            <Button
              onClick={() => setShowSuccessModal(false)}
              variant="outline"
              className="w-full"
            >
              Continue Browsing Jobs
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-2xl"
          >
            {/* Glow Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-2xl animate-pulse"></div>
            
            {/* Modal Content */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border-2 border-cyan-400/30 shadow-2xl overflow-hidden">
              {/* Header with Gradient */}
              <div className="bg-gradient-to-r from-cyan-500 to-purple-600 p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <span className="text-3xl">✓</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Text Copied Successfully!</h3>
                      <p className="text-cyan-100 text-sm">Ready to share on {shareModalData.platform}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6">
                {/* Instructions */}
                <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-xl p-5 border border-cyan-400/20">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-xl">💡</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">What to do next:</h4>
                      <ol className="space-y-2 text-gray-300">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold mt-0.5">1.</span>
                          <span>The {shareModalData.platform} share dialog will open in 1.5 seconds</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold mt-0.5">2.</span>
                          <span>Paste the text below (Ctrl+V or Cmd+V) into the post box</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold mt-0.5">3.</span>
                          <span>Your job image will appear automatically - just hit Share!</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Text Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Post Text Preview</label>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(shareModalData.text);
                          const btn = document.getElementById('copy-again-btn-job');
                          if (btn) {
                            btn.textContent = '✓ Copied!';
                            setTimeout(() => {
                              btn.textContent = 'Copy Again';
                            }, 2000);
                          }
                        } catch (err) {
                          console.error('Failed to copy:', err);
                        }
                      }}
                      id="copy-again-btn-job"
                      className="text-xs px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg border border-cyan-400/30 transition-all duration-200 hover:scale-105 font-medium"
                    >
                      Copy Again
                    </button>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10 max-h-48 overflow-y-auto">
                    <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {shareModalData.text}
                    </p>
                  </div>
                </div>

                {/* BPOC Branding Footer */}
                <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">B</span>
                  </div>
                  <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    BPOC.IO
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400 text-sm">Where BPO Careers Begin</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowShareModal(false)}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    Got It! 👍
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function JobMatchingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen cyber-grid overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading job matching...</p>
        </div>
      </div>
    }>
      <JobMatchingContent />
    </Suspense>
  );
} 