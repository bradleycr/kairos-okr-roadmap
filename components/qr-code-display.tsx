"use client"

import React from "react"
import { QRCodeSVG } from "qrcode.react"

const QRCodeDisplay: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const sessionUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?session=${sessionId}`
    : `https://kairos.example.com/?session=${sessionId}`

  return (
    <div className="flex flex-col items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm max-w-xs">
      <p className="text-sm font-mono text-gray-600 mb-3">📱 Connect to Session</p>
      
      <QRCodeSVG value={sessionUrl} size={120} level="M" includeMargin={true} />
      
      <p className="text-xs text-gray-700 font-mono mt-2 font-semibold text-center">
        Scan to join KairOS session
      </p>
      <p className="text-xs text-gray-500 font-mono mt-1 text-center">
        Session: {sessionId}
      </p>
    </div>
  )
}

export default QRCodeDisplay
