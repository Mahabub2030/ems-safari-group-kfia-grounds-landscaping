import DACOlogo from "@/assets/imgs/dammam.jpg";
import Safarilogo from "@/assets/imgs/safari.png";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { ModeToggle } from "../layout/ModeToggler";

// Hamburger icon component
const HamburgerIcon = ({
  className,
  ...props
}: React.SVGAttributes<SVGElement>) => (
  <svg
    aria-label="Menu"
    className={cn("pointer-events-none", className)}
    fill="none"
    height={16}
    role="img"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width={16}
    xmlns="http://www.w3.org/2000/svg"
    {...(props as any)}
  >
    <path
      className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
      d="M4 12L20 12"
    />
    <path
      className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
      d="M4 12H20"
    />
    <path
      className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
      d="M4 12H20"
    />
  </svg>
);

// Types
export interface NavbarNavLink {
  href: string;
  label: string;
  active?: boolean;
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  logoHref?: string;
  navigationLinks?: NavbarNavLink[];
  signInText?: string;
  signInHref?: string;
  ctaText?: string;
  ctaHref?: string;
  onSignInClick?: () => void;
  onCtaClick?: () => void;
}

// Default navigation links
const defaultNavigationLinks: NavbarNavLink[] = [
  { href: "/", label: "Home" },
  { href: "/employee", label: "Employee" },
  { href: "#pricing", label: "Pricing" },
  { href: "#about", label: "About" },
];

export const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  (
    {
      className,
      logo,
      logoHref = "/",
      navigationLinks = defaultNavigationLinks,
      signInText = "Sign In",
      signInHref = "#signin",
      ctaText = "Get Started",
      ctaHref = "#get-started",
      onSignInClick,
      onCtaClick,
      ...props
    },
    ref,
  ) => {
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const checkWidth = () => {
        if (containerRef.current) {
          const width = containerRef.current.offsetWidth;
          setIsMobile(width < 768); // 768px is md breakpoint
        }
      };

      checkWidth();

      const resizeObserver = new ResizeObserver(checkWidth);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // Combine refs
    const combinedRef = React.useCallback(
      (node: HTMLElement | null) => {
        containerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    return (
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b border-white/10 bg-[oklch(0.35_0.12_290)] text-white px-4 md:px-6 [&_*]:no-underline",
          className,
        )}
        ref={combinedRef}
        {...(props as any)}
      >
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-2">
            {/* Mobile menu trigger */}
            {isMobile && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className="group h-9 w-9 text-white hover:bg-white/10 hover:text-white"
                    size="icon"
                    variant="ghost"
                  >
                    <HamburgerIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-48 p-2 bg-[oklch(0.35_0.12_290)] border-white/10 text-white"
                >
                  <NavigationMenu className="max-w-none">
                    <NavigationMenuList className="flex-col items-start gap-1">
                      {navigationLinks.map((link, index) => (
                        <NavigationMenuItem className="w-full" key={index}>
                          <Link
                            to={link.href}
                            className={cn(
                              "flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 text-white/90 hover:text-white cursor-pointer no-underline",
                              link.active &&
                                "bg-white/20 text-white font-semibold",
                            )}
                          >
                            {link.label}
                          </Link>
                        </NavigationMenuItem>
                      ))}
                    </NavigationMenuList>
                  </NavigationMenu>
                </PopoverContent>
              </Popover>
            )}

            {/* Logo & Desktop Nav */}
            <div className="flex items-center gap-6">
              <Link
                to={logoHref}
                className="flex items-center space-x-3 bg-white pl-2 pr-12 py-2 rounded-l-2xl [clip-path:polygon(0_0,_100%_0,_85%_100%,_0%_100%)] transition-opacity hover:opacity-95 cursor-pointer"
              >
                {/* First Logo */}
                <img
                  src={Safarilogo}
                  alt="Safari Logo"
                  className="h-10 w-auto object-contain"
                />

                {/* Optional Divider Line */}
                <div className="h-6 w-[1px] bg-gray-300" />

                {/* Second Logo */}
                <img
                  src={DACOlogo}
                  alt="DACO Logo"
                  className="h-10 w-auto object-contain"
                />
              </Link>

              {/* Navigation menu */}
              {!isMobile && (
                <NavigationMenu className="flex">
                  <NavigationMenuList className="gap-1">
                    {navigationLinks.map((link, index) => (
                      <NavigationMenuItem key={index}>
                        <Link
                          to={link.href}
                          className={cn(
                            "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 text-white/90 hover:text-white focus:outline-none cursor-pointer no-underline",
                            link.active &&
                              "bg-white/20 text-white font-semibold",
                          )}
                        >
                          {link.label}
                        </Link>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              )}
            </div>
          </div>

          {/* Right side Actions */}
          <div className="flex items-center gap-3">
            <Button
              className="text-sm font-medium text-white hover:bg-white/10 hover:text-white"
              onClick={onSignInClick}
              size="sm"
              variant="ghost"
              asChild={!onSignInClick}
            >
              {onSignInClick ? (
                signInText
              ) : (
                <Link to={signInHref}>{signInText}</Link>
              )}
            </Button>
            <Button
              className="text-sm font-medium px-4 h-9 rounded-md bg-white text-[oklch(0.35_0.12_290)] hover:bg-white/90 shadow-sm"
              onClick={onCtaClick}
              size="sm"
              asChild={!onCtaClick}
            >
              {onCtaClick ? ctaText : <Link to={ctaHref}>{ctaText}</Link>}
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>
    );
  },
);

Navbar.displayName = "Navbar";
