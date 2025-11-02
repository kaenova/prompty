"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  getProjectById, 
  checkProjectPermission,
  addUserToProject 
} from "@/lib/server-actions/projects"
import { 
  getAgentsForProject, 
  createAgent, 
  deleteAgent 
} from "@/lib/server-actions/agents"
import { 
  getApiKeysForProject, 
  createProjectApiKey, 
  deleteApiKey 
} from "@/lib/server-actions/api-keys"
import { Project, Agent, ProjectApiKey } from "@/types/models"

export default function ProjectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [apiKeys, setApiKeys] = useState<ProjectApiKey[]>([])
  const [permission, setPermission] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"agents" | "apikeys" | "settings">("agents")

  const [showNewAgent, setShowNewAgent] = useState(false)
  const [newAgentData, setNewAgentData] = useState({
    name: "",
    description: "",
  })

  const [showAddUser, setShowAddUser] = useState(false)
  const [addUserData, setAddUserData] = useState({
    email: "",
    permission: "viewer" as "editor" | "viewer",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    const loadData = async () => {
      if (!session?.user?.id) return

      const [projectData, userPermission, projectAgents, projectApiKeys] = await Promise.all([
        getProjectById(projectId),
        checkProjectPermission(projectId, session.user.id),
        getAgentsForProject(projectId),
        getApiKeysForProject(projectId),
      ])

      if (!projectData || !userPermission) {
        router.push("/dashboard")
        return
      }

      setProject(projectData)
      setPermission(userPermission)
      setAgents(projectAgents)
      setApiKeys(projectApiKeys)
      setLoading(false)
    }

    if (session) {
      loadData()
    }
  }, [session, projectId, router])

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return

    const result = await createAgent(
      projectId,
      session.user.id,
      newAgentData.name,
      newAgentData.description
    )

    if (result.success) {
      const projectAgents = await getAgentsForProject(projectId)
      setAgents(projectAgents)
      setShowNewAgent(false)
      setNewAgentData({ name: "", description: "" })
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!session?.user?.id) return
    if (!confirm("Are you sure you want to delete this agent?")) return

    const result = await deleteAgent(agentId, session.user.id)
    if (result.success) {
      const projectAgents = await getAgentsForProject(projectId)
      setAgents(projectAgents)
    }
  }

  const handleCreateApiKey = async () => {
    if (!session?.user?.id) return

    const result = await createProjectApiKey(projectId, session.user.id)
    if (result.success) {
      const projectApiKeys = await getApiKeysForProject(projectId)
      setApiKeys(projectApiKeys)
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    if (!session?.user?.id) return
    if (!confirm("Are you sure you want to delete this API key?")) return

    const result = await deleteApiKey(keyId, session.user.id)
    if (result.success) {
      const projectApiKeys = await getApiKeysForProject(projectId)
      setApiKeys(projectApiKeys)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return

    const result = await addUserToProject(
      projectId,
      session.user.id,
      addUserData.email,
      addUserData.permission
    )

    if (result.success) {
      const projectData = await getProjectById(projectId)
      setProject(projectData)
      setShowAddUser(false)
      setAddUserData({ email: "", permission: "viewer" })
      alert("User added successfully!")
    } else {
      alert(result.error || "Failed to add user")
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!session || !project) {
    return null
  }

  const canEdit = permission === "owner" || permission === "editor"

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/dashboard">
            <h1 className="text-2xl font-bold">Prompty ✨</h1>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user?.email}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">{project.name}</h2>
              <span className="text-sm px-2 py-1 bg-primary/10 rounded">
                {permission}
              </span>
            </div>
            <p className="text-muted-foreground">{project.description}</p>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex gap-6">
              <button
                className={`pb-2 ${
                  activeTab === "agents"
                    ? "border-b-2 border-primary font-semibold"
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("agents")}
              >
                Agents
              </button>
              <button
                className={`pb-2 ${
                  activeTab === "apikeys"
                    ? "border-b-2 border-primary font-semibold"
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("apikeys")}
              >
                API Keys
              </button>
              <button
                className={`pb-2 ${
                  activeTab === "settings"
                    ? "border-b-2 border-primary font-semibold"
                    : "text-muted-foreground"
                }`}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
            </div>
          </div>

          {/* Agents Tab */}
          {activeTab === "agents" && (
            <div className="space-y-4">
              {canEdit && (
                <Button onClick={() => setShowNewAgent(true)}>
                  New Agent
                </Button>
              )}

              {showNewAgent && (
                <div className="p-6 border rounded-lg space-y-4 bg-card">
                  <h3 className="font-semibold">Create New Agent</h3>
                  <form onSubmit={handleCreateAgent} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <input
                        type="text"
                        value={newAgentData.name}
                        onChange={(e) =>
                          setNewAgentData({
                            ...newAgentData,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md bg-background mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        value={newAgentData.description}
                        onChange={(e) =>
                          setNewAgentData({
                            ...newAgentData,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md bg-background mt-1"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Create</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewAgent(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-4">
                {agents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No agents yet. Create your first agent!
                  </p>
                ) : (
                  agents.map((agent) => (
                    <div
                      key={agent.id}
                      className="p-6 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link
                            href={`/projects/${projectId}/agents/${agent.id}`}
                            className="text-lg font-semibold hover:underline"
                          >
                            {agent.name}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            {agent.description}
                          </p>
                          {agent.activeAgentPromptId && (
                            <span className="inline-block mt-2 text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                              Active
                            </span>
                          )}
                        </div>
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAgent(agent.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === "apikeys" && (
            <div className="space-y-4">
              {canEdit && (
                <Button onClick={handleCreateApiKey}>
                  Generate New API Key
                </Button>
              )}

              <div className="space-y-4">
                {apiKeys.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No API keys yet. Generate your first API key!
                  </p>
                ) : (
                  apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="p-4 border rounded-lg flex justify-between items-center"
                    >
                      <div className="flex-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {key.apiKey}
                        </code>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteApiKey(key.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="p-6 border rounded-lg space-y-4">
                <h3 className="font-semibold">Project Members</h3>
                
                {canEdit && (
                  <>
                    <Button onClick={() => setShowAddUser(true)}>
                      Add User
                    </Button>

                    {showAddUser && (
                      <form onSubmit={handleAddUser} className="space-y-4 mt-4">
                        <div>
                          <label className="text-sm font-medium">User Email</label>
                          <input
                            type="email"
                            value={addUserData.email}
                            onChange={(e) =>
                              setAddUserData({
                                ...addUserData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border rounded-md bg-background mt-1"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Permission</label>
                          <select
                            value={addUserData.permission}
                            onChange={(e) =>
                              setAddUserData({
                                ...addUserData,
                                permission: e.target.value as "editor" | "viewer",
                              })
                            }
                            className="w-full px-3 py-2 border rounded-md bg-background mt-1"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">Add</Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowAddUser(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </>
                )}

                <div className="mt-4 space-y-2">
                  {Object.entries(project.permissions).map(([userId, perm]) => (
                    <div
                      key={userId}
                      className="flex justify-between items-center p-2 border rounded"
                    >
                      <span className="text-sm">{userId}</span>
                      <span className="text-xs px-2 py-1 bg-muted rounded">
                        {perm}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
