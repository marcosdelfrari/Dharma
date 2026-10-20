"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { GlobalSearch } from "@/components/GlobalSearch";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  LogoutIcon,
  MenuIcon,
  MoonIcon,
  NavIcon,
  SunIcon,
} from "@/components/shell-nav-icons";
import { useAuth, useAuthLabel } from "@/lib/auth-context";
import { dharmaSymbol } from "@/lib/brand";
import { useDharmaConfig } from "@/lib/dharma-config";
import { MENU_SECTIONS } from "@/lib/menu";
import { allowedPagesForRoles, filterMenuSections } from "@/lib/role-pages";

function isPathActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, loading, user, permissions, rolePages } = useAuth();
  const { config, themeMode, toggleTheme } = useDharmaConfig();
  const label = useAuthLabel();
  const [collapsed, setCollapsed] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const isAdmin = permissions.includes("Administrador");

  const brandTitle = config.title || "Dharma";
  const brandLogo = dharmaSymbol(themeMode);

  const sections = useMemo(() => {
    const allowed = allowedPagesForRoles(rolePages, permissions);
    const filtered = filterMenuSections([...MENU_SECTIONS], allowed);
    return filtered.filter((section) => {
      if ("adminOnly" in section && section.adminOnly) return isAdmin;
      return true;
    });
  }, [isAdmin, permissions, rolePages]);

  const closeMobileNav = useCallback(() => setOpenMobile(false), []);

  const toggleDesktopSidebar = useCallback(() => {
    setCollapsed((v) => !v);
  }, []);

  // Sempre manter `{children}` na árvore (Cache Components / instant navigation).
  // Gate de auth mostra o loader, mas não dropa o segmento da página.
  if (loading || !user) {
    return (
      <>
        <div className="loader" style={{ minHeight: "100dvh" }}>
          <div className="loader__spinner" />
          <span>{loading ? "Carregando sessão…" : "Redirecionando…"}</span>
        </div>
        <div hidden aria-hidden>
          {children}
        </div>
      </>
    );
  }

  return (
    <div
      className={["shell", collapsed ? "is-sidebar-collapsed" : ""].filter(Boolean).join(" ")}
    >
      {openMobile ? (
        <button
          type="button"
          className="shell__backdrop"
          aria-label="Fechar menu"
          onClick={closeMobileNav}
        />
      ) : null}

      <aside
        id="shell-sidebar"
        className={[
          "shell__sidebar",
          collapsed ? "is-collapsed" : "",
          openMobile ? "is-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label="Menu lateral"
      >
        <div className="shell__brand">
          <div className="shell__brand-main">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandLogo}
              alt={brandTitle}
              className="shell__logo"
              width={36}
              height={36}
            />
          </div>

          <button
            type="button"
            className="shell__nav-control shell__nav-control--close-mobile"
            onClick={closeMobileNav}
            aria-label="Fechar navegação"
          >
            <CloseIcon />
            <span>Fechar</span>
          </button>

          <button
            type="button"
            className="shell__nav-control shell__nav-control--collapse"
            onClick={toggleDesktopSidebar}
            aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>

        <nav className="shell__nav" aria-label="Navegação principal">
          {sections.map((section) => (
            <div key={section.id} className="shell__section">
              <span className="shell__section-label">{section.label}</span>
              <ul className="shell__section-list">
                {section.items.map((item) => {
                  const active = isPathActive(pathname, item.path);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.path}
                        className={`shell__link${active ? " is-active" : ""}`}
                        onClick={closeMobileNav}
                        data-nav-label={item.label}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="shell__link-icon" aria-hidden>
                          <NavIcon id={item.id} />
                        </span>
                        <span className="shell__link-label">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shell__footer" title={`${label.name} · ${label.role}`}>
          <div className="shell__user-meta">
            <strong>{label.name}</strong>
            <span>{label.role}</span>
          </div>
          <div className="shell__actions">
            <button
              type="button"
              className="shell__icon-btn"
              onClick={toggleTheme}
              aria-label={themeMode === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              title={themeMode === "dark" ? "Tema claro" : "Tema escuro"}
            >
              {themeMode === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <button
              type="button"
              className="shell__icon-btn shell__icon-btn--danger"
              onClick={() => void logout()}
              aria-label="Sair"
              title="Sair"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>

      </aside>

      <div className="shell__main">
        <div className="shell__top">
          <button
            type="button"
            className="shell__open-nav"
            onClick={() => setOpenMobile(true)}
            aria-expanded={openMobile}
            aria-controls="shell-sidebar"
          >
            <MenuIcon />
            <span>Navegação</span>
          </button>
          <GlobalSearch />
          <Link href="/contato" className="shell__top-link">
            Contato público
          </Link>
        </div>
        <div className="shell__content">{children}</div>
      </div>
    </div>
  );
}
