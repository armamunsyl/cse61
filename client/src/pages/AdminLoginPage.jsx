import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="rounded-md border border-line bg-white p-6 shadow-soft">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-ink text-white"><LockKeyhole size={20} /></span>
          <div>
            <h1 className="text-xl font-semibold">Admin login</h1>
            <p className="text-sm text-slate-600">Protected schedule management</p>
          </div>
        </div>
        {error && <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium">
            Email
            <input type="email" className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input type="password" className="mt-1 w-full rounded-md border border-line px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </label>
          <button className="focus-ring w-full rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
