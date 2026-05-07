"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from '@/context/auth-context'
import { ModeToggle } from "@/components/mode-toggle"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  const publicLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#ai-demo", label: "AI Demo" },
  ]

  const privateLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/forum", label: "Forum" },
    { href: "/schedule", label: "Schedule" },
    { href: "/materials", label: "Materials" },
    { href: "/badges", label: "Badges" },
    { href: "/profile", label: "Profile" },
  ]

  const navLinks = user ? privateLinks : publicLinks

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold text-foreground">AceAI StudyHub</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {mounted && navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ModeToggle />
          {mounted ? (
            user ? (
              <>
                <span className="rounded-full border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground">
                  {user.username}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign up free</Button>
                </Link>
              </>
            )
          ) : (
            <div className="flex gap-3 opacity-0">
              <Button variant="ghost" size="sm">Log in</Button>
              <Button size="sm">Sign up free</Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="flex flex-col gap-2 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2">
              {user ? (
                <>
                  <span className="inline-flex items-center justify-center rounded-full border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground w-full text-center">
                    {user.username}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" className="w-full">
                      Sign up free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
