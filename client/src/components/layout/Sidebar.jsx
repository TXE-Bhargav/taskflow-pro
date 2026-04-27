import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../services/auth.service";
import useAuthStore from "../../store/authStore";
import toast from "react-hot-toast";

const Sidebar = ({ workspaces = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {}
    logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  return (
    <aside className="w-60 bg-white border-r border-gray-100 h-screen flex flex-col fixed left-0 top-0 z-30">
      {/* ── Logo ── */}
      <div className="h-14 flex items-center px-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-primary-500 rounded-lg flex items-center justify-center text-white font-semibold text-xs">
            T
          </div>
          <span className="font-semibold text-gray-900 text-sm tracking-tight">
            TaskFlow Pro
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150
            ${
              isActive
                ? "bg-primary-50 text-primary-600 font-medium"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`
          }
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
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
          </svg>
          Dashboard
        </NavLink>

        {/* ── Workspaces ── */}
        {workspaces.length > 0 && (
          <div className="pt-5">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-widest px-3 mb-2">
              Workspaces
            </p>
            <div className="space-y-0.5">
              {workspaces.map((ws) => {
                const isActive = location.pathname.startsWith(
                  `/workspace/${ws.id}`,
                );
                return (
                  <NavLink
                    key={ws.id}
                    to={`/workspace/${ws.id}`}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150
                      ${
                        isActive
                          ? "bg-primary-50 text-primary-600 font-medium"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0
                      ${isActive ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-500"}`}
                    >
                      {ws.name[0].toUpperCase()}
                    </span>
                    <span className="truncate">{ws.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* ── User ── */}
      <div className="flex-shrink-0 border-t border-gray-100 p-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold text-xs flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-1 flex items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
