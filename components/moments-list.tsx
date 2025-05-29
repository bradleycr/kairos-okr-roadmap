import type { Moment } from "@/lib/types"

interface MomentsListProps {
  moments: Moment[]
}

export default function MomentsList({ moments }: MomentsListProps) {
  return (
    <div className="w-full border-2 border-gray-200 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto bg-white shadow-lg">
      {moments.map((moment, index) => {
        const date = new Date(moment.timestamp)
        const timeStr = date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
        const shortDID = moment.subject.substring(0, 20) + "..."

        return (
          <div
            key={index}
            className={`p-4 font-mono text-sm border-b border-gray-100 last:border-b-0 ${
              index % 2 === 0 ? "bg-gray-50" : "bg-white"
            } hover:bg-gray-100 transition-colors duration-150`}
          >
            <div className="flex justify-between items-center">
              <span className="text-gray-700 font-semibold">{timeStr}</span>
              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded-full">#{index + 1}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2 truncate">{shortDID}</div>
          </div>
        )
      })}
    </div>
  )
}
