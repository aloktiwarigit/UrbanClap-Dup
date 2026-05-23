export default function TechniciansLoading() {
  return (
    <div className="p-6 space-y-3">
      <div className="skeleton h-8 w-48 mb-4" />
      <div className="skeleton h-10 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton h-14 w-full" />
      ))}
    </div>
  );
}
