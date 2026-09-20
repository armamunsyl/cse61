import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import AssessmentList from "../components/AssessmentList.jsx";
import StateBlock from "../components/StateBlock.jsx";
import { useAsync } from "../hooks/useAsync.js";
import { api } from "../services/api.js";
import { addMonthsISO, todayISO } from "../utils/date.js";
import { markNotificationsRead } from "../utils/pwa.js";

export default function AssessmentsPage() {
  const [monthAnchor, setMonthAnchor] = useState(todayISO());
  const month = useAsync(() => api.getMonth(monthAnchor), [monthAnchor]);

  useEffect(() => {
    if (month.data) {
      markNotificationsRead();
    }
  }, [month.data]);

  return (
    <div className="mx-auto max-w-3xl px-3 py-3 sm:px-4 lg:px-6">
      <div className="mb-2 flex items-center justify-end gap-2 rounded-md border border-line bg-white px-3 py-2 shadow-soft">
        <button
          className="focus-ring grid h-8 w-8 place-items-center rounded-md border border-line hover:bg-slate-50"
          onClick={() => setMonthAnchor((current) => addMonthsISO(current, -1))}
          title="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          className="focus-ring grid h-8 w-8 place-items-center rounded-md border border-line hover:bg-slate-50"
          onClick={() => setMonthAnchor((current) => addMonthsISO(current, 1))}
          title="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {month.loading && <StateBlock title="Loading assessments..." />}
      {month.error && <StateBlock title="Could not load assessments" message={month.error} />}
      {month.data && <AssessmentList month={month.data} />}
    </div>
  );
}
