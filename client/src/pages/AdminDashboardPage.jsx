import { CalendarClock, Check, ClipboardList, History, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import StateBlock from "../components/StateBlock.jsx";
import { EVENT_TYPES, WEEKDAYS } from "../constants.js";
import { api } from "../services/api.js";
import { displayTime, formatDate, todayISO } from "../utils/date.js";

const emptyEvent = {
  type: "quiz",
  title: "",
  subjectName: "",
  subjectCode: "",
  date: todayISO(),
  startTime: "09:00",
  endTime: "10:30",
  marks: "",
  syllabus: "",
  details: "",
  routineSlotId: ""
};

const emptyRoutine = {
  subjectName: "",
  subjectCode: "",
  teacherName: "",
  room: "",
  weekday: 0,
  startTime: "09:00",
  endTime: "10:30",
  color: "#2563eb",
  isActive: true
};

export default function AdminDashboardPage() {
  const [tab, setTab] = useState("requests");
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [routine, setRoutine] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAll() {
    setError("");
    try {
      const [dash, req, evt, rou, exc] = await Promise.all([
        api.adminDashboard(),
        api.adminRequests(),
        api.adminEvents(),
        api.adminRoutine(),
        api.exceptions()
      ]);
      setDashboard(dash);
      setRequests(req.requests);
      setEvents(evt.events);
      setRoutine(rou.routine);
      setExceptions(exc.exceptions);
    } catch (err) {
      setError(err.message || "Could not load admin data");
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const tabs = [
    ["requests", "Requests"],
    ["events", "Events"],
    ["routine", "Routine"],
    ["exceptions", "Exceptions"]
  ];

  async function run(action, success) {
    setMessage("");
    setError("");
    try {
      await action();
      setMessage(success);
      await loadAll();
    } catch (err) {
      setError(err.message || "Action failed");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-forest">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold">Schedule dashboard</h1>
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric label="Pending" value={dashboard?.counts?.pending ?? "-"} />
            <Metric label="Approved" value={dashboard?.counts?.approved ?? "-"} />
            <Metric label="Rejected" value={dashboard?.counts?.rejected ?? "-"} />
          </div>
          <button
            type="button"
            className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            onClick={() => run(() => api.sendTestPush(), "Test notification queued")}
          >
            Send Test Notification
          </button>
        </div>
      </div>

      {message && <div className="mb-4 rounded-md border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">{message}</div>}
      {error && <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            className={`focus-ring rounded-md border px-4 py-2 text-sm font-semibold ${
              tab === value ? "border-ink bg-ink text-white" : "border-line bg-white hover:bg-slate-50"
            }`}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          {tab === "requests" && <RequestsPanel requests={requests} run={run} />}
          {tab === "events" && <EventsPanel events={events} run={run} />}
          {tab === "routine" && <RoutinePanel routine={routine} run={run} />}
          {tab === "exceptions" && <ExceptionsPanel exceptions={exceptions} routine={routine} run={run} />}
        </section>
        <aside className="space-y-4">
          <section className="rounded-md border border-line bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2 font-semibold"><CalendarClock size={18} /> Upcoming</div>
            <div className="space-y-3">
              {(dashboard?.upcomingAssessments || []).map((item) => (
                <div key={item._id} className="rounded-md border border-line p-3 text-sm">
                  <div className="font-semibold">{item.title}</div>
                  <div className="mt-1 text-slate-600">{formatDate(item.date)} · {displayTime(item.startTime)}</div>
                </div>
              ))}
              {dashboard?.upcomingAssessments?.length === 0 && <StateBlock title="No upcoming assessments" />}
            </div>
          </section>
          <section className="rounded-md border border-line bg-white p-4 shadow-soft">
            <div className="mb-3 flex items-center gap-2 font-semibold"><History size={18} /> Recent activity</div>
            <div className="space-y-3 text-sm">
              {(dashboard?.recentActivity || []).map((item) => (
                <div key={item._id} className="border-b border-line pb-2 last:border-0">
                  <div>{item.message}</div>
                  <div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-line bg-white px-4 py-3 shadow-soft">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function RequestsPanel({ requests, run }) {
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(emptyEvent);

  function startEdit(item) {
    setEditingId(item._id);
    setEditForm({ ...emptyEvent, ...item, marks: item.marks || "" });
  }

  function stopEdit() {
    setEditingId("");
    setEditForm(emptyEvent);
  }

  return (
    <div className="rounded-md border border-line bg-white shadow-soft">
      <PanelTitle icon={<ClipboardList size={18} />} title="Event requests" />
      <div className="divide-y divide-line">
        {requests.map((item) => (
          <div key={item._id} className="p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{item.title}</h3>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold uppercase">{item.status}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {item.subjectCode || item.subjectName || item.type} · {formatDate(item.date)} · {displayTime(item.startTime)} - {displayTime(item.endTime)}
                </p>
                <p className="mt-1 text-sm text-slate-600">Proposed by {item.proposerName} · {item.proposerIdentity}</p>
              </div>
              {item.status === "pending" && (
                <div className="flex gap-2">
                  <button className="focus-ring inline-flex items-center gap-1 rounded-md bg-forest px-3 py-2 text-sm font-semibold text-white" onClick={() => run(() => api.approveRequest(item._id), "Request approved")}>
                    <Check size={16} /> Approve
                  </button>
                  <button className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-line" title="Edit before approval" onClick={() => startEdit(item)}>
                    <Pencil size={16} />
                  </button>
                  <button className="focus-ring inline-flex items-center gap-1 rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={() => run(() => api.rejectRequest(item._id, "Rejected by admin"), "Request rejected")}>
                    <X size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
            {editingId === item._id && (
              <div className="mt-4 rounded-md border border-line bg-slate-50 p-3">
                <EventFields
                  form={editForm}
                  setForm={setEditForm}
                  needsMarks={editForm.type === "quiz" || editForm.type === "ct"}
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold" onClick={stopEdit}>Cancel</button>
                  <button
                    className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
                    onClick={() => run(() => api.approveRequest(item._id, editForm), "Edited request approved").then(stopEdit)}
                  >
                    <Check size={16} /> Approve edits
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {requests.length === 0 && <div className="p-4"><StateBlock title="No requests yet" /></div>}
      </div>
    </div>
  );
}

function EventsPanel({ events, run }) {
  const [form, setForm] = useState(emptyEvent);
  const [editingId, setEditingId] = useState("");
  const needsMarks = form.type === "quiz" || form.type === "ct";

  function edit(item) {
    setEditingId(item._id);
    setForm({ ...emptyEvent, ...item, marks: item.marks || "" });
  }

  function reset() {
    setEditingId("");
    setForm(emptyEvent);
  }

  return (
    <div className="space-y-4">
      <FormShell title={editingId ? "Edit event" : "Create event"}>
        <EventFields form={form} setForm={setForm} needsMarks={needsMarks} />
        <div className="flex justify-end gap-2">
          {editingId && <button className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={reset}>Cancel</button>}
          <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" onClick={() => run(() => editingId ? api.updateEvent(editingId, form) : api.createEvent(form), editingId ? "Event updated" : "Event created").then(reset)}>
            <Save size={16} /> Save
          </button>
        </div>
      </FormShell>
      <div className="rounded-md border border-line bg-white shadow-soft">
        <PanelTitle icon={<CalendarClock size={18} />} title="Approved events" />
        <div className="divide-y divide-line">
          {events.map((item) => (
            <ListRow key={item._id} title={item.title} meta={`${formatDate(item.date)} · ${displayTime(item.startTime)} · ${item.type}`}>
              <IconButton title="Edit" onClick={() => edit(item)} icon={<Pencil size={16} />} />
              <IconButton title="Delete" onClick={() => window.confirm("Delete this event?") && run(() => api.deleteEvent(item._id), "Event deleted")} icon={<Trash2 size={16} />} />
            </ListRow>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoutinePanel({ routine, run }) {
  const [form, setForm] = useState(emptyRoutine);
  const [editingId, setEditingId] = useState("");
  const formRef = useRef(null);

  function edit(item) {
    setEditingId(item._id);
    setForm({ ...emptyRoutine, ...item });
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function reset() {
    setEditingId("");
    setForm(emptyRoutine);
  }

  return (
    <div className="space-y-4">
      <div ref={formRef} className="scroll-mt-20">
        <FormShell title={editingId ? "Edit routine slot" : "Create routine slot"}>
          <RoutineFields form={form} setForm={setForm} />
          <div className="flex justify-end gap-2">
            {editingId && <button className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-semibold" onClick={reset}>Cancel</button>}
            <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" onClick={() => run(() => editingId ? api.updateRoutine(editingId, form) : api.createRoutine(form), editingId ? "Routine updated" : "Routine created").then(reset)}>
              <Save size={16} /> {editingId ? "Update routine" : "Save"}
            </button>
          </div>
        </FormShell>
      </div>
      <div className="rounded-md border border-line bg-white shadow-soft">
        <PanelTitle icon={<CalendarClock size={18} />} title="Weekly routine" />
        <div className="divide-y divide-line">
          {routine.map((item) => (
            <ListRow key={item._id} title={`${item.subjectCode} · ${item.subjectName}`} meta={`${WEEKDAYS[item.weekday]} · ${displayTime(item.startTime)} - ${displayTime(item.endTime)} · ${item.room}`}>
              <IconButton title="Edit" onClick={() => edit(item)} icon={<Pencil size={16} />} />
              <IconButton title="Delete" onClick={() => window.confirm("Delete this routine slot?") && run(() => api.deleteRoutine(item._id), "Routine deleted")} icon={<Trash2 size={16} />} />
            </ListRow>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExceptionsPanel({ routine, exceptions, run }) {
  const [form, setForm] = useState({ routineSlotId: "", date: todayISO(), status: "suspended", reason: "", replacement: {} });

  const selectedRoutine = useMemo(() => routine.find((item) => item._id === form.routineSlotId), [routine, form.routineSlotId]);

  return (
    <div className="space-y-4">
      <FormShell title="Date-specific class exception">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Routine slot
            <select className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.routineSlotId} onChange={(e) => setForm({ ...form, routineSlotId: e.target.value })}>
              <option value="">Select class</option>
              {routine.map((item) => <option key={item._id} value={item._id}>{WEEKDAYS[item.weekday]} · {item.subjectCode} · {displayTime(item.startTime)}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Date
            <input type="date" className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label className="text-sm font-medium">
            Status
            <select className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="suspended">Suspended</option>
              <option value="modified">Modified</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Reason
            <input className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </label>
        </div>
        {selectedRoutine && <p className="mt-2 text-sm text-slate-600">Selected: {selectedRoutine.subjectName} on {WEEKDAYS[selectedRoutine.weekday]}</p>}
        <div className="mt-4 flex justify-end">
          <button className="focus-ring inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" onClick={() => run(() => api.saveException(form), "Exception saved")}>
            <Plus size={16} /> Save exception
          </button>
        </div>
      </FormShell>
      <div className="rounded-md border border-line bg-white shadow-soft">
        <PanelTitle icon={<CalendarClock size={18} />} title="Recent exceptions" />
        <div className="divide-y divide-line">
          {exceptions.map((item) => (
            <ListRow key={item._id} title={`${item.status} · ${formatDate(item.date)}`} meta={item.reason || "No reason"} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EventFields({ form, setForm, needsMarks }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
      <label className="text-sm font-medium">
        Type
        <select className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {EVENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </label>
      <Field label="Subject" value={form.subjectName} onChange={(value) => setForm({ ...form, subjectName: value })} />
      <Field label="Subject code" value={form.subjectCode} onChange={(value) => setForm({ ...form, subjectCode: value })} />
      <Field type="date" label="Date" value={form.date} onChange={(value) => setForm({ ...form, date: value })} />
      <div className="grid grid-cols-2 gap-2">
        <Field type="time" label="Start" value={form.startTime} onChange={(value) => setForm({ ...form, startTime: value })} />
        <Field type="time" label="End" value={form.endTime} onChange={(value) => setForm({ ...form, endTime: value })} />
      </div>
      {needsMarks && <Field type="number" label="Marks" value={form.marks} onChange={(value) => setForm({ ...form, marks: value })} />}
      <Field label="Syllabus" value={form.syllabus} onChange={(value) => setForm({ ...form, syllabus: value })} />
    </div>
  );
}

function RoutineFields({ form, setForm }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Subject" value={form.subjectName} onChange={(value) => setForm({ ...form, subjectName: value })} />
      <Field label="Code" value={form.subjectCode} onChange={(value) => setForm({ ...form, subjectCode: value })} />
      <Field label="Teacher" value={form.teacherName} onChange={(value) => setForm({ ...form, teacherName: value })} />
      <Field label="Room" value={form.room} onChange={(value) => setForm({ ...form, room: value })} />
      <label className="text-sm font-medium">
        Day
        <select className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.weekday} onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}>
          {WEEKDAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <Field type="time" label="Start" value={form.startTime} onChange={(value) => setForm({ ...form, startTime: value })} />
        <Field type="time" label="End" value={form.endTime} onChange={(value) => setForm({ ...form, endTime: value })} />
      </div>
      <Field type="color" label="Color" value={form.color} onChange={(value) => setForm({ ...form, color: value })} />
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input type={type} className="mt-1 w-full rounded-md border border-line px-3 py-2" value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function FormShell({ title, children }) {
  return (
    <div className="rounded-md border border-line bg-white p-4 shadow-soft">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function PanelTitle({ icon, title }) {
  return (
    <div className="flex items-center gap-2 border-b border-line p-4 font-semibold">
      {icon}
      {title}
    </div>
  );
}

function ListRow({ title, meta, children }) {
  return (
    <div className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
      <div>
        <div className="font-semibold">{title}</div>
        <div className="mt-1 text-sm text-slate-600">{meta}</div>
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

function IconButton({ title, icon, onClick }) {
  return (
    <button className="focus-ring grid h-9 w-9 place-items-center rounded-md border border-line hover:bg-slate-50" title={title} onClick={onClick}>
      {icon}
    </button>
  );
}
