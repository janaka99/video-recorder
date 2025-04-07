"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Camera } from "lucide-react"

interface RecordingStageProps {
  onRecordingComplete: (videoBlob: Blob) => void
  onCameraError: (error: string) => void
}

export default function RecordingStage({ onRecordingComplete, onCameraError }: RecordingStageProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const logoRef = useRef<HTMLImageElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize camera and logo
  useEffect(() => {
    // Load the hardcoded logo
    const img = new Image()
    img.src = "/nicecover.png"
    img.crossOrigin = "anonymous"
    img.onload = () => {
      logoRef.current = img
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
          audio: true,
        })

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play();
        }

        // Start drawing logo on canvas
        startDrawingLogo()
      } catch (err) {
        console.error("Error accessing camera:", err)
        onCameraError("Could not access camera. Please ensure you've granted permission.")
      }
    }

    startCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [onCameraError])

  // Draw logo on canvas with solid background (no camera feed)
  const startDrawingLogo = () => {
    const drawLogo = () => {
      const canvas = canvasRef.current
      const video = videoRef.current

      if (canvas && video) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          // Set canvas dimensions to match video or use default dimensions
          canvas.width = video.videoWidth || 640
          canvas.height = video.videoHeight || 480

       // Clear previous frame (but keep transparency)
       ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw logo image if available
          if (logoRef.current) {
            const logoWidth = Math.min(200, canvas.width / 3)
            const logoHeight = (logoRef.current.height / logoRef.current.width) * logoWidth
            const logoX = (canvas.width - logoWidth) / 2
            const logoY = 20 // Position at the top with some padding

            ctx.drawImage(logoRef.current, logoX, logoY, logoWidth, logoHeight)
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(drawLogo)
    }

    animationFrameRef.current = requestAnimationFrame(drawLogo)
  }

  // Start recording
  const startRecording = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const stream = canvas.captureStream(30) // 30 FPS

    // Add audio track from original stream to canvas stream
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        stream.addTrack(audioTrack)
      }
    }

    const mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" })
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      onRecordingComplete(blob)
      chunksRef.current = []
    }

    // Start recording
    mediaRecorder.start(100) // Collect data every 100ms
    setIsRecording(true)
    setRecordingTime(0)

    // Set timer for 60 seconds max
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        const newTime = prev + 1
        if (newTime >= 60) {
          stopRecording()
        }
        return newTime
      })
    }, 1000)
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">

        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      </div>
        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-sm font-medium">Recording</span>
          </div>
        )}
      {/* Recording progress */}
      {isRecording && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Recording: {recordingTime}s</span>
            <span>Max: 60s</span>
          </div>
          <Progress value={(recordingTime / 60) * 100} />
        </div>
      )}

      {/* Recording controls */}
      <div className="flex justify-center">
        {!isRecording ? (
          <Button onClick={startRecording} className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600">
            <Camera className="h-6 w-6" />
          </Button>
        ) : (
          <Button
            onClick={stopRecording}
            variant="outline"
            className="rounded-full w-16 h-16 border-red-500 text-red-500"
          >
            <div className="w-6 h-6 bg-red-500 rounded-sm"></div>
          </Button>
        )}
      </div>
    </div>
  )
}

