"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Download, Video, Camera } from "lucide-react"
import { uploadVideo } from "@/actions/upload"


export default function VideoRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null)
  const [processedVideo, setProcessedVideo] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

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
    img.src = "/nicecover.png" // Using a placeholder path - this would be your actual logo
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
        }

        // Start drawing logo on canvas
        startDrawingLogo()
      } catch (err) {
        console.error("Error accessing camera:", err)
        setCameraError("Could not access camera. Please ensure you've granted permission.")
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
  }, [])

  // Draw logo on canvas
  const startDrawingLogo = () => {
    const drawLogo = () => {
      const canvas = canvasRef.current
      const video = videoRef.current

      if (canvas && video && video.readyState >= 2) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Draw video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Draw logo image if available
          if (logoRef.current) {
            const logoWidth = Math.min(400, canvas.width / 2)
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
      setRecordedVideo(blob)
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

  // Handle video upload and processing
  const handleUpload = async () => {
    if (!recordedVideo) return

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + 5
        if (newProgress >= 100) {
          clearInterval(uploadInterval)
          startProcessing()
        }
        return newProgress < 100 ? newProgress : 100
      })
    }, 200)

    try {
      // Create a FormData object to send the video
      const formData = new FormData()
      formData.append("video", recordedVideo)

      // Upload the video using server action
      const result = await uploadVideo(formData)

      if (result.success) {
        setProcessedVideo(result.videoUrl)
      } else {
        console.error("Error processing video:", result.error)
      }
    } catch (error) {
      console.error("Error uploading video:", error)
    } finally {
      setIsUploading(false)
    }
  }

  // Simulate processing (in a real app, this would happen on the server)
  const startProcessing = () => {
    setIsProcessing(true)
    setProcessingProgress(0)

    // Simulate processing progress
    const processInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        const newProgress = prev + 2
        if (newProgress >= 100) {
          clearInterval(processInterval)
          finishProcessing()
        }
        return newProgress < 100 ? newProgress : 100
      })
    }, 150)
  }

  // Finish processing simulation
  const finishProcessing = () => {
    setIsProcessing(false)
    // In a real implementation, the processed video URL would come from the server
    // Here we're just using the original recorded video as a placeholder
    if (recordedVideo) {
      setProcessedVideo(URL.createObjectURL(recordedVideo))
    }
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Video Recorder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {cameraError ? (
            <div className="p-4 text-center text-red-500 border border-red-200 rounded-md">{cameraError}</div>
          ) : (
            <>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                {/* Hidden video element for camera feed */}
                <video ref={videoRef} autoPlay playsInline muted className="hidden" />

                {/* Canvas for drawing video with logo overlay */}
                <canvas ref={canvasRef} className="w-full h-full object-contain" />

                {/* Recording indicator */}
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="text-sm font-medium">Recording</span>
                  </div>
                )}
              </div>

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
                  <Button
                    onClick={startRecording}
                    className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
                    disabled={!!recordedVideo}
                  >
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

              {/* Recorded video preview */}
              {recordedVideo && !processedVideo && (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video src={URL.createObjectURL(recordedVideo)} controls className="w-full h-full" />
                  </div>

                  <Button onClick={handleUpload} className="w-full" disabled={isUploading || isProcessing}>
                    {isUploading || isProcessing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Video className="mr-2 h-4 w-4" />
                    )}
                    {isUploading ? "Uploading..." : isProcessing ? "Processing..." : "Upload & Process Video"}
                  </Button>

                  {/* Upload progress */}
                  {isUploading && (
                    <div className="space-y-1">
                      <div className="text-sm">Uploading: {uploadProgress}%</div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  {/* Processing progress */}
                  {isProcessing && (
                    <div className="space-y-1">
                      <div className="text-sm">Processing: {processingProgress}%</div>
                      <Progress value={processingProgress} />
                    </div>
                  )}
                </div>
              )}

              {/* Processed video */}
              {processedVideo && (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video src={processedVideo} controls className="w-full h-full" />
                  </div>

                  <Button
                    onClick={() => {
                      const a = document.createElement("a")
                      a.href = processedVideo
                      a.download = `video-with-logo-${new Date().toISOString()}.webm`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                    }}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Processed Video
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Record up to 60 seconds of video with logo overlay
        </CardFooter>
      </Card>
    </div>
  )
}

