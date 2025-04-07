"use client"

import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"

interface ResultStageProps {
  processedVideo: string
  onReset: () => void
}

export default function ResultStage({ processedVideo, onReset }: ResultStageProps) {
  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = processedVideo
    a.download = `video-with-logo-${new Date().toISOString()}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video src={processedVideo} controls className="w-full h-full" />
      </div>

      <div className="text-center text-sm text-muted-foreground mb-4">
        Your video has been processed successfully. You can download it or record a new one.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button onClick={handleDownload} className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Download Video
        </Button>

        <Button onClick={onReset} variant="outline" className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Record New Video
        </Button>
      </div>
    </div>
  )
}

