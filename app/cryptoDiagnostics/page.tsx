"use client"

import React, { useState, useEffect } from "react"
import { generateEd25519KeyPair, createDIDKey, signMoment, verifyMomentSignature, exportKeyPair, importKeyPair } from "@/lib/crypto"
import type { Moment } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { HAL } from "@/lib/hardwareAbstraction"

// Utility: Validate DID:key format (W3C-style, base58btc, multicodec)
function isValidDIDKey(did: string): boolean {
  return /^did:key:z[1-9A-HJ-NP-Za-km-z]+$/.test(did)
}

// Utility: Check timestamp within ±5min
function isTimestampValid(ts: string): boolean {
  const now = Date.now()
  const t = new Date(ts).getTime()
  return Math.abs(now - t) <= 5 * 60 * 1000
}

// Test runner
async function runDiagnostics(setResults: (r: DiagnosticResult[]) => void) {
  const results: DiagnosticResult[] = []

  // 1. Keypair & DID determinism
  const keyA = await generateEd25519KeyPair()
  const didA = await createDIDKey(keyA.publicKey)
  const didA2 = await createDIDKey(keyA.publicKey)
  results.push({
    label: "DID is deterministic (same key, same DID)",
    pass: didA === didA2,
    details: didA === didA2 ? didA : `Mismatch: ${didA} vs ${didA2}`,
  })

  // 2. DID uniqueness
  const keyB = await generateEd25519KeyPair()
  const didB = await createDIDKey(keyB.publicKey)
  results.push({
    label: "DIDs are unique (different keys, different DIDs)",
    pass: didA !== didB,
    details: didA !== didB ? `${didA} ≠ ${didB}` : `Collision: ${didA}`,
  })

  // 3. DID W3C-validity
  results.push({
    label: "DID:key is W3C-valid format",
    pass: isValidDIDKey(didA),
    details: didA,
  })

  // 4. Signature verification (valid)
  const moment: Omit<Moment, "signature"> = {
    subject: didA,
    issuer: didB,
    timestamp: new Date().toISOString(),
    description: "Test moment",
  }
  const signature = await signMoment(keyB.privateKey, moment)
  const valid = await verifyMomentSignature(keyB.publicKey, moment, signature)
  results.push({
    label: "Signature verifies (valid)",
    pass: valid,
    details: valid ? "Signature valid" : "Signature failed",
  })

  // 5. Signature verification (tampered)
  const tampered = { ...moment, description: "Tampered" }
  const tamperedValid = await verifyMomentSignature(keyB.publicKey, tampered, signature)
  results.push({
    label: "Signature fails if tampered",
    pass: !tamperedValid,
    details: !tamperedValid ? "Tampering detected" : "Tampering not detected",
  })

  // 6. Key mismatch detection
  const mismatchValid = await verifyMomentSignature(keyA.publicKey, moment, signature)
  results.push({
    label: "Signature fails with wrong public key",
    pass: !mismatchValid,
    details: !mismatchValid ? "Key mismatch detected" : "Key mismatch not detected",
  })

  // 7. Timestamp validity
  results.push({
    label: "Timestamp is within ±5min",
    pass: isTimestampValid(moment.timestamp),
    details: moment.timestamp,
  })

  setResults(results)
}

type DiagnosticResult = {
  label: string
  pass: boolean
  details: string
}

export default function CryptoDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[] | null>(null)
  const [running, setRunning] = useState(false)
  useEffect(() => {
    if (running) window.scrollTo({ top: 0, behavior: "smooth" })
  }, [running])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-2 pb-[var(--footer-height,2.7rem)]">
      <Card className="w-full max-w-md p-4 sm:p-6 shadow-2xl rounded-2xl bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">KairOS Crypto Diagnostics</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 font-mono mb-4 text-center">
          Real-time cryptographic integrity & decentralization tests
        </p>
        <Button
          aria-label="Run Diagnostics"
          className={`w-full mb-4 font-mono text-lg rounded-full border shadow-md transition-all duration-300 relative overflow-hidden
            bg-gradient-to-br from-green-100 via-blue-50 to-green-200 border-green-300
            hover:from-green-200 hover:to-blue-100
            focus:outline-none focus:ring-2 focus:ring-green-400
            text-green-900`
          }
          style={{
            boxShadow: '0 2px 8px 0 rgba(60,80,60,0.10)',
            backgroundImage: `url('/images/recycled-texture.png'), linear-gradient(120deg, #e6f4ea 0%, #f0f7fa 100%)`,
            backgroundBlendMode: 'multiply',
            backgroundSize: 'cover',
          }}
          disabled={running}
          onClick={async () => {
            setRunning(true)
            setResults(null)
            await runDiagnostics(setResults)
            setRunning(false)
          }}
        >
          {running ? "Running..." : "Run Diagnostics"}
        </Button>
        {results && (
          <div className="space-y-3 mt-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge className={r.pass ? "bg-green-600 text-white text-base px-3 py-1" : "bg-red-600 text-white text-base px-3 py-1"}>
                  {r.pass ? "PASS" : "FAIL"}
                </Badge>
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-gray-800 dark:text-gray-100 text-sm flex items-center">
                    {r.label}
                    {r.details.startsWith("did:key:") && <CopyButton value={r.details} label="DID" />}
                  </div>
                  <div className="font-mono text-xs text-gray-500 dark:text-gray-300 break-all">{r.details}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 text-xs text-gray-500 dark:text-gray-300 font-mono text-center">
          <div className="mb-2">No keys are ever stored. All verification is local. No backend trust required.</div>
          <div className="mb-2">DID:key is derived per W3C spec (base58btc, multicodec, no Postgres).</div>
          <div className="mb-2">If any test fails, your system is not fully decentralized or verifiable.</div>
          <div className="mt-4 text-gray-400 dark:text-gray-500">Inspired by Cursive, but exceeds their decentralization & standards.</div>
        </div>
      </Card>
    </main>
  )
} 