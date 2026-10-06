/** Simple centered spinner shown while a lazy route chunk loads. */
export default function RouteFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Loading">
      <div className="h-10 w-10 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );
}
