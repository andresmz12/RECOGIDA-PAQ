"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n-context";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    key: "nav.inicio",
    exact: true,
    roles: ["ADMIN", "DISPATCHER"],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/solicitudes",
    key: "nav.solicitudes",
    exact: false,
    roles: ["ADMIN", "DISPATCHER"],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    href: "/dashboard/calendario",
    key: "nav.calendario",
    exact: false,
    roles: ["ADMIN", "DISPATCHER"],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/mapa",
    key: "nav.mapa",
    exact: false,
    roles: ["ADMIN", "DISPATCHER", "COURIER"],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  {
    href: "/dashboard/mis-recogidas",
    key: "nav.misRecogidas",
    exact: false,
    roles: ["COURIER"],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    href: "/dashboard/casos",
    key: "nav.casos",
    exact: false,
    roles: ["ADMIN", "DISPATCHER"],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/soporte",
    key: "nav.soporte",
    exact: false,
    roles: ["ADMIN", "DISPATCHER"],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/usuarios",
    key: "nav.usuarios",
    exact: false,
    roles: ["ADMIN"],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/rutas",
    key: "nav.rutasPdf",
    exact: false,
    roles: ["ADMIN"],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/precios",
    key: "nav.precios",
    exact: false,
    roles: ["ADMIN"],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/descuentos",
    key: "nav.descuentos",
    exact: false,
    roles: ["ADMIN"],
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
];

const PAGE_TITLE_KEYS: Array<{ match: (p: string) => boolean; key: string }> = [
  { match: (p) => p === "/dashboard", key: "pageTitles.dashboard" },
  { match: (p) => p.startsWith("/dashboard/solicitudes/"), key: "pageTitles.detalleRecogida" },
  { match: (p) => p.startsWith("/dashboard/solicitudes"), key: "pageTitles.solicitudes" },
  { match: (p) => p.startsWith("/dashboard/mapa"), key: "pageTitles.mapa" },
  { match: (p) => p.startsWith("/dashboard/mis-recogidas"), key: "pageTitles.misRecogidas" },
  { match: (p) => p.startsWith("/dashboard/casos"), key: "pageTitles.casos" },
  { match: (p) => p.startsWith("/dashboard/soporte"), key: "pageTitles.soporte" },
  { match: (p) => p.startsWith("/dashboard/usuarios"), key: "pageTitles.usuarios" },
  { match: (p) => p.startsWith("/dashboard/calendario"), key: "pageTitles.calendario" },
  { match: (p) => p.startsWith("/dashboard/rutas"), key: "pageTitles.rutasPdf" },
  { match: (p) => p.startsWith("/dashboard/precios"), key: "pageTitles.precios" },
  { match: (p) => p.startsWith("/dashboard/descuentos"), key: "pageTitles.descuentos" },
];

function SidebarContent({
  session,
  role,
  visibleNav,
  pathname,
  onNavigate,
}: {
  session: any;
  role: string;
  visibleNav: typeof NAV_ITEMS;
  pathname: string | null;
  onNavigate?: () => void;
}) {
  const { t } = useT();
  const [unreadChats, setUnreadChats] = useState(0);
  const [openCases, setOpenCases] = useState(0);

  useEffect(() => {
    if (!["ADMIN", "DISPATCHER"].includes(role)) return;
    const load = () => {
      fetch("/api/support-chat/unread-count")
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setUnreadChats(d.count); })
        .catch(() => {});
      fetch("/api/cases?status=OPEN")
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d) setOpenCases((d.cases ?? []).length); })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [role]);

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-800/80 shrink-0">
        <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-800 rounded-md flex items-center justify-center shadow-sm shrink-0">
          <span className="text-white font-black text-xs">OG</span>
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-none truncate">O&apos;Globo Cargo</p>
          <p className="text-blue-400 text-xs mt-0.5 truncate">
            {t("nav.panelControl")}{role ? ` · ${t(`roles.${role}`)}` : ""}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider px-2.5 mb-2 mt-1">
          {t("nav.navegacion")}
        </p>
        {visibleNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-md text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span className={isActive ? "text-white" : "text-slate-500"}>
                {item.icon}
              </span>
              <span className="flex-1">{t(item.key)}</span>
              {item.href === "/dashboard/soporte" && unreadChats > 0 && (
                <span className="shrink-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
                  {unreadChats}
                </span>
              )}
              {item.href === "/dashboard/casos" && openCases > 0 && (
                <span className="shrink-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[1.25rem] h-5 px-1 flex items-center justify-center">
                  {openCases}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-2.5 py-3 border-t border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate leading-none mb-0.5">
              {session?.user?.name}
            </p>
            <p className="text-slate-500 text-xs truncate">{t(`roles.${role}`) ?? role}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg text-xs font-medium transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {t("nav.cerrarSesion")}
        </button>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useT();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifItems, setNotifItems] = useState<
    { id: string; trackingCode: string; contactName: string; pickupCity: string }[]
  >([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  // Poll for pending pickups every 60s (ADMIN/DISPATCHER only)
  useEffect(() => {
    const role = (session?.user as any)?.role;
    if (!["ADMIN", "DISPATCHER"].includes(role)) return;
    const check = () =>
      fetch("/api/pickup-requests?status=PENDING&limit=5")
        .then((r) => r.json())
        .then((d) => {
          setPendingCount(d.pagination?.total ?? 0);
          setNotifItems(d.data ?? []);
        })
        .catch(() => {});
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <p className="text-slate-500 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  const role = (session?.user as any)?.role as string;
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const pageTitleKey = PAGE_TITLE_KEYS.find((x) => x.match(pathname ?? ""))?.key ?? "pageTitles.dashboard";
  const pageTitle = t(pageTitleKey);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex bg-slate-900 fixed inset-y-0 left-0 flex-col z-40 transition-all duration-300 ${sidebarOpen ? "w-60" : "w-0 overflow-hidden"}`}>
        <SidebarContent
          session={session}
          role={role}
          visibleNav={visibleNav}
          pathname={pathname}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside
            className="relative w-72 max-w-[85vw] bg-slate-900 flex flex-col h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <SidebarContent
              session={session}
              role={role}
              visibleNav={visibleNav}
              pathname={pathname}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Right side */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? "lg:ml-60" : "lg:ml-0"}`}>
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* Desktop sidebar toggle */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="hidden lg:flex p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title={sidebarOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 font-medium hidden sm:block">O&apos;Globo</span>
              <svg className="w-3.5 h-3.5 text-slate-300 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-semibold text-slate-900">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <LanguageSwitcher />

            <div className="w-px h-5 bg-slate-200" />

            {/* Notification bell with pending count */}
            <div className="relative">
              <button
                className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title={pendingCount > 0 ? `${pendingCount} pending` : "Notifications"}
                onClick={() => setNotifOpen((v) => !v)}
              >
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {pendingCount > 0 ? (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50">
                  <div className="px-3.5 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{t("nav.notifTitle")}</p>
                    {pendingCount > 0 && (
                      <span className="text-xs font-bold text-red-600">{pendingCount}</span>
                    )}
                  </div>

                  {notifItems.length === 0 ? (
                    <p className="px-3.5 py-4 text-sm text-slate-400 text-center">{t("nav.notifEmpty")}</p>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setNotifOpen(false);
                            router.push(`/dashboard/solicitudes/${item.id}`);
                          }}
                          className="w-full flex flex-col items-start gap-0.5 px-3.5 py-2 text-left hover:bg-slate-50 transition-colors"
                        >
                          <span className="text-xs font-bold text-blue-700">{item.trackingCode}</span>
                          <span className="text-sm text-slate-700 truncate w-full">{item.contactName} · {item.pickupCity}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setNotifOpen(false);
                      router.push("/dashboard/solicitudes?status=PENDING");
                    }}
                    className="w-full text-center px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-slate-50 transition-colors border-t border-slate-100 mt-1"
                  >
                    {t("nav.notifViewAll")}
                  </button>
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-slate-200 mx-0.5" />

            {/* Avatar + user menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="text-sm font-medium text-slate-700 max-w-[80px] truncate hidden sm:block">
                  {session?.user?.name?.split(" ")[0]}
                </span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{session?.user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{session?.user?.email}</p>
                    <p className="text-xs text-blue-600 font-semibold mt-0.5">{t(`roles.${role}`)}</p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t("nav.cerrarSesion")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
