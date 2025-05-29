import React from "react"
import WearableDevice from "./wearable-device"
import QRCodeDisplay from "./qr-code-display"

/**
 * WearableSection: The heart of the wearable simulation UI
 */
export default function WearableSection({
  displayText,
  onTap,
  disabled,
  displayState,
  isMobile,
  isInitialized,
  sessionId,
  screen,
  screenData,
}: {
  displayText: string
  onTap: () => void
  disabled: boolean
  displayState: "default" | "identity" | "moment"
  isMobile: boolean
  isInitialized: boolean
  sessionId: string
  screen?: string
  screenData?: any
}) {
  return (
    <>
      <WearableDevice text={displayText} onTap={onTap} disabled={disabled} state={displayState} screen={screen} screenData={screenData} />
      {/* Show QR code for pairing only on desktop for a more realistic wearable experience */}
      {!isMobile && isInitialized && (
        <div className="mt-10 relative z-10">
          <QRCodeDisplay sessionId={sessionId} />
        </div>
      )}
    </>
  )
} 