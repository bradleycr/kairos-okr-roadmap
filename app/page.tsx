// --- KairOS Home: The Heart of the Wearable Simulation ---
// Modular, cross-platform, and ready for ESP32 porting.

"use client"

import { useEffect, useState, Fragment, useCallback } from "react"
import { generateEd25519KeyPair, createDIDKey, signMoment } from "@/lib/crypto"
import type { Moment } from "@/lib/types"
import { HAL } from "@/lib/hardwareAbstraction"
import Header from "@/components/Header"
import WearableSection from "@/components/WearableSection"
import MomentList from "@/components/MomentList"
import { Dialog, Transition } from "@headlessui/react"
import QRCodeDisplay from "@/components/qr-code-display"

// --- Types for multi-user/group simulation ---
interface SimUser {
  did: string
  keyPair: { privateKey: CryptoKey; publicKey: CryptoKey }
  moments: Moment[]
}

export default function KairOSHome() {
  // --- Multi-user/group state ---
  const [users, setUsers] = useState<SimUser[]>([])
  const [activeUserIdx, setActiveUserIdx] = useState<number | null>(null)
  const [group, setGroup] = useState<number[]>([])
  const [showPrompt, setShowPrompt] = useState(false)
  const [pendingUser, setPendingUser] = useState<SimUser | null>(null)
  const [showTapModal, setShowTapModal] = useState(false)
  const [userKeyPair, setUserKeyPair] = useState<{ privateKey: CryptoKey; publicKey: CryptoKey } | null>(null)
  const [userDID, setUserDID] = useState<string>("")
  const [issuerKeyPair, setIssuerKeyPair] = useState<{ privateKey: CryptoKey; publicKey: CryptoKey } | null>(null)
  const [issuerDID, setIssuerDID] = useState<string>("")
  const [displayText, setDisplayText] = useState<string>("Tap me")
  const [moments, setMoments] = useState<Moment[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const [displayState, setDisplayState] = useState<"default" | "identity" | "moment">("default")
  const [screen, setScreen] = useState<string>("main")
  const [screenData, setScreenData] = useState<any>(null)

  // --- Device Responsiveness ---
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // --- Helper: Find user by DID ---
  const findUserIdx = useCallback((did: string) => users.findIndex(u => u.did === did), [users])

  // --- Initialization: Issuer and Session ---
  useEffect(() => {
    const initializeIssuerAndSession = async () => {
      try {
        const issuerKeys = await generateEd25519KeyPair()
        const issuerDid = await createDIDKey(issuerKeys.publicKey)
        setIssuerKeyPair(issuerKeys)
        setIssuerDID(issuerDid)
        setIsInitialized(true)
      } catch (error) {
        HAL.display.show({ type: "notification", message: "Initialization error", level: "error" })
      }
    }
    initializeIssuerAndSession()
  }, [])

  // --- Simulate NFC tap (simulatePendant) ---
  const handleSimulatePendant = async () => {
    // Simulate reading a new NFC DID
    const userKeys = await generateEd25519KeyPair()
    const did = await createDIDKey(userKeys.publicKey)
    const idx = findUserIdx(did)
    if (users.length === 0) {
      // No user logged in, log in this user
      const newUser: SimUser = { did, keyPair: userKeys, moments: [] }
      setUsers([newUser])
      setActiveUserIdx(0)
      setGroup([0])
      setDisplayState("identity")
      setDisplayText(`DID created\n\n${did.substring(0, 20)}...\n\nReady to save a moment`)
      setScreen("momentOptions")
      setScreenData({ did })
    } else {
      // User already logged in, show conflict screen
      setPendingUser({ did, keyPair: userKeys, moments: [] })
      setScreen("userConflict")
      setScreenData({ did })
    }
  }

  // --- Handle user conflict actions ---
  const handleUserConflict = (action: "logout" | "bond" | "cancel") => {
    if (!pendingUser) return
    if (action === "logout") {
      // Log out previous, log in new user
      setUsers([pendingUser])
      setActiveUserIdx(0)
      setGroup([0])
      setDisplayState("identity")
      setDisplayText(`DID created\n\n${pendingUser.did.substring(0, 20)}...\n\nReady to save a moment`)
      setScreen("momentOptions")
      setScreenData({ did: pendingUser.did })
      setPendingUser(null)
    } else if (action === "bond") {
      // Add to group, show bonding success
      setUsers(prev => [...prev, pendingUser])
      setGroup(prev => [...prev, users.length])
      setScreen("bondingSuccess")
      setScreenData({ did: pendingUser.did })
      setPendingUser(null)
      // Optionally, auto-return to main after 2s
      setTimeout(() => {
        setScreen("main")
        setScreenData(null)
      }, 2000)
    } else if (action === "cancel") {
      setScreen("main")
      setScreenData(null)
      setPendingUser(null)
    }
  }

  // --- Handle moment options actions ---
  const handleMomentOptions = async (action: "save" | "cancel") => {
    if (action === "save") {
      await handleLogMoment()
      setScreen("main")
      setScreenData(null)
    } else if (action === "cancel") {
      setScreen("main")
      setScreenData(null)
    }
  }

  // --- Simulate tap to log a moment ---
  const handleLogMoment = async () => {
    // If no users or no active user, treat as first tap
    if (users.length === 0 || activeUserIdx === null) {
      await handleSimulatePendant()
      return
    }
    if (activeUserIdx === null || !issuerKeyPair || !issuerDID) return
    const user = users[activeUserIdx]
    try {
      const timestamp = new Date().toISOString()
      const momentObj = {
        subject: user.did,
        issuer: issuerDID,
        timestamp,
        description: "Moment logged via KairOS",
      }
      const signature = await signMoment(issuerKeyPair.privateKey, momentObj)
      const moment: Moment = { ...momentObj, signature }
      setUsers(prev => prev.map((u, i) => i === activeUserIdx ? { ...u, moments: [...u.moments, moment] } : u))
      const timeDisplay = new Date(moment.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
      setDisplayState("moment")
      HAL.display.show({ type: "notification", message: `Moment saved at ${timeDisplay}`, level: "info" })
      setDisplayText(
        `moment saved\n\n${timeDisplay} — ${user.did.substring(0, 15)}...\n\nTap again to log`
      )
    } catch (error) {
      HAL.display.show({ type: "notification", message: "Error logging moment. Please try again.", level: "error" })
      setDisplayText("❌ Error\n\nPlease try again")
    }
  }

  // --- Register input handler with HAL ---
  useEffect(() => {
    HAL.input.onAction(async (action, payload) => {
      // Home screen tap
      if (screen === "main" && action === "tap") {
        // Simulate NFC tap
        await handleSimulatePendant()
        return
      }
      // Moment options
      if (screen === "momentOptions") {
        if (action === "save") {
          await handleMomentOptions("save")
        } else if (action === "cancel") {
          await handleMomentOptions("cancel")
        }
        return
      }
      // User conflict
      if (screen === "userConflict") {
        if (action === "logout") {
          handleUserConflict("logout")
        } else if (action === "bond") {
          handleUserConflict("bond")
        } else if (action === "cancel") {
          handleUserConflict("cancel")
        }
        return
      }
      // Bonding success
      if (screen === "bondingSuccess" && action === "tap") {
        setScreen("main")
        setScreenData(null)
        return
      }
    })
    // eslint-disable-next-line
  }, [users, activeUserIdx, group, pendingUser, screen])

  // --- Unified tap handler: now just triggers HAL.input ---
  const handleTap = () => {
    HAL.input.trigger("tap")
  }

  // --- Render: Modular, beautiful, and cross-platform ---
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 pt-8 max-w-lg mx-auto bg-gradient-to-br from-slate-50 via-gray-50 to-teal-50 pb-[var(--footer-height,2.7rem)]">
      {/* Ambient background elements for a soft, modern wearable feel */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
      </div>
      <Header />
      <WearableSection
        displayText={displayText}
        onTap={handleTap}
        disabled={!isInitialized}
        displayState={displayState}
        isMobile={isMobile}
        isInitialized={isInitialized}
        sessionId={""}
        screen={screen}
        screenData={screenData}
      />
      {/* Show all active users and group status */}
      <div className="mt-6 text-center w-full max-w-md">
        {users.length > 0 && (
          <div className="rounded-xl bg-[#f5f3ef] border border-[#b8a98a] p-4 font-mono text-xs text-[#3a2e1a] whitespace-pre-wrap">
            <span className="block font-bold mb-1">Active Users:</span>
            {users.map((u, i) => (
              <div key={u.did} className={i === activeUserIdx ? "font-bold text-[#2d2a22]" : ""}>
                {i === activeUserIdx && <span className="mr-1">⭐</span>}{u.did.substring(0, 24)}... ({u.moments.length} moments)
              </div>
            ))}
            {group.length > 1 && (
              <div className="mt-2 font-bold text-[#6b5c3a]">Bonded Group: {group.length} users</div>
            )}
          </div>
        )}
      </div>
      <MomentList moments={activeUserIdx !== null ? users[activeUserIdx]?.moments || [] : []} />
    </main>
  )
}
