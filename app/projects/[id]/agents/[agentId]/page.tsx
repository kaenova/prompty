"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { checkProjectPermission } from "@/lib/server-actions/projects"
import { getAgentById, setActivePrompt } from "@/lib/server-actions/agents"
import {
  getPromptsForAgent,
  createPrompt,
  updatePrompt,
  deletePrompt,
} from "@/lib/server-actions/prompts"
import { Agent, AgentPrompt } from "@/types/models"

export default function AgentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const agentId = params.agentId as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [prompts, setPrompts] = useState<AgentPrompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<AgentPrompt | null>(null)
  const [permission, setPermission] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [promptText, setPromptText] = useState("")
  const [isNewPrompt, setIsNewPrompt] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) return

      const [agentData, agentPrompts] = await Promise.all([
        getAgentById(agentId),
        getPromptsForAgent(agentId),
      ])

      if (!agentData) {
        router.push(`/projects/${projectId}`)
        return
      }

      const userPermission = await checkProjectPermission(
        agentData.projectId,
        session.user.id
      )

      if (!userPermission) {
        router.push("/dashboard")
        return
      }

      setAgent(agentData)
      setPrompts(agentPrompts)
      setPermission(userPermission)
      setLoading(false)

      // Select first prompt if available
      if (agentPrompts.length > 0 && !selectedPrompt) {
        setSelectedPrompt(agentPrompts[0])
        setPromptText(agentPrompts[0].promptText)
      }
    }

    if (session) {
      loadData()
    }
  }, [session, agentId, projectId, router, selectedPrompt])

  const handleSelectPrompt = (prompt: AgentPrompt) => {
    setSelectedPrompt(prompt)
    setPromptText(prompt.promptText)
    setIsNewPrompt(false)
  }

  const handleNewPrompt = () => {
    setSelectedPrompt(null)
    setPromptText("")
    setIsNewPrompt(true)
  }

  const handleSavePrompt = async () => {
    if (!session?.user?.id) return

    if (isNewPrompt) {
      const result = await createPrompt(agentId, session.user.id, promptText)
      if (result.success) {
        const agentPrompts = await getPromptsForAgent(agentId)
        setPrompts(agentPrompts)
        setIsNewPrompt(false)
        // Select the newly created prompt
        if (result.promptId) {
          const newPrompt = agentPrompts.find((p) => p.id === result.promptId)
          if (newPrompt) {
            setSelectedPrompt(newPrompt)
          }
        }
      }
    } else if (selectedPrompt) {
      const result = await updatePrompt(
        selectedPrompt.id,
        session.user.id,
        promptText
      )
      if (result.success) {
        const agentPrompts = await getPromptsForAgent(agentId)
        setPrompts(agentPrompts)
        const updated = agentPrompts.find((p) => p.id === selectedPrompt.id)
        if (updated) {
          setSelectedPrompt(updated)
        }
      } else {
        alert(result.error || "Failed to update prompt")
      }
    }
  }

  const handleDeletePrompt = async () => {
    if (!session?.user?.id || !selectedPrompt) return
    if (!confirm("Are you sure you want to delete this prompt?")) return

    const result = await deletePrompt(selectedPrompt.id, session.user.id)
    if (result.success) {
      const agentPrompts = await getPromptsForAgent(agentId)
      setPrompts(agentPrompts)
      setSelectedPrompt(null)
      setPromptText("")
      setIsNewPrompt(false)
    } else {
      alert(result.error || "Failed to delete prompt")
    }
  }

  const handleActivatePrompt = async () => {
    if (!session?.user?.id || !selectedPrompt) return

    const result = await setActivePrompt(
      agentId,
      session.user.id,
      selectedPrompt.id
    )

    if (result.success) {
      const agentData = await getAgentById(agentId)
      setAgent(agentData)
    }
  }

  const handleDeactivatePrompt = async () => {
    if (!session?.user?.id) return

    const result = await setActivePrompt(agentId, session.user.id, null)

    if (result.success) {
      const agentData = await getAgentById(agentId)
      setAgent(agentData)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!session || !agent) {
    return null
  }

  const canEdit = permission === "owner" || permission === "editor"
  const isActivePrompt = selectedPrompt?.id === agent.activeAgentPromptId

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold">Prompty ✨</h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${projectId}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              ← Back to Project
            </Link>
            <span className="text-sm text-muted-foreground">
              {session.user?.email}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{agent.name}</h2>
            <p className="text-muted-foreground">{agent.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
            {/* Left: Prompt List */}
            <div className="border rounded-lg p-4 space-y-4 overflow-y-auto">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Prompts</h3>
                {canEdit && (
                  <Button size="sm" onClick={handleNewPrompt}>
                    New
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {prompts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No prompts yet
                  </p>
                ) : (
                  prompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handleSelectPrompt(prompt)}
                      className={`w-full text-left p-3 border rounded-lg transition-colors ${
                        selectedPrompt?.id === prompt.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm truncate flex-1">
                          {prompt.promptText.substring(0, 50)}...
                        </p>
                        {prompt.id === agent.activeAgentPromptId && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded ml-2">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(prompt.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: Prompt Editor */}
            <div className="md:col-span-2 border rounded-lg p-4 space-y-4 flex flex-col">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">
                  {isNewPrompt
                    ? "New Prompt"
                    : selectedPrompt
                    ? "Edit Prompt"
                    : "Select a Prompt"}
                </h3>
                <div className="flex gap-2">
                  {canEdit && selectedPrompt && !isActivePrompt && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDeletePrompt}
                      >
                        Delete
                      </Button>
                      {agent.activeAgentPromptId !== selectedPrompt.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleActivatePrompt}
                        >
                          Activate
                        </Button>
                      )}
                    </>
                  )}
                  {canEdit && isActivePrompt && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeactivatePrompt}
                    >
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>

              {(selectedPrompt || isNewPrompt) && (
                <>
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="flex-1 w-full px-3 py-2 border rounded-md bg-background resize-none"
                    placeholder="Enter your prompt here..."
                    disabled={!canEdit || isActivePrompt}
                  />
                  {canEdit && !isActivePrompt && (
                    <div className="flex justify-end">
                      <Button onClick={handleSavePrompt}>Save</Button>
                    </div>
                  )}
                  {isActivePrompt && (
                    <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-sm">
                      This prompt is currently active and cannot be edited or
                      deleted. Deactivate it first.
                    </div>
                  )}
                  {!canEdit && (
                    <div className="p-3 bg-muted border rounded text-sm">
                      You have view-only access to this prompt.
                    </div>
                  )}
                </>
              )}

              {!selectedPrompt && !isNewPrompt && (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  Select a prompt to view or edit
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
