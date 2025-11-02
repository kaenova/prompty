"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { checkUsersExist } from "@/lib/server-actions/users"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [checkingUsers, setCheckingUsers] = useState(true)

  useEffect(() => {
    const checkUsers = async () => {
      const usersExist = await checkUsersExist()
      if (!usersExist) {
        router.push("/init")
      } else {
        setCheckingUsers(false)
      }
    }
    checkUsers()
  }, [router])

  useEffect(() => {
    if (status === "authenticated" && !checkingUsers) {
      router.push("/dashboard")
    }
  }, [status, router, checkingUsers])

  if (checkingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Prompty ✨</h1>
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
              Real-time prompt management for your AI agents
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-6 border rounded-lg space-y-2">
              <h3 className="text-xl font-semibold">🤖 Agent Management</h3>
              <p className="text-sm text-muted-foreground">
                Create and manage AI agents with customizable prompts
              </p>
            </div>

            <div className="p-6 border rounded-lg space-y-2">
              <h3 className="text-xl font-semibold">⚡ Real-time Updates</h3>
              <p className="text-sm text-muted-foreground">
                Update prompts in real-time with Python SDK integration
              </p>
            </div>

            <div className="p-6 border rounded-lg space-y-2">
              <h3 className="text-xl font-semibold">👥 Team Collaboration</h3>
              <p className="text-sm text-muted-foreground">
                Share projects with role-based permissions
              </p>
            </div>

            <div className="p-6 border rounded-lg space-y-2">
              <h3 className="text-xl font-semibold">🔐 Secure API Keys</h3>
              <p className="text-sm text-muted-foreground">
                Manage API keys for secure client access
              </p>
            </div>
          </div>

          {status === "unauthenticated" && (
            <div className="p-6 bg-muted border rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Sign in to start managing your prompts
              </p>
              <Link href="/auth/signin">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built with Next.js, Tailwind CSS, and Azure CosmosDB
        </div>
      </footer>
    </div>
  )
}
