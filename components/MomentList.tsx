import React from "react"
import type { Moment } from "@/lib/types"

/**
 * MomentList: Displays a beautiful debug panel of logged moments
 */
export default function MomentList({ moments }: { moments: Moment[] }) {
  if (!moments.length) return null
  return (
    <div className="w-full mt-10 max-w-sm mx-auto relative z-10">
      <h2 className="text-lg font-mono mb-4 text-gray-700 text-center">Debug: Logged Moments ({moments.length})</h2>
      <div className="w-full border border-gray-200/50 rounded-2xl overflow-hidden max-h-[200px] overflow-y-auto bg-white/80 backdrop-blur-sm shadow-xl">
        {moments.map((moment, index) => {
          const date = new Date(moment.timestamp)
          const timeStr = date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
          const shortDID = moment.subject.substring(0, 15) + "..."
          return (
            <div
              key={index}
              className={`p-4 font-mono text-xs border-b border-gray-100/50 last:border-b-0 ${
                index % 2 === 0 ? "bg-gray-50/50" : "bg-white/50"
              } hover:bg-teal-50/50 transition-colors duration-200`}
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">{timeStr}</span>
                <span className="text-xs text-gray-400 bg-gradient-to-r from-teal-100 to-blue-100 px-2 py-1 rounded-full">
                  #{index + 1}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1 truncate">{shortDID}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
} 