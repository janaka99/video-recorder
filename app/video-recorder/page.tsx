"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { uploadVideo } from "@/actions/upload"
import RecordingStage from "@/components/video/recording-stage"
import ProcessingStage from "@/components/video/processing-stage"
import ResultStage from "@/components/video/result-page"

export default function VideoRecorder() {
  const [stage, setStage] = useState<"recording" | "processing" | "result">("recording")
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null)
  const [processedVideo, setProcessedVideo] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Handle completion of recording
  const handleRecordingComplete = (videoBlob: Blob) => {
    setRecordedVideo(videoBlob)
    setStage("processing")
  }

  // Handle video upload and processing
  const handleUpload = async () => {
    if (!recordedVideo) return

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
    }
  }

  // Simulate processing (in a real app, this would happen on the server)
  const startProcessing = () => {
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
    // In a real implementation, the processed video URL would come from the server
    // Here we're just using the original recorded video as a placeholder
    if (recordedVideo) {
      setProcessedVideo(URL.createObjectURL(recordedVideo))
      setStage("result")
    }
  }

  // Reset the application to record a new video
  const handleReset = () => {
    setRecordedVideo(null)
    setProcessedVideo(null)
    setUploadProgress(0)
    setProcessingProgress(0)
    setStage("recording")
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
              {stage === "recording" && (
                <RecordingStage onRecordingComplete={handleRecordingComplete} onCameraError={setCameraError} />
              )}

              {stage === "processing" && recordedVideo && (
                <ProcessingStage
                  recordedVideo={recordedVideo}
                  uploadProgress={uploadProgress}
                  processingProgress={processingProgress}
                  onUpload={handleUpload}
                  isUploading={uploadProgress > 0 && uploadProgress < 100}
                  isProcessing={processingProgress > 0 && processingProgress < 100}
                />
              )}

              {stage === "result" && processedVideo && (
                <ResultStage processedVideo={processedVideo} onReset={handleReset} />
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          Record up to 60 seconds of audio with logo on black background. Camera is used for recording but not visible.
        </CardFooter>
      </Card>
    </div>
  )
}

