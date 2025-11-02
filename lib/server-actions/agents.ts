"use server"

import { queryItems, createItem, updateItem, deleteItem } from "@/lib/cosmosdb"
import { Agent } from "@/types/models"
import { generateId } from "@/lib/auth"
import { checkProjectPermission } from "./projects"

const AGENT_CONTAINER = "agents"

/**
 * Create a new agent
 */
export async function createAgent(
  projectId: string,
  userId: string,
  name: string,
  description: string
): Promise<{ success: boolean; agentId?: string; error?: string }> {
  try {
    // Check permission (owner or editor)
    const permission = await checkProjectPermission(projectId, userId)
    if (permission !== "owner" && permission !== "editor") {
      return { success: false, error: "Insufficient permissions" }
    }

    const agent: Agent = {
      id: generateId(),
      name,
      description,
      projectId,
      activeAgentPromptId: null,
      createdAt: new Date().toISOString(),
    }

    await createItem(AGENT_CONTAINER, agent)
    return { success: true, agentId: agent.id }
  } catch (error) {
    console.error("Error creating agent:", error)
    return { success: false, error: "Failed to create agent" }
  }
}

/**
 * Get agents for a project
 */
export async function getAgentsForProject(projectId: string): Promise<Agent[]> {
  try {
    const agents = await queryItems<Agent>(
      AGENT_CONTAINER,
      "SELECT * FROM c WHERE c.projectId = @projectId",
      [{ name: "@projectId", value: projectId }]
    )
    return agents
  } catch (error) {
    console.error("Error getting agents:", error)
    return []
  }
}

/**
 * Get agent by ID
 */
export async function getAgentById(agentId: string): Promise<Agent | null> {
  try {
    const agents = await queryItems<Agent>(
      AGENT_CONTAINER,
      "SELECT * FROM c WHERE c.id = @id",
      [{ name: "@id", value: agentId }]
    )
    return agents.length > 0 ? agents[0] : null
  } catch (error) {
    console.error("Error getting agent:", error)
    return null
  }
}

/**
 * Get agent by name within a project
 */
export async function getAgentByName(
  projectId: string,
  agentName: string
): Promise<Agent | null> {
  try {
    const agents = await queryItems<Agent>(
      AGENT_CONTAINER,
      "SELECT * FROM c WHERE c.projectId = @projectId AND c.name = @name",
      [
        { name: "@projectId", value: projectId },
        { name: "@name", value: agentName },
      ]
    )
    return agents.length > 0 ? agents[0] : null
  } catch (error) {
    console.error("Error getting agent by name:", error)
    return null
  }
}

/**
 * Update agent
 */
export async function updateAgent(
  agentId: string,
  userId: string,
  data: { name?: string; description?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const agent = await getAgentById(agentId)
    if (!agent) {
      return { success: false, error: "Agent not found" }
    }

    // Check permission
    const permission = await checkProjectPermission(agent.projectId, userId)
    if (permission !== "owner" && permission !== "editor") {
      return { success: false, error: "Insufficient permissions" }
    }

    if (data.name) agent.name = data.name
    if (data.description) agent.description = data.description

    await updateItem(AGENT_CONTAINER, agentId, agent)
    return { success: true }
  } catch (error) {
    console.error("Error updating agent:", error)
    return { success: false, error: "Failed to update agent" }
  }
}

/**
 * Delete agent
 */
export async function deleteAgent(
  agentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const agent = await getAgentById(agentId)
    if (!agent) {
      return { success: false, error: "Agent not found" }
    }

    // Check permission
    const permission = await checkProjectPermission(agent.projectId, userId)
    if (permission !== "owner" && permission !== "editor") {
      return { success: false, error: "Insufficient permissions" }
    }

    await deleteItem(AGENT_CONTAINER, agentId)
    return { success: true }
  } catch (error) {
    console.error("Error deleting agent:", error)
    return { success: false, error: "Failed to delete agent" }
  }
}

/**
 * Set active prompt for an agent
 */
export async function setActivePrompt(
  agentId: string,
  userId: string,
  promptId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const agent = await getAgentById(agentId)
    if (!agent) {
      return { success: false, error: "Agent not found" }
    }

    // Check permission (owner or editor)
    const permission = await checkProjectPermission(agent.projectId, userId)
    if (permission !== "owner" && permission !== "editor") {
      return { success: false, error: "Insufficient permissions" }
    }

    agent.activeAgentPromptId = promptId

    await updateItem(AGENT_CONTAINER, agentId, agent)
    return { success: true }
  } catch (error) {
    console.error("Error setting active prompt:", error)
    return { success: false, error: "Failed to set active prompt" }
  }
}
