"use client"

import { useState } from "react"
import { HAL } from "@/lib/hardwareAbstraction"

interface WearableDeviceProps {
  text: string
  onTap: () => void
  disabled: boolean
  state: "default" | "identity" | "moment"
  screen?: string
  screenData?: any
}

export default function WearableDevice({ text, onTap, disabled, state, screen = "main", screenData }: WearableDeviceProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // --- E-ink/Kindle inspired palette ---
  const epaperBg = "#f5f5ec" // device background
  const epaperBorder = "#b8b5a1" // device/screen border
  const epaperScreen = "#eae7df" // screen area
  const epaperText = "#44423a" // e-ink text
  const epaperShadow = "0 2px 12px 0 #b8b5a133"

  // --- Dot grid CSS pattern for e-ink realism ---
  const dotGrid = `repeating-radial-gradient(circle, #d6d3c2 0.5px, transparent 1.5px, transparent 8px)`

  // --- E-ink slow refresh animation ---
  const triggerRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 480) // ~0.5s e-ink refresh
  }

  // Menu options for chooseAction and newUserPrompt screens
  const chooseActionOptions = [
    { label: "Save Moment", action: "logMoment" },
    { label: "New Pendant (New User/Group)", action: "simulatePendant" },
    { label: "Cancel", action: "cancel" },
  ]
  const newUserPromptOptions = [
    { label: "Switch User", action: "switch" },
    { label: "Add to Group", action: "add" },
    { label: "Cancel", action: "cancel" },
  ]

  // Handle tap for default/identity/moment screens
  const handleTap = () => {
    if (disabled) return
    setIsAnimating(true)
    triggerRefresh()
    HAL.vibration.vibrate([50, 30, 100])
    HAL.display.show({ type: 'text', text })
    onTap()
    setTimeout(() => {
      setIsAnimating(false)
    }, 400)
  }

  // Render e-paper content based on screen
  let displayContent: React.ReactNode = null
  let isMenuScreen = screen === "momentOptions" || screen === "userConflict"
  if (screen === "momentOptions") {
    displayContent = (
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold mb-2 tracking-wide" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>What would you like to do?</span>
        <div className="flex flex-col gap-2 mt-2 w-full">
          <button
            className="px-3 py-2 rounded text-base font-mono w-full text-left border transition"
            style={{
              background: epaperScreen,
              borderColor: epaperBorder,
              color: epaperText,
              fontFamily: 'DM Mono, Courier, monospace',
            }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); HAL.input.trigger("save"); triggerRefresh(); }}
            type="button"
            tabIndex={0}
          >
            Save this moment
          </button>
          <button
            className="px-3 py-2 rounded text-base font-mono w-full text-left border transition"
            style={{
              background: epaperScreen,
              borderColor: epaperBorder,
              color: epaperText,
              fontFamily: 'DM Mono, Courier, monospace',
            }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); HAL.input.trigger("cancel"); triggerRefresh(); }}
            type="button"
            tabIndex={0}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  } else if (screen === "userConflict") {
    displayContent = (
      <div className="flex flex-col items-center">
        <span className="text-lg font-bold mb-2 tracking-wide" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>User Already Logged In</span>
        <div className="text-xs font-mono mb-2" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>A new DID was detected:</div>
        <div
          className="break-all font-bold text-xs mb-2 px-2 py-1 rounded bg-white/60 border"
          style={{
            color: epaperText,
            fontFamily: 'DM Mono, Courier, monospace',
            maxWidth: '100%',
            wordBreak: 'break-all',
            borderColor: epaperBorder,
          }}
        >
          {screenData?.did ? `${screenData.did.slice(0, 10)}...${screenData.did.slice(-8)}` : ''}
        </div>
        <div className="flex flex-col gap-2 w-full">
          <button
            className="px-3 py-2 rounded text-base font-mono w-full text-left border transition"
            style={{
              background: epaperScreen,
              borderColor: epaperBorder,
              color: epaperText,
              fontFamily: 'DM Mono, Courier, monospace',
            }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); HAL.input.trigger("logout"); triggerRefresh(); }}
            type="button"
            tabIndex={0}
          >
            Log out previous user
          </button>
          <button
            className="px-3 py-2 rounded text-base font-mono w-full text-left border transition"
            style={{
              background: epaperScreen,
              borderColor: epaperBorder,
              color: epaperText,
              fontFamily: 'DM Mono, Courier, monospace',
            }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); HAL.input.trigger("bond"); triggerRefresh(); }}
            type="button"
            tabIndex={0}
          >
            Create bonding group
          </button>
          <button
            className="px-3 py-2 rounded text-base font-mono w-full text-left border transition"
            style={{
              background: epaperScreen,
              borderColor: epaperBorder,
              color: epaperText,
              fontFamily: 'DM Mono, Courier, monospace',
            }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); HAL.input.trigger("cancel"); triggerRefresh(); }}
            type="button"
            tabIndex={0}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  } else if (screen === "bondingSuccess") {
    displayContent = (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-2xl font-bold mb-4 tracking-wide" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>Successfully created bonding group</span>
      </div>
    )
  } else if (state === "default" || screen === "main") {
    displayContent = (
      <div className="flex flex-col items-center justify-center h-full">
        <span className="text-4xl font-extrabold tracking-widest mb-2" style={{ letterSpacing: '0.12em', color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>MELD_</span>
        <span className="text-base font-mono mt-2 tracking-wide" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>tap to begin</span>
      </div>
    )
  } else if (state === "identity" || state === "moment") {
    displayContent = (
      <div className="text-sm whitespace-pre-wrap font-medium leading-relaxed" style={{ color: epaperText, fontFamily: 'DM Mono, Courier, monospace' }}>{text}</div>
    )
  }

  return (
    <div className="relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 w-[360px] h-[360px] -translate-x-2.5 -translate-y-2.5 bg-gradient-radial from-teal-200/20 via-transparent to-transparent rounded-full blur-xl"></div>

      {/* Outer device frame with recycled texture */}
      <div className="w-[340px] h-[340px] rounded-3xl shadow-2xl p-5 relative overflow-hidden bg-gradient-to-br from-slate-300 to-slate-400">
        {/* Recycled plastic texture background */}
        <div
          className="absolute inset-0 rounded-3xl opacity-90 mix-blend-multiply"
          style={{
            backgroundImage: `url('/images/recycled-texture.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        ></div>

        {/* Additional texture overlays for depth */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-500/30 via-blue-500/20 to-emerald-500/25 mix-blend-overlay"></div>
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-transparent via-white/10 to-white/20"></div>

        {/* Subtle surface imperfections */}
        <div className="absolute top-8 right-12 w-3 h-1 bg-teal-600/20 rounded-full blur-sm"></div>
        <div className="absolute bottom-16 left-16 w-2 h-2 bg-blue-600/15 rounded-full blur-sm"></div>
        <div className="absolute top-20 left-8 w-1 h-3 bg-emerald-600/20 rounded-full blur-sm"></div>

        {/* Premium edge highlight */}
        <div className="absolute inset-2 rounded-2xl border border-white/30 pointer-events-none"></div>

        {/* Inner e-ink screen area (keep new style) */}
        <div
          className="absolute left-1/2 top-1/2 flex items-center justify-center"
          style={{
            width: 300,
            height: 300,
            transform: 'translate(-50%, -50%)',
            background: epaperScreen,
            borderRadius: 20,
            border: `1.5px solid ${epaperBorder}`,
            boxShadow: 'inset 0 2px 8px 0 #b8b5a122',
            overflow: 'hidden',
            position: 'absolute',
            zIndex: 2,
            backgroundImage: dotGrid,
            backgroundBlendMode: 'multiply',
            transition: 'filter 0.5s cubic-bezier(.4,2,.6,1)',
            filter: refreshing ? 'invert(1) brightness(1.2)' : 'none',
          }}
        >
          {/* E-paper display - clickable or menu */}
          {isMenuScreen ? (
            <div
              className="w-full h-full rounded-xl flex flex-col items-center justify-center p-6 relative overflow-hidden border"
              style={{
                borderColor: epaperBorder,
                background: 'transparent',
                fontFamily: 'DM Mono, Courier, monospace',
                color: epaperText,
                letterSpacing: '0.01em',
              }}
            >
              <div className="relative z-10 font-mono text-center leading-relaxed select-none" style={{ color: epaperText }}>
                {displayContent}
              </div>
            </div>
          ) : (
            <button
              onClick={handleTap}
              disabled={disabled}
              className={`w-full h-full rounded-xl flex flex-col items-center justify-center p-6 relative overflow-hidden transition-all duration-300 border ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
              style={{
                borderColor: epaperBorder,
                background: 'transparent',
                fontFamily: 'DM Mono, Courier, monospace',
                color: epaperText,
                letterSpacing: '0.01em',
              }}
            >
              <div className="relative z-10 font-mono text-center leading-relaxed select-none" style={{ color: epaperText }}>
                {displayContent}
              </div>
              {/* E-ink slow refresh animation: invert screen */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: refreshing ? '#44423a' : 'transparent',
                  opacity: refreshing ? 0.85 : 0,
                  transition: 'opacity 0.45s cubic-bezier(.4,2,.6,1)',
                  zIndex: 20,
                }}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

