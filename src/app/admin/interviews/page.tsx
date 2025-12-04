'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AdminRouteGuard from '@/components/admin/AdminRouteGuard'
import AdminLayout from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  MessageSquare,
  Clock,
  Users,
  Calendar,
  Video,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  RefreshCw,
  Send,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { InterviewRequestWithDetails, InterviewStatus } from '@/types/interview'
import { cn } from '@/lib/utils'

type FilterStatus = 'ALL' | InterviewStatus

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewRequestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInterview, setSelectedInterview] = useState<InterviewRequestWithDetails | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    action: 'schedule' | 'complete' | 'sendOffer' | 'confirmHire' | 'decline' | 'notes' | null
  }>({ open: false, action: null })
  
  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    scheduledTime: '',
    meetingLink: '',
    adminNotes: '',
  })
  const [offerForm, setOfferForm] = useState({
    position: '',
    salary: '',
    shiftType: 'DAY_SHIFT' as const,
    workLocation: 'WORK_FROM_HOME' as const,
    hmoIncluded: true,
    leaveCredits: 15,
    workHours: '9 hours including 1 hour break',
  })
  const [hireForm, setHireForm] = useState({
    confirmedStartDate: '',
    staffEmail: '',
    adminNotes: '',
  })
  const [notesForm, setNotesForm] = useState('')
  const [declineReason, setDeclineReason] = useState('')

  // Fetch interviews
  const fetchInterviews = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/recruitment/interviews')
      const data = await response.json()
      if (data.success) {
        setInterviews(data.interviews)
      }
    } catch (error) {
      console.error('Error fetching interviews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInterviews()
  }, [])

  // Filter interviews
  const filteredInterviews = interviews.filter((interview) => {
    const matchesStatus = filterStatus === 'ALL' || interview.status === filterStatus
    const matchesSearch =
      searchTerm === '' ||
      interview.candidate_full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.candidate_position?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Status badge color
  const getStatusColor = (status: InterviewStatus) => {
    const colors = {
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      SCHEDULED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      RESCHEDULE_REQUESTED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      HIRE_REQUESTED: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      OFFER_SENT: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      OFFER_ACCEPTED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      OFFER_DECLINED: 'bg-red-500/20 text-red-400 border-red-500/30',
      HIRED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
      CANCELLED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      REJECTED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    }
    return colors[status] || colors.PENDING
  }

  // Handle actions
  const handleSchedule = async () => {
    if (!selectedInterview) return
    try {
      const response = await fetch(
        `/api/admin/recruitment/interviews/${selectedInterview.id}/schedule`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleForm),
        }
      )
      if (response.ok) {
        await fetchInterviews()
        setActionDialog({ open: false, action: null })
        setScheduleForm({ scheduledTime: '', meetingLink: '', adminNotes: '' })
      }
    } catch (error) {
      console.error('Error scheduling interview:', error)
    }
  }

  const handleComplete = async () => {
    if (!selectedInterview) return
    try {
      const response = await fetch(
        `/api/admin/recruitment/interviews/${selectedInterview.id}/complete`,
        { method: 'PATCH' }
      )
      if (response.ok) {
        await fetchInterviews()
        setActionDialog({ open: false, action: null })
      }
    } catch (error) {
      console.error('Error completing interview:', error)
    }
  }

  const handleSendOffer = async () => {
    if (!selectedInterview) return
    try {
      const response = await fetch('/api/admin/recruitment/interviews/hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewRequestId: selectedInterview.id,
          bpocCandidateId: selectedInterview.bpocCandidateId,
          candidateEmail: selectedInterview.candidate_email,
          candidatePhone: selectedInterview.candidate_phone,
          companyId: 'company-id', // TODO: Get from interview details
          clientPreferredStart: selectedInterview.clientPreferredStart,
          clientTimezone: selectedInterview.clientTimezone,
          workSchedule: selectedInterview.workSchedule,
          ...offerForm,
        }),
      })
      if (response.ok) {
        await fetchInterviews()
        setActionDialog({ open: false, action: null })
      }
    } catch (error) {
      console.error('Error sending offer:', error)
    }
  }

  const handleConfirmHire = async () => {
    if (!selectedInterview) return
    try {
      const response = await fetch(
        '/api/admin/recruitment/interviews/confirm-acceptance',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewRequestId: selectedInterview.id,
            bpocCandidateId: selectedInterview.bpocCandidateId,
            ...hireForm,
          }),
        }
      )
      if (response.ok) {
        await fetchInterviews()
        setActionDialog({ open: false, action: null })
      }
    } catch (error) {
      console.error('Error confirming hire:', error)
    }
  }

  const handleDecline = async () => {
    if (!selectedInterview) return
    try {
      const response = await fetch(
        '/api/admin/recruitment/interviews/mark-declined',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            interviewRequestId: selectedInterview.id,
            declineReason,
          }),
        }
      )
      if (response.ok) {
        await fetchInterviews()
        setActionDialog({ open: false, action: null })
        setDeclineReason('')
      }
    } catch (error) {
      console.error('Error declining offer:', error)
    }
  }

  const handleAddNotes = async () => {
    if (!selectedInterview) return
    try {
      const response = await fetch(
        `/api/admin/recruitment/interviews/${selectedInterview.id}/notes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: notesForm }),
        }
      )
      if (response.ok) {
        await fetchInterviews()
        setActionDialog({ open: false, action: null })
        setNotesForm('')
      }
    } catch (error) {
      console.error('Error adding notes:', error)
    }
  }

  // Stats
  const stats = {
    total: interviews.length,
    pending: interviews.filter((i) => i.status === 'PENDING').length,
    scheduled: interviews.filter((i) => i.status === 'SCHEDULED').length,
    hireRequested: interviews.filter((i) => i.status === 'HIRE_REQUESTED').length,
    offersPending: interviews.filter((i) => i.status === 'OFFER_SENT').length,
    hired: interviews.filter((i) => i.status === 'HIRED').length,
  }

  return (
    <AdminRouteGuard>
      <AdminLayout title="Interviews" description="Manage interview requests and hiring process">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-white">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Scheduled</p>
                    <p className="text-2xl font-bold text-white">{stats.scheduled}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Hire Requests</p>
                    <p className="text-2xl font-bold text-white">{stats.hireRequested}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Hired</p>
                    <p className="text-2xl font-bold text-white">{stats.hired}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by candidate or client name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value as FilterStatus)}
                >
                  <SelectTrigger className="w-full md:w-[200px] bg-white/5 border-white/10 text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/10 text-white">
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="HIRE_REQUESTED">Hire Requested</SelectItem>
                    <SelectItem value="OFFER_SENT">Offer Sent</SelectItem>
                    <SelectItem value="OFFER_ACCEPTED">Offer Accepted</SelectItem>
                    <SelectItem value="HIRED">Hired</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={fetchInterviews}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Interviews List */}
          <div className="space-y-4">
            {loading ? (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
                  <p className="text-gray-400 mt-4">Loading interviews...</p>
                </CardContent>
              </Card>
            ) : filteredInterviews.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No interviews found</p>
                </CardContent>
              </Card>
            ) : (
              filteredInterviews.map((interview) => (
                <motion.div
                  key={interview.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="glass-card hover:bg-white/5 transition-all">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-start space-x-4 flex-1">
                          <Avatar className="w-16 h-16">
                            <AvatarImage src={interview.candidate_avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-600 text-white">
                              {interview.candidate_full_name?.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold text-white">
                                {interview.candidate_full_name}
                              </h3>
                              <Badge className={cn('border', getStatusColor(interview.status))}>
                                {interview.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                {interview.candidate_position || 'Position not specified'}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {interview.candidate_location || 'Location not specified'}
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {interview.candidate_email || 'Email not available'}
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Client: {interview.client_name}
                              </div>
                            </div>
                            {interview.scheduledTime && (
                              <div className="flex items-center gap-2 mt-2 text-sm text-cyan-400">
                                <Calendar className="w-4 h-4" />
                                Scheduled: {new Date(interview.scheduledTime).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {interview.status === 'PENDING' && (
                            <Button
                              onClick={() => {
                                setSelectedInterview(interview)
                                setActionDialog({ open: true, action: 'schedule' })
                              }}
                              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              Schedule
                            </Button>
                          )}
                          {interview.status === 'SCHEDULED' && (
                            <Button
                              onClick={() => {
                                setSelectedInterview(interview)
                                setActionDialog({ open: true, action: 'complete' })
                              }}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark Complete
                            </Button>
                          )}
                          {interview.status === 'HIRE_REQUESTED' && (
                            <Button
                              onClick={() => {
                                setSelectedInterview(interview)
                                setActionDialog({ open: true, action: 'sendOffer' })
                              }}
                              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Send Offer
                            </Button>
                          )}
                          {interview.status === 'OFFER_SENT' && (
                            <>
                              <Button
                                onClick={() => {
                                  setSelectedInterview(interview)
                                  setActionDialog({ open: true, action: 'confirmHire' })
                                }}
                                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Confirm Hire
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedInterview(interview)
                                  setActionDialog({ open: true, action: 'decline' })
                                }}
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Mark Declined
                              </Button>
                            </>
                          )}
                          <Button
                            onClick={() => {
                              setSelectedInterview(interview)
                              setActionDialog({ open: true, action: 'notes' })
                            }}
                            variant="outline"
                            className="border-white/10 text-white hover:bg-white/10"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Add Notes
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Action Dialogs */}
        <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ open, action: null })}>
          <DialogContent className="bg-[#0b0b0d] text-white border border-white/10 max-w-2xl">
            {actionDialog.action === 'schedule' && (
              <>
                <DialogHeader>
                  <DialogTitle>Schedule Interview</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Set the interview time and provide meeting link
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Interview Date & Time</label>
                    <Input
                      type="datetime-local"
                      value={scheduleForm.scheduledTime}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, scheduledTime: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Meeting Link</label>
                    <Input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={scheduleForm.meetingLink}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Admin Notes (Optional)</label>
                    <Textarea
                      placeholder="Add any scheduling notes..."
                      value={scheduleForm.adminNotes}
                      onChange={(e) =>
                        setScheduleForm({ ...scheduleForm, adminNotes: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSchedule}
                    className="bg-gradient-to-r from-blue-500 to-cyan-600"
                  >
                    Schedule Interview
                  </Button>
                </DialogFooter>
              </>
            )}

            {actionDialog.action === 'complete' && (
              <>
                <DialogHeader>
                  <DialogTitle>Mark Interview as Completed</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Confirm that the interview has been completed
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-gray-300">
                    This will change the status to "COMPLETED" and allow the client to request hiring this
                    candidate.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleComplete}
                    className="bg-gradient-to-r from-green-500 to-emerald-600"
                  >
                    Mark as Completed
                  </Button>
                </DialogFooter>
              </>
            )}

            {actionDialog.action === 'sendOffer' && (
              <>
                <DialogHeader>
                  <DialogTitle>Send Job Offer</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Fill in the employment details to send offer to candidate
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Position Title</label>
                    <Input
                      placeholder="e.g., Customer Support Specialist"
                      value={offerForm.position}
                      onChange={(e) => setOfferForm({ ...offerForm, position: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Monthly Salary (PHP)</label>
                      <Input
                        type="number"
                        placeholder="30000"
                        value={offerForm.salary}
                        onChange={(e) => setOfferForm({ ...offerForm, salary: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Leave Credits</label>
                      <Input
                        type="number"
                        value={offerForm.leaveCredits}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, leaveCredits: parseInt(e.target.value) })
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Shift Type</label>
                      <Select
                        value={offerForm.shiftType}
                        onValueChange={(value: any) =>
                          setOfferForm({ ...offerForm, shiftType: value })
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10 text-white">
                          <SelectItem value="DAY_SHIFT">Day Shift</SelectItem>
                          <SelectItem value="NIGHT_SHIFT">Night Shift</SelectItem>
                          <SelectItem value="FLEXIBLE">Flexible</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Work Location</label>
                      <Select
                        value={offerForm.workLocation}
                        onValueChange={(value: any) =>
                          setOfferForm({ ...offerForm, workLocation: value })
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10 text-white">
                          <SelectItem value="WORK_FROM_HOME">Work From Home</SelectItem>
                          <SelectItem value="OFFICE">Office</SelectItem>
                          <SelectItem value="HYBRID">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm text-gray-400">
                      <input
                        type="checkbox"
                        checked={offerForm.hmoIncluded}
                        onChange={(e) =>
                          setOfferForm({ ...offerForm, hmoIncluded: e.target.checked })
                        }
                        className="rounded"
                      />
                      HMO Included from Day 1
                    </label>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Work Hours</label>
                    <Input
                      placeholder="e.g., 9 hours including 1 hour break"
                      value={offerForm.workHours}
                      onChange={(e) => setOfferForm({ ...offerForm, workHours: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleSendOffer}
                    className="bg-gradient-to-r from-orange-500 to-red-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Job Offer
                  </Button>
                </DialogFooter>
              </>
            )}

            {actionDialog.action === 'confirmHire' && (
              <>
                <DialogHeader>
                  <DialogTitle>Confirm Hire</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Finalize the hiring process and prepare for onboarding
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Start Date</label>
                    <Input
                      type="date"
                      value={hireForm.confirmedStartDate}
                      onChange={(e) =>
                        setHireForm({ ...hireForm, confirmedStartDate: e.target.value })
                      }
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Staff Email</label>
                    <Input
                      type="email"
                      placeholder="staff@example.com"
                      value={hireForm.staffEmail}
                      onChange={(e) => setHireForm({ ...hireForm, staffEmail: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Admin Notes</label>
                    <Textarea
                      placeholder="Add any final notes..."
                      value={hireForm.adminNotes}
                      onChange={(e) => setHireForm({ ...hireForm, adminNotes: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleConfirmHire}
                    className="bg-gradient-to-r from-purple-500 to-pink-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Hire
                  </Button>
                </DialogFooter>
              </>
            )}

            {actionDialog.action === 'decline' && (
              <>
                <DialogHeader>
                  <DialogTitle>Mark Offer as Declined</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Record that the candidate declined the job offer
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Decline Reason</label>
                    <Textarea
                      placeholder="Why did the candidate decline?"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleDecline}
                    className="bg-gradient-to-r from-red-500 to-red-600"
                  >
                    Mark as Declined
                  </Button>
                </DialogFooter>
              </>
            )}

            {actionDialog.action === 'notes' && (
              <>
                <DialogHeader>
                  <DialogTitle>Add Admin Notes</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Add or update notes for this interview request
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Textarea
                    placeholder="Enter your notes here..."
                    value={notesForm}
                    onChange={(e) => setNotesForm(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                    rows={6}
                  />
                  {selectedInterview?.adminNotes && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm text-gray-400 mb-2">Existing Notes:</p>
                      <p className="text-gray-300 text-sm whitespace-pre-wrap">
                        {selectedInterview.adminNotes}
                      </p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleAddNotes}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600"
                  >
                    Save Notes
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AdminRouteGuard>
  )
}

