"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Prompty</h1>
          <div className="flex items-center gap-4">
            {status === "authenticated" ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {session.user?.email}
                </span>
                <Button onClick={() => signOut()} variant="outline">
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/auth/signin">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              Agent Prompt Management
            </h2>
            <p className="text-muted-foreground">
              A Next.js application with Tailwind CSS, Shadcn UI, NextAuth v4, and Azure CosmosDB
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-6 border rounded-lg space-y-2">
              <h3 className="text-xl font-semibold">🎨 Tailwind CSS</h3>
              <p className="text-sm text-muted-foreground">
                Utility-first CSS framework for rapid UI development
              </p>
            </div>

            <div className="p-6 border rounded-lg space-y-2">
              <h3 className="text-xl font-semibold">🧩 Shadcn UI</h3>
              <p className="text-sm text-muted-foreground">
                Beautifully designed components built with Radix UI
              </p>
            </div>

            <div className="p-6 border rounded-lg space-y-2">
              <h3 className="text-xl font-semibold">🔐 NextAuth v4</h3>
              <p className="text-sm text-muted-foreground">
                Authentication with JWT strategy for secure sessions
              </p>
            </div>

            <div className="p-6 border rounded-lg space-y-2">
              <h3 className="text-xl font-semibold">🗄️ Azure CosmosDB</h3>
              <p className="text-sm text-muted-foreground">
                Globally distributed database service for scalable applications
              </p>
            </div>
          </div>

          {status === "authenticated" ? (
            <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm">
                ✅ You are authenticated! Welcome, {session.user?.email}
              </p>
            </div>
          ) : (
            <div className="p-6 bg-muted border rounded-lg">
              <p className="text-sm text-muted-foreground">
                Sign in to access protected features
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built with Next.js, Tailwind CSS, Shadcn UI, NextAuth, and Azure CosmosDB
        </div>
      </footer>
    </div>
  )
}
