// Sidebar.jsx — Dark premium sidebar with mobile drawer support

import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../services/auth.service";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const Sidebar = ({ workspaces = [], isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {}
    logout();
    navigate("/login");
    toast.success("Logged out");
    onClose?.();
  };

  const navLink = (to, label, icon) => {
    const active =
      location.pathname === to || location.pathname.startsWith(to + "/");
    return (
      <NavLink
        to={to}
        onClick={onClose}
        className={[
          "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-100",
          active
            ? "bg-accent/10 text-accent-300 border border-accent/20 font-medium"
            : "text-ink-3 hover:text-ink-1 hover:bg-surface-4",
        ].join(" ")}
      >
        <span className={active ? "text-accent-400" : "text-ink-4"}>
          {icon}
        </span>
        {label}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          "fixed left-0 top-0 z-50 h-screen w-56",
          "bg-surface-1 border-r border-border-1",
          "flex flex-col",
          "transition-transform duration-200 ease-out",
          // Mobile: slide in/out
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible
          "sm:translate-x-0",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-border-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded flex items-center justify-center text-surface-0 font-bold text-[11px] shadow-glow-sm">
              T
            </div>
            <span className="font-semibold text-ink-1 text-[13px] tracking-tight">
              TaskFlow<span className="text-accent-400"> Pro</span>
            </span>
          </div>
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="sm:hidden w-6 h-6 rounded flex items-center justify-center text-ink-4 hover:text-ink-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navLink(
            "/dashboard",
            "Dashboard",
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>,
          )}

          {/* Analytics section */}
          {workspaces.length > 0 && (
            <div className="pt-4">
              <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest px-2.5 mb-1.5">
                Analytics
              </p>
              <div className="space-y-0.5">
                {workspaces.map((ws) => (
                  <NavLink
                    key={`analytics-${ws.id}`}
                    to={`/analytics/${ws.id}`}
                    onClick={onClose}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-100",
                        isActive
                          ? "bg-accent/10 text-accent-300 border border-accent/20 font-medium"
                          : "text-ink-3 hover:text-ink-1 hover:bg-surface-4",
                      ].join(" ")
                    }
                  >
                    <svg
                      className="w-3.5 h-3.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    <span className="truncate">{ws.name} Analytics</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {/* Workspaces section */}
          {workspaces.length > 0 && (
            <div className="pt-4">
              <p className="text-[10.5px] font-semibold text-ink-4 uppercase tracking-widest px-2.5 mb-1.5">
                Workspaces
              </p>
              <div className="space-y-0.5">
                {workspaces.map((ws) => {
                  const isWorkspaceActive = location.pathname.startsWith(
                    `/workspace/${ws.id}`,
                  );
                  const isSettingsActive =
                    location.pathname === `/workspace/${ws.id}/settings`;

                  return (
                    // Wrapper div holds workspace link + settings icon in one row
                    <div
                      key={ws.id}
                      className="flex items-center gap-1 group/ws"
                    >
                      <NavLink
                        to={`/workspace/${ws.id}`}
                        onClick={onClose}
                        className={[
                          "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-100 flex-1 min-w-0",
                          isWorkspaceActive
                            ? "bg-accent/10 text-accent-300 border border-accent/20 font-medium"
                            : "text-ink-3 hover:text-ink-1 hover:bg-surface-4",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                            isWorkspaceActive
                              ? "bg-accent/20 text-accent-400"
                              : "bg-surface-4 text-ink-3",
                          ].join(" ")}
                        >
                          {ws.name[0].toUpperCase()}
                        </span>
                        <span className="truncate">{ws.name}</span>
                      </NavLink>

                      {/* Settings icon — only visible on hover or when active */}
                      <NavLink
                        to={`/workspace/${ws.id}/settings`}
                        onClick={onClose}
                        title="Workspace settings"
                        className={[
                          "flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors",
                          "opacity-0 group-hover/ws:opacity-100",
                          isSettingsActive
                            ? "text-accent-400 opacity-100"
                            : "text-ink-4 hover:text-ink-2 hover:bg-surface-4",
                        ].join(" ")}
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </NavLink>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* User footer */}
        <div className="flex-shrink-0 border-t border-border-1 p-2">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-md mb-0.5">
            <div className="w-6 h-6 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent-300 font-semibold text-[10px] flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-ink-1 truncate leading-tight">
                {user?.name}
              </p>
              <p className="text-[11px] text-ink-4 truncate leading-tight">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Profile link */}
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) =>
              [
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12px] transition-colors mb-0.5",
                isActive
                  ? "text-accent-300"
                  : "text-ink-4 hover:text-ink-2 hover:bg-surface-4",
              ].join(" ")
            }
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profile
          </NavLink>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-[12px] text-danger/70 hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
