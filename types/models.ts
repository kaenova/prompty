// User roles
export type UserRole = "admin" | "user"

// User model
export interface User {
  id: string
  name: string
  email: string
  password: string // hashed
  role: UserRole
  createdAt: string
}

// Project permissions
export type ProjectPermission = "owner" | "editor" | "viewer"

// Project model
export interface Project {
  id: string
  name: string
  description: string
  permissions: Record<string, ProjectPermission> // userId -> permission
  createdAt: string
}

// Agent model
export interface Agent {
  id: string
  name: string
  description: string
  projectId: string
  activeAgentPromptId: string | null
  createdAt: string
}

// Agent Prompt model
export interface AgentPrompt {
  id: string
  agentId: string
  promptText: string
  createdAt: string
}

// Project API Key model
export interface ProjectApiKey {
  id: string
  projectId: string
  userId: string // who created it
  apiKey: string
  description?: string
  createdAt: string
}

// User invite model
export interface UserInvite {
  id: string
  name: string
  role: UserRole
  token: string
  createdBy: string
  expiresAt: string
  createdAt: string
  used: boolean
}
