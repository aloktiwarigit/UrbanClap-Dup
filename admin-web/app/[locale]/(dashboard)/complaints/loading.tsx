export default function ComplaintsLoading() {
  return (
    <div className="p-6 space-y-3">
      <div className="skeleton h-8 w-48 mb-4" />
      <div className="flex gap-4">
        <div className="flex-1 space-y-3">
          <div className="skeleton h-6 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
        <div className="flex-1 space-y-3">
          <div className="skeleton h-6 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
