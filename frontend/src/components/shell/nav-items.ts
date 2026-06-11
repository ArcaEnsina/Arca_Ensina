import { BookMarked, Home, Cross, type LucideIcon } from "lucide-react";

/** Destino de navegação do AppShell. CORE-013 — 3 destinos no MVP. */
export interface NavItem {
  /** Identificador estável para destinos com comportamento dinâmico (ex.: "protocols"). */
  id?: string;
  to: string;
  label: string;
  icon: LucideIcon;
  /** Decide se a rota atual ativa este destino (e portanto o blob). */
  match: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: "/dashboard",
    label: "Início",
    icon: Home,
    match: (p) => p === "/" || p.startsWith("/dashboard"),
  },
  {
    to: "/medications",
    label: "Calculadora",
    icon: Cross,
    match: (p) => p.startsWith("/medications") || p.startsWith("/calculator"),
  },
  {
    id: "protocols",
    to: "/protocols/manual",
    label: "Protocolos",
    icon: BookMarked,
    match: (p) =>
      p.startsWith("/protocols") ||
      p.startsWith("/guided-protocol") ||
      p.startsWith("/sedation"),
  },
];
