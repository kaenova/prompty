"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  getAgentsForProject, 
  createAgent, 
  deleteAgent 
} from "@/lib/server-actions/agents"
import { Agent } from "@/types/models"

interface AgentsTabProps {
  projectId: string
  userId: string
  agents: Agent[]
  canEdit: boolean
  onAgentsChange: (agents: Agent[]) => void
}

export function AgentsTab({
  projectId,
  userId,
  agents,
  canEdit,
  onAgentsChange,
}: AgentsTabProps) {
  const [showNewAgent, setShowNewAgent] = useState(false)
  const [newAgentData, setNewAgentData] = useState({
    name: "",
    description: "",
  })

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await createAgent(
      projectId,
      userId,
      newAgentData.name,
      newAgentData.description
    )

    if (result.success) {
      const projectAgents = await getAgentsForProject(projectId)
      onAgentsChange(projectAgents)
      setShowNewAgent(false)
      setNewAgentData({ name: "", description: "" })
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return

    const result = await deleteAgent(agentId, userId)
    if (result.success) {
      const projectAgents = await getAgentsForProject(projectId)
      onAgentsChange(projectAgents)
    }
  }

  return (
    <div className="space-y-4">
      {/* Introduction Section */}
      <div className="p-4 border border-border bg-card rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">What are Agents and Prompts?</h3>
        <p className="text-sm text-muted-foreground mb-3">
          <span className="font-medium text-foreground">Agents</span> are AI-powered entities that perform specific tasks. Each agent has a unique identity and behavior defined by its assigned <span className="font-medium text-foreground">prompts</span>.
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          <span className="font-medium text-foreground">Prompts</span> are instructions and context that guide how an agent behaves. You can create multiple prompts for an agent and activate the one you want to use. Only one prompt can be active at a time.
        </p>
        <p className="text-sm text-muted-foreground">
          To get started, create an agent below and then add prompts to define its behavior.
        </p>
      </div>

      {canEdit && (
        <Button className="w-full" onClick={() => setShowNewAgent(true)}>
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
  )
}
