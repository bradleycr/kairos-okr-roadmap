interface DisplayBoxProps {
  text: string
}

export default function DisplayBox({ text }: DisplayBoxProps) {
  return (
    <div className="w-[250px] h-[250px] bg-muted border border-border flex items-center justify-center p-4 font-mono text-sm whitespace-pre-wrap overflow-hidden text-foreground">
      {text}
    </div>
  )
}
