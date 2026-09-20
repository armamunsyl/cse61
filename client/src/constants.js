export const EVENT_TYPES = [
  { value: "quiz", label: "Quiz" },
  { value: "ct", label: "CT" },
  { value: "presentation", label: "Presentation" },
  { value: "viva", label: "Viva" },
  { value: "suspension", label: "Suspended" },
  { value: "custom", label: "Custom Event" }
];

export const ASSESSMENT_TYPES = ["quiz", "ct", "presentation", "viva"];

export const TYPE_STYLES = {
  quiz: "border-forest bg-teal-50 text-teal-900",
  ct: "border-berry bg-rose-50 text-rose-900",
  presentation: "border-indigo-600 bg-indigo-50 text-indigo-900",
  viva: "border-amberdeep bg-amber-50 text-amber-900",
  suspension: "border-slate-400 bg-slate-100 text-slate-700",
  custom: "border-slate-600 bg-white text-slate-800"
};

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
