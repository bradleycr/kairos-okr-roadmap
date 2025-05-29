interface DisplayBoxProps {
  text: string
}

export default function DisplayBox({ text }: DisplayBoxProps) {
  return (
    <div className="w-[250px] h-[250px] bg-gray-100 border border-black flex items-center justify-center p-4 font-mono text-sm whitespace-pre-wrap overflow-hidden">
      {text}
    </div>
  )
}
