"use server"

import { queryItems, createItem, updateItem, deleteItem } from "@/lib/cosmosdb"
import { AgentPrompt } from "@/types/models"
import { generateId } from "@/lib/auth"
import { getAgentById } from "./agents"
import { checkProjectPermission } from "./projects"

const PROMPT_CONTAINER = "agent_prompts"

/**
 * Create a new prompt
 */
export async function createPrompt(
  agentId: string,
  userId: string,
  promptText: string
): Promise<{ success: boolean; promptId?: string; error?: string }> {
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

    const prompt: AgentPrompt = {
      id: generateId(),
      agentId,
      promptText,
      createdAt: new Date().toISOString(),
    }

    await createItem(PROMPT_CONTAINER, prompt)
    return { success: true, promptId: prompt.id }
  } catch (error) {
    console.error("Error creating prompt:", error)
    return { success: false, error: "Failed to create prompt" }
  }
}

/**
 * Get prompts for an agent
 */
export async function getPromptsForAgent(agentId: string): Promise<AgentPrompt[]> {
  try {
    const prompts = await queryItems<AgentPrompt>(
      PROMPT_CONTAINER,
      "SELECT * FROM c WHERE c.agentId = @agentId ORDER BY c.createdAt DESC",
      [{ name: "@agentId", value: agentId }]
    )
    return prompts
  } catch (error) {
    console.error("Error getting prompts:", error)
    return []
  }
}

/**
 * Get prompt by ID
 */
export async function getPromptById(promptId: string): Promise<AgentPrompt | null> {
  try {
    const prompts = await queryItems<AgentPrompt>(
      PROMPT_CONTAINER,
      "SELECT * FROM c WHERE c.id = @id",
      [{ name: "@id", value: promptId }]
    )
    return prompts.length > 0 ? prompts[0] : null
  } catch (error) {
    console.error("Error getting prompt:", error)
    return null
  }
}

/**
 * Update prompt
 */
export async function updatePrompt(
  promptId: string,
  userId: string,
  promptText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const prompt = await getPromptById(promptId)
    if (!prompt) {
      return { success: false, error: "Prompt not found" }
    }

    const agent = await getAgentById(prompt.agentId)
    if (!agent) {
      return { success: false, error: "Agent not found" }
    }

    // Check if this prompt is active
    if (agent.activeAgentPromptId === promptId) {
      return { success: false, error: "Cannot edit active prompt" }
    }

    // Check permission
    const permission = await checkProjectPermission(agent.projectId, userId)
    if (permission !== "owner" && permission !== "editor") {
      return { success: false, error: "Insufficient permissions" }
    }

    prompt.promptText = promptText

    await updateItem(PROMPT_CONTAINER, promptId, prompt)
    return { success: true }
  } catch (error) {
    console.error("Error updating prompt:", error)
    return { success: false, error: "Failed to update prompt" }
  }
}

/**
 * Delete prompt
 */
export async function deletePrompt(
  promptId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const prompt = await getPromptById(promptId)
    if (!prompt) {
      return { success: false, error: "Prompt not found" }
    }

    const agent = await getAgentById(prompt.agentId)
    if (!agent) {
      return { success: false, error: "Agent not found" }
    }

    // Check if this prompt is active
    if (agent.activeAgentPromptId === promptId) {
      return { success: false, error: "Cannot delete active prompt" }
    }

    // Check permission
    const permission = await checkProjectPermission(agent.projectId, userId)
    if (permission !== "owner" && permission !== "editor") {
      return { success: false, error: "Insufficient permissions" }
    }

    await deleteItem(PROMPT_CONTAINER, promptId)
    return { success: true }
  } catch (error) {
    console.error("Error deleting prompt:", error)
    return { success: false, error: "Failed to delete prompt" }
  }
}
