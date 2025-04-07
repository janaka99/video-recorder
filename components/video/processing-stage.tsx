"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Loader2, Video } from "lucide-react"

interface ProcessingStageProps {
  recordedVideo: Blob
  uploadProgress: number
  processingProgress: number
  isUploading: boolean
  isProcessing: boolean
  onUpload: () => void
}

export default function ProcessingStage({
  recordedVideo,
  uploadProgress,
  processingProgress,
  isUploading,
  isProcessing,
  onUpload,
}: ProcessingStageProps) {
  return (
    <div className="space-y-4">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video src={URL.createObjectURL(recordedVideo)} controls className="w-full h-full" />
      </div>

      <div className="text-center text-sm text-muted-foreground mb-4">
        Review your recording. If you're satisfied, click the button below to upload and process it.
      </div>

      <Button onClick={onUpload} className="w-full" disabled={isUploading || isProcessing}>
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
  )
}

