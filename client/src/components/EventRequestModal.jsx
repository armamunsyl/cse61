import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { EVENT_TYPES } from "../constants.js";
import { api } from "../services/api.js";
import { displayTime, formatDate } from "../utils/date.js";

const baseForm = {
  type: "quiz",
  title: "",
  subjectName: "",
  subjectCode: "",
  date: "",
  startTime: "",
  endTime: "",
  marks: "",
  syllabus: "",
  details: "",
  proposerName: "",
  proposerIdentity: "",
  routineSlotId: ""
};

export default function EventRequestModal({ slot, onClose, onCreated }) {
  const [form, setForm] = useState(baseForm);
  const [stats, setStats] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const needsMarks = form.type === "quiz" || form.type === "ct";

  useEffect(() => {
    if (!slot) return;
    setForm({
      ...baseForm,
      title: slot.classItem ? `${slot.classItem.subjectCode} Quiz` : "",
      subjectName: slot.classItem?.subjectName || "",
      subjectCode: slot.classItem?.subjectCode || "",
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      routineSlotId: slot.classItem?.routineSlotId || ""
    });
    setSuccess("");
    setError("");
  }, [slot]);

  useEffect(() => {
    if (!slot) return;
    api
      .getPlanningStats({ date: form.date, startTime: form.startTime, endTime: form.endTime })
      .then(setStats)
      .catch(() => setStats(null));
  }, [slot, form.date, form.startTime, form.endTime]);

  const selectedType = useMemo(() => EVENT_TYPES.find((item) => item.value === form.type), [form.type]);
  if (!slot) return null;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await api.createRequest(form);
      setSuccess("Request submitted. It will appear on the calendar after admin approval.");
      onCreated?.();
    } catch (err) {
      setError(err.message || "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
      <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden rounded-md bg-white shadow-soft">
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-forest">{formatDate(slot.date, "EEEE, MMM d")}</p>
            <h2 className="text-lg font-semibold">Propose an event</h2>
            <p className="text-sm text-slate-600">{displayTime(slot.startTime)} - {displayTime(slot.endTime)}</p>
          </div>
          <button className="focus-ring grid h-9 w-9 place-items-center rounded-md hover:bg-slate-100" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <form className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin" onSubmit={submit}>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map((type) => (
              <button
                type="button"
                key={type.value}
                className={`focus-ring rounded-md border px-3 py-2 text-sm font-medium ${
                  form.type === type.value ? "border-forest bg-teal-50 text-forest" : "border-line bg-white hover:bg-slate-50"
                }`}
                onClick={() => update("type", type.value)}
              >
                {type.label}
              </button>
            ))}
          </div>

          {stats && (
            <div className="mt-4 space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              <p className="flex items-center gap-2"><AlertTriangle size={16} /> This day already has {stats.pressure.day} assessment(s).</p>
              <p>This week has {stats.pressure.week} assessment(s).</p>
              {stats.conflicts.length > 0 && <p>{stats.conflicts.length} approved event(s) overlap this time.</p>}
            </div>
          )}

          {success && <div className="mt-4 flex gap-2 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900"><CheckCircle size={16} /> {success}</div>}
          {error && <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Event type
              <select className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.type} onChange={(e) => update("type", e.target.value)}>
                {EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">
              Title
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder={selectedType?.label} required />
            </label>
            <label className="text-sm font-medium">
              Subject
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.subjectName} onChange={(e) => update("subjectName", e.target.value)} />
            </label>
            <label className="text-sm font-medium">
              Subject code
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.subjectCode} onChange={(e) => update("subjectCode", e.target.value)} />
            </label>
            <label className="text-sm font-medium">
              Date
              <input type="date" className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.date} onChange={(e) => update("date", e.target.value)} required />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium">
                Start
                <input type="time" className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.startTime} onChange={(e) => update("startTime", e.target.value)} required />
              </label>
              <label className="text-sm font-medium">
                End
                <input type="time" className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.endTime} onChange={(e) => update("endTime", e.target.value)} required />
              </label>
            </div>
            {needsMarks && (
              <label className="text-sm font-medium">
                Marks
                <input type="number" min="0" max="100" className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.marks} onChange={(e) => update("marks", e.target.value)} />
              </label>
            )}
            {needsMarks && (
              <label className="text-sm font-medium sm:col-span-2">
                Syllabus
                <textarea className="mt-1 min-h-20 w-full rounded-md border border-line px-3 py-2" value={form.syllabus} onChange={(e) => update("syllabus", e.target.value)} />
              </label>
            )}
            <label className="text-sm font-medium sm:col-span-2">
              Details
              <textarea className="mt-1 min-h-20 w-full rounded-md border border-line px-3 py-2" value={form.details} onChange={(e) => update("details", e.target.value)} />
            </label>
            <label className="text-sm font-medium">
              Your name
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.proposerName} onChange={(e) => update("proposerName", e.target.value)} required />
            </label>
            <label className="text-sm font-medium">
              ID or identity
              <input className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.proposerIdentity} onChange={(e) => update("proposerIdentity", e.target.value)} required />
            </label>
          </div>
          <div className="sticky bottom-0 mt-5 flex justify-end gap-2 border-t border-line bg-white py-4">
            <button type="button" className="focus-ring rounded-md border border-line px-4 py-2 text-sm font-medium" onClick={onClose}>Cancel</button>
            <button className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
