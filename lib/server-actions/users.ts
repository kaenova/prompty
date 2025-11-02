"use server"

import { getContainer, queryItems, createItem, CONTAINER_NAMES } from "@/lib/cosmosdb"
import { User, UserInvite } from "@/types/models"
import { hashPassword, generateToken, generateId } from "@/lib/auth"

/**
 * Check if any users exist in the system
 */
export async function checkUsersExist(): Promise<boolean> {
  try {
    const users = await queryItems<User>(CONTAINER_NAMES.USERS, "SELECT TOP 1 * FROM c")
    return users.length > 0
  } catch (error) {
    console.error("Error checking users:", error)
    return false
  }
}

/**
 * Initialize the first admin user
 */
export async function initializeAdmin(data: {
  name: string
  email: string
  password: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if users already exist
    const usersExist = await checkUsersExist()
    if (usersExist) {
      return { success: false, error: "Users already exist" }
    }

    // Create admin user
    const user: User = {
      id: generateId(),
      name: data.name,
      email: data.email,
      password: hashPassword(data.password),
      role: "admin",
      createdAt: new Date().toISOString(),
    }

    await createItem(CONTAINER_NAMES.USERS, user)
    return { success: true }
  } catch (error) {
    console.error("Error initializing admin:", error)
    return { success: false, error: "Failed to create admin user" }
  }
}

/**
 * Create a user invite
 */
export async function createUserInvite(
  name: string,
  role: "admin" | "user",
  createdBy: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const token = generateToken()
    const invite: UserInvite = {
      id: generateId(),
      name,
      role,
      token,
      createdBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      createdAt: new Date().toISOString(),
      used: false,
    }

    await createItem(CONTAINER_NAMES.USER_INVITES, invite)
    return { success: true, token }
  } catch (error) {
    console.error("Error creating invite:", error)
    return { success: false, error: "Failed to create invite" }
  }
}

/**
 * Get invite by token
 */
export async function getInviteByToken(
  token: string
): Promise<UserInvite | null> {
  try {
    const invites = await queryItems<UserInvite>(
      CONTAINER_NAMES.USER_INVITES,
      "SELECT * FROM c WHERE c.token = @token AND c.used = false",
      [{ name: "@token", value: token }]
    )
    
    if (invites.length === 0) {
      return null
    }

    const invite = invites[0]
    
    // Check if expired
    if (new Date(invite.expiresAt) < new Date()) {
      return null
    }

    return invite
  } catch (error) {
    console.error("Error getting invite:", error)
    return null
  }
}

/**
 * Accept a user invite
 */
export async function acceptInvite(
  token: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const invite = await getInviteByToken(token)
    
    if (!invite) {
      return { success: false, error: "Invalid or expired invite" }
    }

    // Check if email already exists
    const existingUsers = await queryItems<User>(
      CONTAINER_NAMES.USERS,
      "SELECT * FROM c WHERE c.email = @email",
      [{ name: "@email", value: email }]
    )

    if (existingUsers.length > 0) {
      return { success: false, error: "Email already registered" }
    }

    // Create user
    const user: User = {
      id: generateId(),
      name: invite.name,
      email,
      password: hashPassword(password),
      role: invite.role,
      createdAt: new Date().toISOString(),
    }

    await createItem(CONTAINER_NAMES.USERS, user)

    // Mark invite as used
    const container = await getContainer(CONTAINER_NAMES.USER_INVITES)
    await container.item(invite.id, invite.id).replace({
      ...invite,
      used: true,
    })

    return { success: true }
  } catch (error) {
    console.error("Error accepting invite:", error)
    return { success: false, error: "Failed to accept invite" }
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const users = await queryItems<User>(
      CONTAINER_NAMES.USERS,
      "SELECT * FROM c WHERE c.email = @email",
      [{ name: "@email", value: email }]
    )
    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const users = await queryItems<User>(
      CONTAINER_NAMES.USERS,
      "SELECT * FROM c WHERE c.id = @id",
      [{ name: "@id", value: userId }]
    )
    return users.length > 0 ? users[0] : null
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const users = await queryItems<User>(CONTAINER_NAMES.USERS, "SELECT * FROM c")
    // Don't return passwords
    return users.map(u => ({ ...u, password: "" }))
  } catch (error) {
    console.error("Error getting users:", error)
    return []
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  userId: string,
  newRole: "admin" | "user",
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify caller is admin
    const admin = await queryItems<User>(
      CONTAINER_NAMES.USERS,
      "SELECT * FROM c WHERE c.id = @id AND c.role = @role",
      [
        { name: "@id", value: adminId },
        { name: "@role", value: "admin" },
      ]
    )

    if (admin.length === 0) {
      return { success: false, error: "Only admins can update user roles" }
    }

    // Get the user to update
    const users = await queryItems<User>(
      CONTAINER_NAMES.USERS,
      "SELECT * FROM c WHERE c.id = @id",
      [{ name: "@id", value: userId }]
    )

    if (users.length === 0) {
      return { success: false, error: "User not found" }
    }

    const user = users[0]
    const { updateItem } = await import("@/lib/cosmosdb")
    
    await updateItem(CONTAINER_NAMES.USERS, userId, {
      ...user,
      role: newRole,
    })

    return { success: true }
  } catch (error) {
    console.error("Error updating user role:", error)
    return { success: false, error: "Failed to update user role" }
  }
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(
  userId: string,
  adminId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify caller is admin
    const admin = await queryItems<User>(
      CONTAINER_NAMES.USERS,
      "SELECT * FROM c WHERE c.id = @id AND c.role = @role",
      [
        { name: "@id", value: adminId },
        { name: "@role", value: "admin" },
      ]
    )

    if (admin.length === 0) {
      return { success: false, error: "Only admins can delete users" }
    }

    // Prevent deleting the last admin
    if (userId === adminId) {
      return { success: false, error: "Cannot delete your own account" }
    }

    const { deleteItem } = await import("@/lib/cosmosdb")
    
    await deleteItem(CONTAINER_NAMES.USERS, userId)

    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error: "Failed to delete user" }
  }
}
