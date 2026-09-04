import { Outlet, useLocation, useNavigate } from "react-router";
import Icon from "./Icon";

const tabs = [
  {
    path: "/",
    label: "首页",
    icon: (active: boolean) => <Icon name="home" className="w-5 h-5" filled={active} />,
  },
  {
    path: "/discover",
    label: "发现",
    icon: (active: boolean) => <Icon name="compass" className="w-5 h-5" filled={active} />,
  },
  {
    path: "/chat",
    label: "咨询",
    icon: (active: boolean) => <Icon name="message" className="w-5 h-5" filled={active} />,
  },
  {
    path: "/profile",
    label: "我的",
    icon: (active: boolean) => <Icon name="user" className="w-5 h-5" filled={active} />,
  },
];

const TAB_PATHS = ["/", "/discover", "/chat", "/profile"];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isTab = TAB_PATHS.includes(location.pathname);

  return (
    <div className="flex justify-center items-start min-h-full bg-[#eee9f3]">
      <div className="relative w-full max-w-sm min-h-full bg-background flex flex-col shadow-[0_0_40px_rgba(55,25,85,.10)]" style={{ minHeight: "100dvh" }}>
        <main className="flex-1 overflow-y-auto" style={{ paddingBottom: isTab ? "68px" : "0" }}>
          <Outlet />
        </main>

        {isTab && (
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white/95 backdrop-blur-xl border-t border-border flex z-50 shadow-[0_-8px_30px_rgba(51,28,82,.06)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            {tabs.map((tab) => {
              const active = location.pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={`relative flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                    active ? "text-[#5b21b6]" : "text-[#94a3b8]"
                  }`}
                >
                  {tab.icon(active)}
                  <span>{tab.label}</span>
                  {active && <i className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
