"use server"

import { queryItems, createItem, deleteItem } from "@/lib/cosmosdb"
import { ProjectApiKey } from "@/types/models"
import { generateApiKey, generateId } from "@/lib/auth"
import { checkProjectPermission } from "./projects"

const API_KEY_CONTAINER = "project_api_keys"

/**
 * Create a new API key for a project
 */
export async function createProjectApiKey(
  projectId: string,
  userId: string
): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  try {
    // Check permission (owner or editor)
    const permission = await checkProjectPermission(projectId, userId)
    if (permission !== "owner" && permission !== "editor") {
      return { success: false, error: "Insufficient permissions" }
    }

    const apiKey = generateApiKey()
    const projectApiKey: ProjectApiKey = {
      id: generateId(),
      projectId,
      userId,
      apiKey,
      createdAt: new Date().toISOString(),
    }

    await createItem(API_KEY_CONTAINER, projectApiKey)
    return { success: true, apiKey }
  } catch (error) {
    console.error("Error creating API key:", error)
    return { success: false, error: "Failed to create API key" }
  }
}

/**
 * Get API keys for a project
 */
export async function getApiKeysForProject(projectId: string): Promise<ProjectApiKey[]> {
  try {
    const apiKeys = await queryItems<ProjectApiKey>(
      API_KEY_CONTAINER,
      "SELECT * FROM c WHERE c.projectId = @projectId",
      [{ name: "@projectId", value: projectId }]
    )
    return apiKeys
  } catch (error) {
    console.error("Error getting API keys:", error)
    return []
  }
}

/**
 * Validate API key and return project ID
 */
export async function validateApiKey(apiKey: string): Promise<string | null> {
  try {
    const apiKeys = await queryItems<ProjectApiKey>(
      API_KEY_CONTAINER,
      "SELECT * FROM c WHERE c.apiKey = @apiKey",
      [{ name: "@apiKey", value: apiKey }]
    )
    
    if (apiKeys.length === 0) {
      return null
    }

    return apiKeys[0].projectId
  } catch (error) {
    console.error("Error validating API key:", error)
    return null
  }
}

/**
 * Delete API key
 */
export async function deleteApiKey(
  apiKeyId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKeys = await queryItems<ProjectApiKey>(
      API_KEY_CONTAINER,
      "SELECT * FROM c WHERE c.id = @id",
      [{ name: "@id", value: apiKeyId }]
    )

    if (apiKeys.length === 0) {
      return { success: false, error: "API key not found" }
    }

    const apiKey = apiKeys[0]

    // Check permission
    const permission = await checkProjectPermission(apiKey.projectId, userId)
    if (permission !== "owner" && permission !== "editor") {
      return { success: false, error: "Insufficient permissions" }
    }

    await deleteItem(API_KEY_CONTAINER, apiKeyId)
    return { success: true }
  } catch (error) {
    console.error("Error deleting API key:", error)
    return { success: false, error: "Failed to delete API key" }
  }
}
