import { NextRequest, NextResponse } from 'next/server'

// --- Simulation State ---
// All state is managed here to ensure a unified, elegant wearable simulation experience.
// Each variable represents a piece of the simulated device's ephemeral memory.

type Session = {
  id: string
  createdAt: number
  data?: any
}

// In-memory session store (replace with Redis/DB for production)
const sessions = new Map<string, Session>()

// --- Welcome Message ---
// This is the first thing a user sees: a poetic invitation to a new digital experience.

// POST /api/session - create a new session
// --- Initialization: Always start in welcome state ---
// This effect ensures the simulation always begins as a "blank" wearable, ready for its first moment.
export async function POST(req: NextRequest) {
  const id = Math.random().toString(36).slice(2)
  const session: Session = { id, createdAt: Date.now() }
  sessions.set(id, session)
  return NextResponse.json({ id })
}

// GET /api/session?id=SESSION_ID - fetch session
// --- Begin Simulation: Tap or QR triggers this ---
// This function simulates the wearable's first pairing: a new DID is born, ready to log moments.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id || !sessions.has(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(sessions.get(id))
}

// PATCH /api/session?id=SESSION_ID - update session
// --- Simulate New Pendant: Each tap is a new digital artifact ---
// This function allows the user to simulate pairing a brand new pendant (NFC tag)
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id || !sessions.has(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const data = await req.json()
  const session = sessions.get(id)!
  session.data = { ...session.data, ...data }
  sessions.set(id, session)
  return NextResponse.json(session)
}

// --- Log a Moment: Each tap is a memory, cryptographically signed ---
// This function simulates the act of saving a "moment" on the wearable, signed by the device.
// (Note: In this API, moment logging would be handled by a separate endpoint or in the client logic.)

// --- Render: The simulated wearable face ---
// The UI below is designed to evoke the feeling of a real e-paper wearable, with a poetic, human-first touch.
// (Note: Rendering is handled in the client, not in this API route.) 