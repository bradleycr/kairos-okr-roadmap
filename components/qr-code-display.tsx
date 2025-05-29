"use client"

import { QRCodeSVG } from "qrcode.react"

interface QRCodeDisplayProps {
  sessionId: string
}

export default function QRCodeDisplay({ sessionId }: QRCodeDisplayProps) {
  const simulateUrl = `${window.location.origin}/simulate?session=${sessionId}`

  return (
    <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-200">
      <p className="text-sm font-mono text-gray-600 mb-3">📱 Scan to simulate wearable</p>
      <div className="flex justify-center">
        <QRCodeSVG value={simulateUrl} size={120} level="M" includeMargin={true} />
      </div>
      <p className="text-xs text-gray-700 font-mono mt-2 font-semibold">Scan to simulate NFC pendant pairing.</p>
      <p className="text-xs text-gray-400 font-mono mt-1">Session: {sessionId}</p>
    </div>
  )
}
