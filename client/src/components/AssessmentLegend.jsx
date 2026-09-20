export default function AssessmentLegend() {
  return (
    <div className="rounded-xl bg-[#fff4e2] px-2 py-2 text-[#402923]">
      <div className="grid gap-1.5 text-[9px] font-semibold sm:grid-cols-3 sm:text-[10px]">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded bg-[#d6dfc4]" />
          <span>No assessments scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded bg-[#f8c99e]" />
          <span>One assessment scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded bg-[#f0b0a4]" />
          <span>Multiple assessments scheduled</span>
        </div>
      </div>
    </div>
  );
}
