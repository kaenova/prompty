"use server"

import { queryItems, createItem, updateItem, deleteItem, getContainer, CONTAINER_NAMES } from "@/lib/cosmosdb"
import { Project } from "@/types/models"
import { generateId } from "@/lib/auth"

/**
 * Create a new project
 */
export async function createProject(
  name: string,
  description: string,
  userId: string
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  try {
    const project: Project = {
      id: generateId(),
      name,
      description,
      permissions: {
        [userId]: "owner",
      },
      createdAt: new Date().toISOString(),
    }

    await createItem(CONTAINER_NAMES.PROJECTS, project)
    return { success: true, projectId: project.id }
  } catch (error) {
    console.error("Error creating project:", error)
    return { success: false, error: "Failed to create project" }
  }
}

/**
 * Get projects for a user
 */
export async function getProjectsForUser(userId: string): Promise<Project[]> {
  try {
    const projects = await queryItems<Project>(
      CONTAINER_NAMES.PROJECTS,
      "SELECT * FROM c"
    )
    
    // Filter projects where user has permission
    return projects.filter(p => p.permissions[userId])
  } catch (error) {
    console.error("Error getting projects:", error)
    return []
  }
}

/**
 * Get project by ID
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    const projects = await queryItems<Project>(
      CONTAINER_NAMES.PROJECTS,
      "SELECT * FROM c WHERE c.id = @id",
      [{ name: "@id", value: projectId }]
    )
    return projects.length > 0 ? projects[0] : null
  } catch (error) {
    console.error("Error getting project:", error)
    return null
  }
}

/**
 * Check user permission for a project
 */
export async function checkProjectPermission(
  projectId: string,
  userId: string
): Promise<"owner" | "editor" | "viewer" | null> {
  const project = await getProjectById(projectId)
  if (!project) return null
  return project.permissions[userId] || null
}

/**
 * Add user to project
 */
export async function addUserToProject(
  projectId: string,
  userId: string,
  targetEmail: string,
  permission: "editor" | "viewer"
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if current user is owner or editor
    const currentPermission = await checkProjectPermission(projectId, userId)
    if (currentPermission !== "owner" && currentPermission !== "editor") {
      return { success: false, error: "Insufficient permissions" }
    }

    // Get target user
    const { getUserByEmail } = await import("./users")
    const targetUser = await getUserByEmail(targetEmail)
    if (!targetUser) {
      return { success: false, error: "User not found" }
    }

    // Get project
    const project = await getProjectById(projectId)
    if (!project) {
      return { success: false, error: "Project not found" }
    }

    // Update permissions
    project.permissions[targetUser.id] = permission

    const container = await getContainer(CONTAINER_NAMES.PROJECTS)
    await container.item(project.id, project.id).replace(project)

    return { success: true }
  } catch (error) {
    console.error("Error adding user to project:", error)
    return { success: false, error: "Failed to add user" }
  }
}

/**
 * Update project
 */
export async function updateProject(
  projectId: string,
  userId: string,
  data: { name?: string; description?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is owner
    const permission = await checkProjectPermission(projectId, userId)
    if (permission !== "owner") {
      return { success: false, error: "Only owners can update project" }
    }

    const project = await getProjectById(projectId)
    if (!project) {
      return { success: false, error: "Project not found" }
    }

    if (data.name) project.name = data.name
    if (data.description) project.description = data.description

    await updateItem(CONTAINER_NAMES.PROJECTS, projectId, project)
    return { success: true }
  } catch (error) {
    console.error("Error updating project:", error)
    return { success: false, error: "Failed to update project" }
  }
}

/**
 * Delete project
 */
export async function deleteProject(
  projectId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is owner
    const permission = await checkProjectPermission(projectId, userId)
    if (permission !== "owner") {
      return { success: false, error: "Only owners can delete project" }
    }

    await deleteItem(CONTAINER_NAMES.PROJECTS, projectId)
    return { success: true }
  } catch (error) {
    console.error("Error deleting project:", error)
    return { success: false, error: "Failed to delete project" }
  }
}

/**
 * Update member permission in project
 */
export async function updateMemberPermission(
  projectId: string,
  userId: string,
  memberId: string,
  newPermission: "owner" | "editor" | "viewer"
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if current user is owner
    const currentPermission = await checkProjectPermission(projectId, userId)
    if (currentPermission !== "owner") {
      return { success: false, error: "Only project owners can update member permissions" }
    }

    // Cannot change own permission
    if (userId === memberId) {
      return { success: false, error: "Cannot change your own permission" }
    }

    const project = await getProjectById(projectId)
    if (!project) {
      return { success: false, error: "Project not found" }
    }

    if (!project.permissions[memberId]) {
      return { success: false, error: "Member not found in project" }
    }

    project.permissions[memberId] = newPermission
    await updateItem(CONTAINER_NAMES.PROJECTS, projectId, project)

    return { success: true }
  } catch (error) {
    console.error("Error updating member permission:", error)
    return { success: false, error: "Failed to update member permission" }
  }
}

/**
 * Remove member from project
 */
export async function removeMemberFromProject(
  projectId: string,
  userId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if current user is owner
    const currentPermission = await checkProjectPermission(projectId, userId)
    if (currentPermission !== "owner") {
      return { success: false, error: "Only project owners can remove members" }
    }

    // Cannot remove yourself
    if (userId === memberId) {
      return { success: false, error: "Cannot remove yourself from the project" }
    }

    const project = await getProjectById(projectId)
    if (!project) {
      return { success: false, error: "Project not found" }
    }

    if (!project.permissions[memberId]) {
      return { success: false, error: "Member not found in project" }
    }

    delete project.permissions[memberId]
    await updateItem(CONTAINER_NAMES.PROJECTS, projectId, project)

    return { success: true }
  } catch (error) {
    console.error("Error removing member from project:", error)
    return { success: false, error: "Failed to remove member from project" }
  }
}
