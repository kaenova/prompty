"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { 
  getProjectById, 
  checkProjectPermission
} from "@/lib/server-actions/projects"
import { 
  getAgentsForProject
} from "@/lib/server-actions/agents"
import { 
  getApiKeysForProject
} from "@/lib/server-actions/api-keys"
import { Project, Agent, ProjectApiKey } from "@/types/models"
import { AgentsTab } from "./_components/agents-tab"
import { ApiKeysTab } from "./_components/api-keys-tab"
import { SettingsTab } from "./_components/settings-tab"

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

  const handleAgentsChange = (updatedAgents: Agent[]) => {
    setAgents(updatedAgents)
  }

  const handleApiKeysChange = (updatedApiKeys: ProjectApiKey[]) => {
    setApiKeys(updatedApiKeys)
  }

  const handleProjectChange = (updatedProject: Project) => {
    setProject(updatedProject)
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
            <AgentsTab
              projectId={projectId}
              userId={session.user.id}
              agents={agents}
              canEdit={permission === "owner" || permission === "editor"}
              onAgentsChange={handleAgentsChange}
            />
          )}

          {/* API Keys Tab */}
          {activeTab === "apikeys" && (
            <ApiKeysTab
              projectId={projectId}
              userId={session.user.id}
              apiKeys={apiKeys}
              canEdit={permission === "owner" || permission === "editor"}
              onApiKeysChange={handleApiKeysChange}
            />
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && project && (
            <SettingsTab
              projectId={projectId}
              userId={session.user.id}
              project={project}
              canEdit={permission === "owner" || permission === "editor"}
              onProjectChange={handleProjectChange}
            />
          )}
        </div>
      </main>
    </div>
  )
}
