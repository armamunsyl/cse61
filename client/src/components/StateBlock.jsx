export default function StateBlock({ title, message }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {message && <p className="mt-1 text-sm text-slate-600">{message}</p>}
    </div>
  );
}
