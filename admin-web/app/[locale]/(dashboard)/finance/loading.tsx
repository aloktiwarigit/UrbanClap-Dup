export default function FinanceLoading() {
  return (
    <div className="p-6 space-y-4">
      <div className="skeleton h-8 w-48 mb-2" />
      <div className="skeleton h-64 w-full" />
      <div className="skeleton h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="skeleton h-12 w-full" />
      ))}
    </div>
  );
}
