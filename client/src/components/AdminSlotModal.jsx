import { useEffect, useState } from "react";
import { Save, Trash2, X } from "lucide-react";
import { EVENT_TYPES } from "../constants.js";
import { api } from "../services/api.js";
import { formatDate } from "../utils/date.js";

const emptyEvent = {
  type: "ct",
  title: "",
  subjectName: "",
  subjectCode: "",
  date: "",
  startTime: "",
  endTime: "",
  marks: "",
  syllabus: "",
  details: "",
  routineSlotId: ""
};

function formFromEvent(event) {
  return {
    ...emptyEvent,
    ...event,
    marks: event?.marks ?? "",
    routineSlotId: event?.routineSlotId || ""
  };
}

function formFromSlot(slot) {
  const classItem = slot?.classItem || slot?.classes?.[0] || {};
  const subjectCode = classItem.subjectCode || "";
  return {
    ...emptyEvent,
    title: subjectCode ? `${subjectCode} CT` : "",
    subjectName: classItem.subjectName || "",
    subjectCode,
    date: slot?.date || "",
    startTime: slot?.startTime || "",
    endTime: slot?.endTime || "",
    routineSlotId: classItem.routineSlotId || ""
  };
}

function titleForForm(form) {
  const typeLabel = EVENT_TYPES.find((type) => type.value === form.type)?.label || "Event";
  const subject = form.subjectName || form.subjectCode || "Assessment";
  return `${subject} ${typeLabel}`.trim();
}

export default function AdminSlotModal({ slot, onClose, onChanged }) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [form, setForm] = useState(emptyEvent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const events = slot?.events || [];
  const selectedEvent = events.find((event) => event._id === selectedEventId) || events[0];
  const needsMarks = form.type === "quiz" || form.type === "ct";
  const classItem = slot?.classItem || slot?.classes?.[0];
  const canEditSubject = !classItem;

  useEffect(() => {
    if (!slot) return;
    const firstEvent = slot.events?.[0];
    setSelectedEventId(firstEvent?._id || "");
    setForm(firstEvent ? formFromEvent(firstEvent) : formFromSlot(slot));
    setError("");
  }, [slot]);

  useEffect(() => {
    if (!selectedEvent) return;
    setForm(formFromEvent(selectedEvent));
  }, [selectedEvent]);

  if (!slot) return null;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      title: titleForForm(form),
      subjectName: form.subjectName || classItem?.subjectName || "",
      subjectCode: form.subjectCode || classItem?.subjectCode || "",
      date: form.date || slot.date,
      startTime: form.startTime || slot.startTime,
      endTime: form.endTime || slot.endTime,
      routineSlotId: form.routineSlotId || classItem?.routineSlotId || ""
    };
    try {
      if (selectedEvent) {
        await api.updateEvent(selectedEvent._id, payload);
      } else {
        await api.createEvent(payload);
      }
      await onChanged?.();
      onClose();
    } catch (err) {
      setError(err.message || "Could not update event");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selectedEvent || !window.confirm("Delete this assessment/event?")) return;
    setSaving(true);
    setError("");
    try {
      await api.deleteEvent(selectedEvent._id);
      await onChanged?.();
      onClose();
    } catch (err) {
      setError(err.message || "Could not delete event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
      <div className="flex max-h-[86vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-soft sm:max-w-md">
        <div className="flex items-start justify-between border-b border-line px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-black text-forest">{formatDate(slot.date, "EEEE, MMM d")}</p>
            <h2 className="truncate text-base font-black">{selectedEvent ? "Edit assessment" : "Add assessment"}</h2>
            {classItem && <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{classItem.subjectCode || classItem.subjectName}</p>}
          </div>
          <button className="focus-ring grid h-8 w-8 place-items-center rounded-md hover:bg-slate-100" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              {events.length > 1 && (
                <label className="block text-xs font-bold">
                  Event
                  <select
                    className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm"
                    value={selectedEventId}
                    onChange={(event) => setSelectedEventId(event.target.value)}
                  >
                    {events.map((event) => (
                      <option key={event._id} value={event._id}>{event.title}</option>
                    ))}
                  </select>
                </label>
              )}

              {error && <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}

              <div className="grid gap-3">
                <label className="text-xs font-bold">
                  Type
                  <select className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" value={form.type} onChange={(event) => update("type", event.target.value)}>
                    {EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                {canEditSubject && <Field label="Subject" value={form.subjectName} onChange={(value) => update("subjectName", value)} />}
                {needsMarks && <Field type="number" label="Marks" value={form.marks} onChange={(value) => update("marks", value)} />}
                <Field label="Syllabus" value={form.syllabus} onChange={(value) => update("syllabus", value)} />
                <label className="text-xs font-bold">
                  Details
                  <textarea className="mt-1 min-h-16 w-full rounded-lg border border-line px-3 py-2 text-sm" value={form.details || ""} onChange={(event) => update("details", event.target.value)} />
                </label>
              </div>
            </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-4 py-3">
          <button className="focus-ring rounded-lg border border-line px-3 py-2 text-xs font-bold" onClick={onClose}>Cancel</button>
          {selectedEvent && (
            <>
              <button className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700" onClick={remove} disabled={saving}>
                <Trash2 size={14} /> Delete
              </button>
            </>
          )}
          <button className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white disabled:opacity-60" onClick={save} disabled={saving}>
            <Save size={14} /> {saving ? "Saving..." : selectedEvent ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="text-xs font-bold">
      {label}
      <input type={type} className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm" value={value || ""} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
