const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "/api" : "http://localhost:8000/api");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.errors = data.errors;
    throw error;
  }
  return data;
}

export const api = {
  getWeek: (date) => request(`/calendar/week?date=${date}`),
  getMonth: (date) => request(`/calendar/month?date=${date}`),
  getUpcoming: () => request("/assessments/upcoming"),
  pushPublicKey: () => request("/push/public-key"),
  pushStatus: (endpoint) => request(`/push/status?endpoint=${encodeURIComponent(endpoint)}`),
  subscribePush: (payload) => request("/push/subscribe", { method: "POST", body: payload }),
  unsubscribePush: (endpoint) => request("/push/unsubscribe", { method: "POST", body: { endpoint } }),
  markPushRead: (endpoint) => request("/push/mark-read", { method: "POST", body: { endpoint } }),
  getPlanningStats: ({ date, startTime, endTime }) =>
    request(`/planning-stats?date=${date}&startTime=${startTime}&endTime=${endTime}`),
  createRequest: (payload) => request("/requests", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  adminDashboard: () => request("/admin/dashboard"),
  adminRequests: (status = "") => request(`/admin/requests${status ? `?status=${status}` : ""}`),
  approveRequest: (id, payload = {}) => request(`/admin/requests/${id}/approve`, { method: "POST", body: payload }),
  rejectRequest: (id, reason) => request(`/admin/requests/${id}/reject`, { method: "POST", body: { reason } }),
  adminEvents: () => request("/admin/events"),
  createEvent: (payload) => request("/admin/events", { method: "POST", body: payload }),
  updateEvent: (id, payload) => request(`/admin/events/${id}`, { method: "PUT", body: payload }),
  deleteEvent: (id) => request(`/admin/events/${id}`, { method: "DELETE" }),
  adminRoutine: () => request("/admin/routine"),
  createRoutine: (payload) => request("/admin/routine", { method: "POST", body: payload }),
  updateRoutine: (id, payload) => request(`/admin/routine/${id}`, { method: "PUT", body: payload }),
  deleteRoutine: (id) => request(`/admin/routine/${id}`, { method: "DELETE" }),
  exceptions: () => request("/admin/exceptions"),
  saveException: (payload) => request("/admin/exceptions", { method: "POST", body: payload }),
  sendTestPush: () => request("/admin/push/test", { method: "POST" })
};
