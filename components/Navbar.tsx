"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Sparkles, User as UserIcon } from "lucide-react";
import SignOutButton from "@/components/SignOutButton";

interface NavbarProps {
  user?: {
    name?: string;
    email?: string;
    id?: string;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If in an active interview call (/interview/[id] but not /interview or /interview/[id]/feedback)
  // we keep the navbar clean/minimal or hidden as per user request: "Apart from the Interview Page"
  const isLiveInterviewCall =
    pathname.startsWith("/interview/") &&
    !pathname.endsWith("/feedback") &&
    pathname !== "/interview";

  if (isLiveInterviewCall) {
    return (
      <header className="w-full py-4 px-6 flex justify-between items-center border-b border-white/5 bg-dark-100/50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Intuiprep Logo" width={32} height={28} />
          <span className="font-bold text-lg text-primary-100 tracking-tight">Intuiprep</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-medium animate-pulse">
            Live Interview in Session
          </span>
          <SignOutButton />
        </div>
      </header>
    );
  }

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "About Us", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-dark-100/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-200 to-primary-100/30 flex items-center justify-center shadow-lg shadow-primary-200/20 group-hover:scale-105 transition-transform">
            <Image src="/logo.svg" alt="Intuiprep Logo" width={26} height={26} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-primary-100 transition-colors">
            Intuiprep
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary-200/20 text-primary-100 shadow-sm border border-primary-200/30"
                    : "text-light-100/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User / Auth Controls */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/interview"
                className="btn-primary text-xs px-4 py-2 rounded-full flex items-center gap-1.5 shadow-md shadow-primary-200/20 hover:scale-105 transition-transform"
              >
                <Sparkles size={14} />
                Practice Interview
              </Link>

              <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
                <div className="w-8 h-8 rounded-full bg-dark-200 border border-white/10 flex items-center justify-center text-primary-100 font-semibold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
                </div>
                <span className="text-sm font-medium text-light-100/90 max-w-[120px] truncate">
                  {user.name || "Candidate"}
                </span>
                <SignOutButton />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/sign-in"
                className="px-4 py-2 rounded-full text-sm font-medium text-light-100/80 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="btn-primary text-sm px-5 py-2 rounded-full shadow-lg shadow-primary-200/20 hover:scale-105 transition-transform"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-light-100 hover:bg-white/5 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-dark-200/95 backdrop-blur-xl px-4 pt-3 pb-6 flex flex-col gap-3">
          <div className="flex flex-col gap-1 pb-3 border-b border-white/10">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-200/20 text-primary-100 font-semibold"
                      : "text-light-100/70 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {user ? (
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/[0.03]">
                <div className="w-8 h-8 rounded-full bg-dark-300 border border-white/10 flex items-center justify-center text-primary-100 text-xs font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{user.name}</span>
                  <span className="text-xs text-light-100/50">{user.email}</span>
                </div>
              </div>

              <Link
                href="/interview"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary text-center py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Sparkles size={16} />
                Practice Interview
              </Link>

              <div className="w-full flex justify-end">
                <SignOutButton />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center rounded-xl text-sm font-medium bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary w-full py-2.5 text-center rounded-xl text-sm font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
