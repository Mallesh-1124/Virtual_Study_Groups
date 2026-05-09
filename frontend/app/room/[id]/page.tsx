"use client"

import { useEffect, useRef, useState, useCallback, type ChangeEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff,
  Send, Bot, Users, ArrowLeft, Loader2, Sparkles,
  FileText, Brain, CheckCircle2, XCircle, ChevronRight,
  BookOpen, Lightbulb, Target, MessageSquare,
} from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  getRoom, getMe, getRoomMessages, joinRoom, leaveRoom, askAI,
  generateSummary, generateQuiz, evaluateQuiz,
  getRoomMaterials, uploadMaterial,
} from "@/lib/api"
import type {
  StudyRoom, ChatMessage, User,
  SessionSummary, Quiz, QuizEvaluation,
  StudyMaterial, RoomMember,
} from "@/lib/api"

const COLORS = ["bg-blue-500", "bg-orange-500", "bg-purple-500", "bg-pink-500", "bg-emerald-500", "bg-cyan-500"]
type SidebarTab = "chat" | "summary" | "quiz" | "resources"

type ResourceType = "pdf" | "doc" | "video" | "image" | "link"

function RemoteVideo({ stream, fallback, username }: { stream: MediaStream | null, fallback: React.ReactNode, username: string }) {
  const vidRef = useRef<HTMLVideoElement>(null)
  
  useEffect(() => {
    if (vidRef.current && stream) {
      vidRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative rounded-lg bg-muted overflow-hidden flex items-center justify-center w-full h-full">
      <video
        ref={vidRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${!stream ? 'hidden' : ''}`}
      />
      {!stream && fallback}
      <div className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground">
        {username}
      </div>
    </div>
  )
}

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = Number(params.id)

  const [room, setRoom] = useState<StudyRoom | null>(null)
  const [participants, setParticipants] = useState<RoomMember[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [aiQuestion, setAiQuestion] = useState("")
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState("")

  // Sidebar tab
  const [activeTab, setActiveTab] = useState<SidebarTab>("chat")

  // Media controls
  const [micOn, setMicOn] = useState(true)
  const [videoOn, setVideoOn] = useState(true)

  // Session Summary
  const [summary, setSummary] = useState<SessionSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  // Resources
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [resourceTitle, setResourceTitle] = useState("")
  const [resourceDescription, setResourceDescription] = useState("")
  const [resourceSubject, setResourceSubject] = useState("")
  const [resourceSemester, setResourceSemester] = useState("")
  const [resourceType, setResourceType] = useState<ResourceType>("pdf")
  const [resourceUrl, setResourceUrl] = useState("")
  const [resourceFile, setResourceFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [resourceMessage, setResourceMessage] = useState<string | null>(null)

  // Quiz
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [quizLoading, setQuizLoading] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})
  const [quizResults, setQuizResults] = useState<QuizEvaluation | null>(null)
  const [quizEvaluating, setQuizEvaluating] = useState(false)

  // WebSocket & WebRTC
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Record<number, RTCPeerConnection>>({})
  const [remoteStreams, setRemoteStreams] = useState<Record<number, MediaStream>>({})


  // Scroll to bottom when messages change
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, activeTab])

  const addCurrentUserToParticipants = useCallback((userData: User, existingMembers: RoomMember[]) => {
    if (!userData) return existingMembers
    if (existingMembers.some((member) => member.user.id === userData.id)) return existingMembers
    return [
      ...existingMembers,
      {
        id: Date.now(),
        user: userData,
        role: 'student',
        joined_at: new Date().toISOString(),
        is_online: true,
      },
    ]
  }, [])

  // Initialize room
  useEffect(() => {
    async function init() {
      try {
        const [roomData, userData, messagesData, materialsData] = await Promise.all([
          getRoom(roomId),
          getMe(),
          getRoomMessages(roomId),
          getRoomMaterials(roomId),
        ])
        setRoom(roomData)
        setUser(userData)
        setMessages(messagesData)
        setMaterials(materialsData)
        setParticipants(addCurrentUserToParticipants(userData, roomData.members || []))
        await joinRoom(roomId)
      } catch (err: any) {
        if (err?.status === 401 || err?.status === 403) {
          router.push("/")
          return
        }
        setError("Failed to load room. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [roomId, router, addCurrentUserToParticipants])

  // Ensure the user leaves if the page is closed or refreshed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!user) return
      leaveRoom(roomId).catch(() => {})
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [roomId, user])

  // Start camera
  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch {
        // Camera not available — that's okay
      }
    }
    if (!loading && user) startCamera()

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [loading, user])

  // WebSocket connection
  useEffect(() => {
    if (!user) return

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
    const apiHost = new URL(apiUrl).host
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${wsProtocol}//${apiHost}/ws/room/${roomId}/`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    const createPeerConnection = (targetUserId: number) => {
      if (peersRef.current[targetUserId]) {
        peersRef.current[targetUserId].close()
      }
      
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] })
      peersRef.current[targetUserId] = pc

      pc.onicecandidate = (event) => {
        if (event.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'webrtc_ice_candidate',
            target_user_id: targetUserId,
            payload: event.candidate,
          }))
        }
      }

      pc.ontrack = (event) => {
        setRemoteStreams(prev => ({
          ...prev,
          [targetUserId]: event.streams[0]
        }))
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          pc.addTrack(track, streamRef.current!)
        })
      }

      return pc
    }

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "chat_message") {
        const msg: ChatMessage = {
          id: data.message_id || Date.now(),
          user: data.user_id ? { id: data.user_id, username: data.username, email: "", first_name: "", last_name: "" } : null,
          sender_name: data.is_ai ? "AI Teacher" : data.username,
          content: data.message,
          is_ai: data.is_ai,
          created_at: data.timestamp || new Date().toISOString(),
        }
        setMessages(prev => [...prev, msg])
      }
      if (data.type === "user_join") {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            user: null,
            sender_name: "System",
            content: `${data.username} joined the room.`,
            is_ai: false,
            created_at: new Date().toISOString(),
          },
        ])
        setParticipants(prev => {
          if (prev.some((member) => member.user.id === data.user_id)) {
            return prev.map((member) =>
              member.user.id === data.user_id ? { ...member, is_online: true } : member
            )
          }
          return [...prev, { id: Date.now(), user: { id: data.user_id, username: data.username, email: "", first_name: "", last_name: "" }, role: 'student', joined_at: new Date().toISOString(), is_online: true }]
        })

        // WebRTC: Caller sends offer to new user
        if (data.user_id && data.user_id !== user.id) {
          const pc = createPeerConnection(data.user_id)
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)
          ws.send(JSON.stringify({
            type: 'webrtc_offer',
            target_user_id: data.user_id,
            payload: offer,
          }))
        }
      }

      if (data.type === "user_leave") {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            user: null,
            sender_name: "System",
            content: `${data.username} left the room.`,
            is_ai: false,
            created_at: new Date().toISOString(),
          },
        ])
        setParticipants(prev => prev.map((member) =>
          member.user.id === data.user_id ? { ...member, is_online: false } : member
        ))
        
        // Clean up WebRTC for the user
        if (peersRef.current[data.user_id]) {
          peersRef.current[data.user_id].close()
          delete peersRef.current[data.user_id]
        }
        setRemoteStreams(prev => {
          const next = { ...prev }
          delete next[data.user_id]
          return next
        })
      }

      if (data.type === "webrtc_offer") {
        const senderId = data.sender_id
        if (!senderId) return
        const pc = createPeerConnection(senderId)
        await pc.setRemoteDescription(new RTCSessionDescription(data.payload))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        ws.send(JSON.stringify({
          type: 'webrtc_answer',
          target_user_id: senderId,
          payload: answer,
        }))
      }

      if (data.type === "webrtc_answer") {
        const pc = peersRef.current[data.sender_id]
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.payload))
        }
      }

      if (data.type === "webrtc_ice_candidate") {
        const pc = peersRef.current[data.sender_id]
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(data.payload))
        }
      }
    }

    ws.onerror = () => {}
    ws.onclose = () => {
      wsRef.current = null
    }

    return () => {
      ws.close()
      wsRef.current = null
      Object.values(peersRef.current).forEach(pc => pc.close())
      peersRef.current = {}
    }
  }, [user, roomId])

  // Send chat message
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !wsRef.current) return
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ message: newMessage }))
      setNewMessage("")
    }
  }, [newMessage])

  // Ask AI
  const handleAskAI = useCallback(async () => {
    if (!aiQuestion.trim()) return
    setAiLoading(true)
    try {
      const res = await askAI(roomId, aiQuestion)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          user: user,
          sender_name: user?.username || "You",
          content: aiQuestion,
          is_ai: false,
          created_at: new Date().toISOString(),
        },
        {
          id: Date.now() + 1,
          user: null,
          sender_name: "AI Teacher",
          content: res.response,
          is_ai: true,
          created_at: new Date().toISOString(),
        },
      ])
      setAiQuestion("")
    } catch {
      setError("Failed to get AI response.")
    } finally {
      setAiLoading(false)
    }
  }, [aiQuestion, roomId, user])

  // Generate summary
  const handleGenerateSummary = async () => {
    setSummaryLoading(true)
    try {
      const data = await generateSummary(roomId)
      setSummary(data)
    } catch {
      setError("Failed to generate summary.")
    } finally {
      setSummaryLoading(false)
    }
  }

  // Generate quiz
  const handleGenerateQuiz = async () => {
    setQuizLoading(true)
    setQuizAnswers({})
    setQuizResults(null)
    try {
      const data = await generateQuiz(roomId, 5)
      setQuiz(data)
    } catch {
      setError("Failed to generate quiz.")
    } finally {
      setQuizLoading(false)
    }
  }

  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (!quiz) return
    setQuizEvaluating(true)
    try {
      const results = await evaluateQuiz(roomId, quiz, quizAnswers)
      setQuizResults(results)
    } catch {
      setError("Failed to evaluate quiz.")
    } finally {
      setQuizEvaluating(false)
    }
  }

  const loadMaterials = async () => {
    setMaterialsLoading(true)
    try {
      const materialsData = await getRoomMaterials(roomId)
      setMaterials(materialsData)
    } catch {
      setError("Failed to load resources.")
    } finally {
      setMaterialsLoading(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setResourceFile(file)
    if (file) {
      setResourceUrl("")
    }
  }

  const handleUploadResource = async () => {
    if (!resourceTitle.trim() || (!resourceUrl.trim() && !resourceFile)) {
      setResourceMessage("Please provide a title and either a link or a file.")
      return
    }
    setUploading(true)
    setResourceMessage(null)
    const formData = new FormData()
    formData.append("title", resourceTitle)
    formData.append("description", resourceDescription)
    formData.append("subject", resourceSubject)
    formData.append("semester", resourceSemester)
    formData.append("material_type", resourceType)
    if (resourceUrl.trim()) {
      formData.append("url", resourceUrl)
    }
    if (resourceFile) {
      formData.append("file", resourceFile)
    }
    formData.append("room", String(roomId))

    try {
      await uploadMaterial(formData)
      setResourceTitle("")
      setResourceDescription("")
      setResourceSubject("")
      setResourceSemester("")
      setResourceType("pdf")
      setResourceUrl("")
      setResourceFile(null)
      setResourceMessage("Resource uploaded successfully.")
      await loadMaterials()
    } catch {
      setResourceMessage("Failed to upload resource.")
    } finally {
      setUploading(false)
    }
  }

  // Toggle mic/video
  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => (t.enabled = !t.enabled))
    }
    setMicOn(!micOn)
  }

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => (t.enabled = !t.enabled))
    }
    setVideoOn(!videoOn)
  }

  const onlineCount = participants.filter((member) => member.is_online).length

  const handleLeave = async () => {
    try {
      await leaveRoom(roomId)
    } catch {}
    streamRef.current?.getTracks().forEach(t => t.stop())
    router.push("/admin")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Joining study room...</p>
        </div>
      </div>
    )
  }

  if (error && !room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.push("/admin")}>Go back</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg text-foreground tracking-tight truncate max-w-[150px] sm:max-w-none">
                {room?.name}
              </h1>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20 text-[10px] font-bold">
                LIVE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{room?.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold text-primary tracking-wide">GEMINI 2.5 FLASH</span>
          </div>
          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold">{onlineCount}</span>
          </div>
        </div>
      </header>

      {/* Room Info Bar */}
      <div className="px-4 py-1.5 bg-muted/30 border-b border-border/50 flex items-center justify-between text-[10px] sm:text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Admin:</span>
          <span className="font-semibold text-primary">{room?.created_by?.username || "Unknown"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Created on {new Date(room?.created_at || Date.now()).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-1 overflow-hidden min-h-0">
        {/* Video area */}
        <div className="flex flex-col p-2 sm:p-4 overflow-hidden border-b lg:border-b-0 lg:border-r border-border bg-muted/20 lg:col-span-2 h-[38vh] sm:h-[45vh] lg:h-full min-h-0">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 flex-1 min-h-[300px]">
            {/* Local video */}
            <div className="relative rounded-lg bg-muted overflow-hidden flex items-center justify-center border border-border shadow-sm">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover ${!videoOn ? 'hidden' : ''}`}
              />
              {!videoOn && (
                <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-base sm:text-lg">
                    {user?.username?.substring(0, 2).toUpperCase() || "ME"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="absolute bottom-2 left-2 rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-medium text-foreground max-w-[80%] truncate">
                You ({user?.username})
              </div>
            </div>

            {/* Other participants */}
            {participants
              .filter((m) => user ? m.user.id !== user.id : true)
              .slice(0, 3)
              .map((member, i) => (
                <RemoteVideo
                  key={member.id}
                  stream={remoteStreams[member.user.id] || null}
                  username={member.user.username}
                  fallback={
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className={`${COLORS[i % COLORS.length]} text-white text-lg`}>
                        {member.user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  }
                />
              ))}

            {/* Empty slots */}
            {participants.filter((m) => user ? m.user.id !== user.id : true).length < 3 &&
              Array.from({ length: Math.max(0, 3 - participants.filter((m) => user ? m.user.id !== user.id : true).length) }).map((_, i) => (
                <div key={`empty-${i}`} className="rounded-lg bg-muted/50 border border-dashed border-border flex items-center justify-center">
                  <p className="text-xs text-muted-foreground">Waiting for participants...</p>
                </div>
              ))}
          </div>

          {/* Media controls */}
          <div className="py-2 sm:py-4 flex items-center justify-center gap-3 sm:gap-4 shrink-0">
            <Button 
              size="icon" 
              variant={micOn ? "secondary" : "destructive"} 
              className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg transition-all ${micOn ? 'hover:bg-primary/20 hover:text-primary' : ''}`} 
              onClick={toggleMic}
            >
              {micOn ? <Mic className="h-4 w-4 sm:h-5 sm:w-5" /> : <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
            <Button 
              size="icon" 
              variant={videoOn ? "secondary" : "destructive"} 
              className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg transition-all ${videoOn ? 'hover:bg-primary/20 hover:text-primary' : ''}`} 
              onClick={toggleVideo}
            >
              {videoOn ? <Video className="h-4 w-4 sm:h-5 sm:w-5" /> : <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
            <Button size="icon" variant="secondary" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg hover:bg-primary/20 hover:text-primary hidden xs:flex">
              <MonitorUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button size="icon" variant="destructive" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform" onClick={handleLeave}>
              <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        {/* Sidebar with tabs */}
        <div className="flex flex-col overflow-hidden h-full min-h-0 bg-card/30 backdrop-blur-sm lg:col-span-1">
          {/* Tab buttons */}
          <div className="flex border-b border-border bg-card/50">
            {[
              { id: "chat" as SidebarTab, label: "Chat", icon: MessageSquare },
              { id: "summary" as SidebarTab, label: "Summary", icon: FileText },
              { id: "quiz" as SidebarTab, label: "Quiz", icon: Brain },
              { id: "resources" as SidebarTab, label: "Resources", icon: BookOpen },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2 sm:py-3 text-[10px] sm:text-xs font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.label.substring(0, 1)}</span>
              </button>
            ))}
          </div>

          {/* ─── Chat Tab ─── */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                <div className="space-y-4 pt-2">
                  {messages.map((msg) => {
                    const isSystem = msg.sender_name === "System"
                    const isMe = msg.user?.id === user?.id
                    
                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded">
                            {msg.content}
                          </span>
                        </div>
                      )
                    }

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} space-y-1`}>
                        <div className="flex items-center gap-2 px-1">
                          {!isMe && msg.is_ai && <Sparkles className="h-3 w-3 text-amber-500" />}
                          <span className={`text-[10px] font-bold uppercase tracking-tight ${msg.is_ai ? "text-amber-600" : "text-muted-foreground"}`}>
                            {msg.sender_name}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <div className={`
                          max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm
                          ${isMe ? "bg-primary text-primary-foreground rounded-tr-none" : 
                            msg.is_ai ? "bg-amber-500/10 border border-amber-500/20 text-foreground rounded-tl-none backdrop-blur-sm" : 
                            "bg-muted/50 border border-border/50 text-foreground rounded-tl-none"}
                        `}>
                          {msg.is_ai ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted/50 prose-pre:p-2 prose-pre:rounded-md prose-code:text-xs prose-code:bg-primary/5 prose-code:px-1 prose-code:rounded">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* AI Ask section */}
              <div className="border-t border-border p-3 bg-gradient-to-r from-primary/5 to-amber-500/5 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span className="text-xs font-medium text-primary">Ask AI Teacher (Gemini)</span>
                </div>
                <div className="flex gap-2">
                    <Input
                      placeholder="Ask the AI teacher..."
                      className="flex-1 h-9 text-sm bg-background/50"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !aiLoading) {
                          e.preventDefault();
                          handleAskAI();
                        }
                      }}
                      disabled={aiLoading}
                    />
                  <Button size="icon" className="h-9 w-9 shadow-md" onClick={handleAskAI} disabled={aiLoading || !aiQuestion.trim()}>
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Chat input */}
              <div className="border-t border-border p-3 shrink-0 bg-background/50">
                <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      className="flex-1 h-9 text-sm bg-background/50"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                  <Button size="icon" className="h-9 w-9 shadow-md" onClick={sendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Summary Tab ─── */}
          {activeTab === "summary" && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="space-y-4">
                <div className="text-center">
                  <FileText className="h-8 w-8 mx-auto text-primary mb-2" />
                  <h3 className="font-semibold text-foreground">Session Summary</h3>
                  <p className="text-xs text-muted-foreground mt-1">AI-generated summary of your study session</p>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                >
                  {summaryLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate Summary</>
                  )}
                </Button>

                {summary && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Messages", value: summary.total_messages, icon: MessageSquare },
                        { label: "Questions", value: summary.questions_asked, icon: Lightbulb },
                        { label: "AI Replies", value: summary.ai_responses, icon: Bot },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg bg-muted p-2 text-center">
                          <s.icon className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                          <p className="text-lg font-bold text-foreground">{s.value}</p>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Summary text */}
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                      <p className="text-sm text-foreground leading-relaxed">{summary.summary}</p>
                    </div>

                    {/* Key Topics */}
                    {(summary.key_topics?.length ?? 0) > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" /> Key Topics
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {summary.key_topics?.map((topic, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{topic}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Takeaways */}
                    {(summary.key_takeaways?.length ?? 0) > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                          <Target className="h-3 w-3" /> Key Takeaways
                        </h4>
                        <ul className="space-y-1.5">
                          {summary.key_takeaways?.map((t, i) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                              {t}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Study Tips */}
                    {(summary.study_tips?.length ?? 0) > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" /> Study Tips
                        </h4>
                        <ul className="space-y-1.5">
                          {summary.study_tips?.map((tip, i) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-amber-500" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Next Topics */}
                    {(summary.suggested_next_topics?.length ?? 0) > 0 && (
                      <div className="rounded-lg bg-muted p-3">
                        <h4 className="text-xs font-semibold text-foreground mb-1.5">📚 Suggested Next Topics</h4>
                        <ul className="space-y-1">
                          {summary.suggested_next_topics?.map((t, i) => (
                            <li key={i} className="text-xs text-muted-foreground">• {t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Quiz Tab ─── */}
          {activeTab === "quiz" && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="space-y-4">
                <div className="text-center">
                  <Brain className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <h3 className="font-semibold text-foreground">AI Quiz</h3>
                  <p className="text-xs text-muted-foreground mt-1">Test your knowledge with AI-generated questions</p>
                </div>

                <Button
                  className="w-full gap-2"
                  variant={quiz ? "outline" : "default"}
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading}
                >
                  {quizLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating Quiz...</>
                  ) : quiz ? (
                    <><Brain className="h-4 w-4" /> Generate New Quiz</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Generate Quiz</>
                  )}
                </Button>

                {quiz && quiz.questions?.length > 0 && (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <h4 className="text-sm font-semibold text-foreground">{quiz.quiz_title}</h4>

                    {quiz.questions.map((q, qi) => (
                      <div key={q.id} className="rounded-lg border border-border p-3 space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          {qi + 1}. {q.question}
                        </p>
                        <div className="space-y-1.5">
                          {q.options.map((option) => {
                            const optionLetter = option.charAt(0)
                            const isSelected = quizAnswers[String(q.id)] === optionLetter
                            const hasResults = quizResults !== null
                            const result = quizResults?.results.find(r => r.id === q.id)
                            const isCorrectAnswer = result && optionLetter === result.correct_answer
                            const isWrongSelection = hasResults && isSelected && !result?.is_correct

                            let borderClass = "border-border"
                            if (hasResults && isCorrectAnswer) borderClass = "border-green-500 bg-green-500/10"
                            else if (isWrongSelection) borderClass = "border-red-500 bg-red-500/10"
                            else if (isSelected && !hasResults) borderClass = "border-primary bg-primary/10"

                            return (
                              <button
                                key={option}
                                onClick={() => {
                                  if (!hasResults) {
                                    setQuizAnswers(prev => ({ ...prev, [String(q.id)]: optionLetter }))
                                  }
                                }}
                                disabled={hasResults}
                                className={`w-full text-left text-xs p-2 rounded-md border transition-colors ${borderClass} ${
                                  hasResults ? "cursor-default" : "hover:border-primary/50 cursor-pointer"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {hasResults && isCorrectAnswer && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                                  {isWrongSelection && <XCircle className="h-3 w-3 text-red-500 shrink-0" />}
                                  <span className="text-foreground">{option}</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>

                        {/* Show explanation after evaluation */}
                        {quizResults && (() => {
                          const result = quizResults.results.find(r => r.id === q.id)
                          return result ? (
                            <div className={`rounded-md p-2 text-xs mt-2 ${
                              result.is_correct ? "bg-green-500/10 text-green-700" : "bg-amber-500/10 text-amber-700"
                            }`}>
                              <p className="font-medium mb-0.5">{result.is_correct ? "✅ Correct!" : "❌ Incorrect"}</p>
                              <p className="text-muted-foreground">{result.explanation}</p>
                            </div>
                          ) : null
                        })()}
                      </div>
                    ))}

                    {/* Submit / Results */}
                    {!quizResults ? (
                      <Button
                        className="w-full gap-2"
                        onClick={handleSubmitQuiz}
                        disabled={quizEvaluating || Object.keys(quizAnswers).length < quiz.questions.length}
                      >
                        {quizEvaluating ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Evaluating...</>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Submit Answers ({Object.keys(quizAnswers).length}/{quiz.questions.length})
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 p-4 text-center space-y-2">
                        <p className="text-3xl font-bold text-foreground">
                          {quizResults.score}/{quizResults.total}
                        </p>
                        <p className="text-lg font-semibold text-primary">{quizResults.percentage}%</p>
                        <p className="text-sm text-muted-foreground">{quizResults.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {quiz?.error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center">
                    <p className="text-sm text-destructive">{quiz.error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── Resources Tab ─── */}
          {activeTab === "resources" && (
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="space-y-4">
                <div className="text-center">
                  <BookOpen className="h-8 w-8 mx-auto text-cyan-500 mb-2" />
                  <h3 className="font-semibold text-foreground">Study Resources</h3>
                  <p className="text-xs text-muted-foreground mt-1">Upload, share, and access room material</p>
                </div>

                <div className="space-y-3 rounded-lg border border-border bg-muted p-4">
                  <div className="grid grid-cols-1 gap-3">
                    <Input
                      placeholder="Resource title"
                      value={resourceTitle}
                      onChange={(e) => setResourceTitle(e.target.value)}
                    />
                    <Textarea
                      placeholder="Description"
                      value={resourceDescription}
                      onChange={(e) => setResourceDescription(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Subject"
                        value={resourceSubject}
                        onChange={(e) => setResourceSubject(e.target.value)}
                      />
                      <Input
                        placeholder="Semester"
                        value={resourceSemester}
                        onChange={(e) => setResourceSemester(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        aria-label="Select resource type"
                        value={resourceType}
                        onChange={(e) => setResourceType(e.target.value as ResourceType)}
                        className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                      >
                        <option value="pdf">PDF</option>
                        <option value="doc">Word</option>
                        <option value="video">Video</option>
                        <option value="image">Image</option>
                        <option value="link">Link</option>
                      </select>
                      <Input
                        placeholder="External link"
                        value={resourceUrl}
                        onChange={(e) => setResourceUrl(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="text-xs font-medium text-muted-foreground">Upload file (optional)</label>
                      <input
                        type="file"
                        aria-label="Upload resource file"
                        onChange={handleFileChange}
                        className="text-sm text-muted-foreground"
                      />
                    </div>
                    {resourceMessage && (
                      <p className="text-sm text-muted-foreground">{resourceMessage}</p>
                    )}
                    <Button
                      className="w-full"
                      onClick={handleUploadResource}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                      ) : (
                        <>Upload Resource</>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Available resources</h4>
                    <Badge variant="outline">{materials.length}</Badge>
                  </div>

                  {materialsLoading ? (
                    <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                      Loading resources...
                    </div>
                  ) : materials.length === 0 ? (
                    <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
                      No resources uploaded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {materials.map((material) => (
                        <Card key={material.id} className="p-3 border border-border">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs">{material.material_type.toUpperCase()}</Badge>
                                <span className="text-sm font-semibold text-foreground">{material.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{material.subject} · {material.semester}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">{material.description}</p>
                            </div>
                            <Link
                              href={material.url || material.file || '#'}
                              target="_blank"
                              className="text-primary text-xs font-medium"
                            >
                              View
                            </Link>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
