interface WearableDisplayProps {
  text: string
}

export default function WearableDisplay({ text }: WearableDisplayProps) {
  return (
    <div className="relative">
      {/* Outer recycled plastic frame */}
      <div className="w-[320px] h-[320px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl shadow-lg p-3 relative">
        {/* Recycled plastic texture overlay */}
        <div className="absolute inset-0 rounded-3xl opacity-20 bg-gradient-to-br from-green-100 to-blue-100"></div>

        {/* Inner e-paper display */}
        <div className="w-[296px] h-[296px] bg-gray-100 rounded-2xl shadow-inner border border-gray-200 flex items-center justify-center p-6 relative overflow-hidden">
          {/* E-paper screen effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-150 opacity-50"></div>

          {/* Display text */}
          <div className="relative z-10 font-mono text-sm text-gray-800 whitespace-pre-wrap text-center leading-relaxed">
            {text}
          </div>
        </div>

        {/* Subtle wear indicators on the frame */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-gray-400 rounded-full opacity-30"></div>
        <div className="absolute bottom-6 left-6 w-1 h-1 bg-gray-400 rounded-full opacity-20"></div>
      </div>
    </div>
  )
}
