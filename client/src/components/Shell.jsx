import { CalendarDays, LogOut, ShieldCheck } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import NotificationSettings from "./NotificationSettings.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export default function Shell({ children }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("routine");

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  function scrollToSection(sectionId) {
    setActiveSection(sectionId);
    if (location.pathname !== "/") {
      navigate("/");
    }
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  function mobileItemClass(isActive) {
    return `rounded-full px-3 py-2 text-[11px] font-black transition ${
      isActive ? "bg-[#a8ee85] text-[#13210f] shadow-sm" : "text-[#402923] hover:bg-[#f4eadf]"
    }`;
  }

  return (
    <div className="min-h-screen bg-mist text-ink">
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-normal">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-ink text-white">
              <CalendarDays size={17} />
            </span>
            <span>CSE 61 D Schedule</span>
          </Link>
          <div className="flex items-center gap-2">
          <NotificationSettings />
          <nav className="hidden items-center gap-2 sm:flex">
            <NavLink className="rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-slate-100" to="/">
              Calendar
            </NavLink>
            <NavLink className="rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-slate-100" to="/assessments">
              List
            </NavLink>
            {admin ? (
              <>
                <NavLink className="rounded-md px-2.5 py-1.5 text-sm font-medium hover:bg-slate-100" to="/admin">
                  Admin
                </NavLink>
                <button
                  className="focus-ring grid h-8 w-8 place-items-center rounded-md border border-line bg-white hover:bg-slate-100"
                  onClick={handleLogout}
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <NavLink
                className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-white px-2.5 py-1.5 text-sm font-medium hover:bg-slate-100"
                to="/admin/login"
              >
                <ShieldCheck size={16} />
                Admin
              </NavLink>
            )}
          </nav>
          </div>
        </div>
      </header>
      <main className="pb-24 sm:pb-0">{children}</main>
      <div className="fixed inset-x-0 bottom-3 z-50 px-4 sm:hidden">
        <nav className="mx-auto flex max-w-[430px] items-center justify-around gap-1 rounded-full border border-white/80 bg-white/95 p-2 shadow-[0_10px_30px_rgba(64,41,35,0.18)] backdrop-blur">
          <button type="button" className={mobileItemClass(location.pathname === "/" && activeSection === "routine")} onClick={() => scrollToSection("routine")}>
            Routine
          </button>
          <button type="button" className={mobileItemClass(location.pathname === "/assessments")} onClick={() => navigate("/assessments")}>
            List
          </button>
          <button type="button" className={mobileItemClass(location.pathname === "/" && activeSection === "monthly")} onClick={() => scrollToSection("monthly")}>
            Month
          </button>
          {admin && (
            <button type="button" className={mobileItemClass(location.pathname.startsWith("/admin"))} onClick={() => navigate("/admin")}>
              Admin
            </button>
          )}
          {admin && (
            <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-[#402923] text-white shadow-sm" onClick={handleLogout} title="Log out">
              <LogOut size={14} />
            </button>
          )}
        </nav>
      </div>
    </div>
  );
}
