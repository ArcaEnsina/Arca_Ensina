import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import arcaLogo from "@/assets/arca-logo.png";
import { NAV_ITEMS } from "./nav-items";

/**
 * NavBar de desktop / iPad (CORE-013): pill branca flutuante com a marca ARCA
 * à esquerda e rótulos de texto. Renderizada apenas em `tablet:` (>=1024px) —
 * abaixo disso usa-se o `ClipboardNav` ancorado no rodapé.
 *
 * Implementada com `<nav>` + `<Link>` semânticos: âncoras reais já entregam
 * teclado, foco e leitor de tela sem primitivo extra. O estado ativo vem da
 * função `match` de `nav-items.ts` (precisa cobrir `/calculator/*`, então o
 * `isActive` nativo do NavLink não bastaria).
 */
export function DesktopNav() {
  const { pathname } = useLocation();
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "fixed left-1/2 z-40 hidden -translate-x-1/2 tablet:block transition-[top] duration-300",
        isOffline ? "top-16" : "top-6"
      )}
    >
      <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white p-1.5 pl-2 shadow-md">
        {/* marca ARCA */}
        <img
          src={arcaLogo}
          alt="ARCA"
          className="mr-3 size-10 shrink-0 object-contain"
        />

        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    // diferenciação só por opacidade — sem fundo, sem contorno
                    "block rounded-full px-4 py-2 text-body-md font-medium text-arca-blue-900",
                    "transition-opacity duration-200 motion-reduce:transition-none",
                    "focus-visible:ring-2 focus-visible:ring-arca-blue-500/40 focus-visible:outline-none",
                    active ? "opacity-100" : "opacity-70 hover:opacity-100",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
