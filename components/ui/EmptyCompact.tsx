export default function EmptyCompact({ text }: { text: string }) {
  return (
    <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground bg-white">
      {text}
    </div>
  );
}


