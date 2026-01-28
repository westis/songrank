export default function Loading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
      </div>
      <p className="text-sm text-foreground-muted">{text}</p>
    </div>
  );
}
