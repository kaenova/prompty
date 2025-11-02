"use client"

import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getProjectsForUser, createProject } from "@/lib/server-actions/projects"
import { createUserInvite, getAllUsers, updateUserRole, deleteUser } from "@/lib/server-actions/users"
import { Project, User } from "@/types/models"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [showInviteUser, setShowInviteUser] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [newProjectData, setNewProjectData] = useState({
    name: "",
    description: "",
  })
  const [inviteData, setInviteData] = useState({
    name: "",
    role: "user" as "admin" | "user",
  })
  const [inviteLink, setInviteLink] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    const loadProjects = async () => {
      if (session?.user?.id) {
        const userProjects = await getProjectsForUser(session.user.id)
        setProjects(userProjects)
        
        // Load users if admin
        if (session.user.role === "admin") {
          const allUsers = await getAllUsers()
          setUsers(allUsers)
        }
        
        setLoading(false)
      }
    }

    if (session) {
      loadProjects()
    }
  }, [session])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return

    const result = await createProject(
      newProjectData.name,
      newProjectData.description,
      session.user.id
    )

    if (result.success) {
      const userProjects = await getProjectsForUser(session.user.id)
      setProjects(userProjects)
      setShowNewProject(false)
      setNewProjectData({ name: "", description: "" })
    }
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user?.id) return

    const result = await createUserInvite(
      inviteData.name,
      inviteData.role,
      session.user.id
    )

    if (result.success && result.token) {
      const link = `${window.location.origin}/invite?token=${result.token}`
      setInviteLink(link)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: "admin" | "user") => {
    if (!session?.user?.id) return
    
    setUpdatingUserId(userId)
    const result = await updateUserRole(userId, newRole, session.user.id)
    setUpdatingUserId(null)

    if (result.success) {
      const allUsers = await getAllUsers()
      setUsers(allUsers)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!session?.user?.id) return
    
    if (!confirm("Are you sure you want to delete this user?")) return

    setDeletingUserId(userId)
    const result = await deleteUser(userId, session.user.id)
    setDeletingUserId(null)

    if (result.success) {
      const allUsers = await getAllUsers()
      setUsers(allUsers)
    }
  }

  const handleSignout = async () => {
    await signOut()
    router.push("/auth/signin")
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
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
              {session.user?.email} ({session.user?.role})
            </span>
            <Button onClick={handleSignout} variant="outline">Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">My Projects</h2>
            <Button onClick={() => setShowNewProject(true)}>
              New Project
            </Button>
          </div>

          {/* New Project Form */}
          {showNewProject && (
            <div className="p-6 border rounded-lg space-y-4 bg-card">
              <h3 className="font-semibold">Create New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    type="text"
                    value={newProjectData.name}
                    onChange={(e) =>
                      setNewProjectData({
                        ...newProjectData,
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
                    value={newProjectData.description}
                    onChange={(e) =>
                      setNewProjectData({
                        ...newProjectData,
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
                    onClick={() => setShowNewProject(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Projects List */}
          <div className="space-y-4">
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No projects yet. Create your first project!
              </p>
            ) : (
              projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-6 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {project.description}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-primary/10 rounded">
                      {project.permissions[session.user.id]}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Users Management Section - Admin Only */}
          {session.user.role === "admin" && (
            <>
              <div className="mt-12 pt-8 border-t">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Users Management</h2>
                  <Button
                    onClick={() => setShowInviteUser(true)}
                    variant="outline"
                  >
                    Invite User
                  </Button>
                </div>
              </div>

              {/* Invite User Form */}
              {showInviteUser && (
                <div className="p-6 border rounded-lg space-y-4 bg-card mb-6">
                  <h3 className="font-semibold">Invite User</h3>
                  <form onSubmit={handleCreateInvite} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <input
                        type="text"
                        value={inviteData.name}
                        onChange={(e) =>
                          setInviteData({ ...inviteData, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-md bg-background mt-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <select
                        value={inviteData.role}
                        onChange={(e) =>
                          setInviteData({
                            ...inviteData,
                            role: e.target.value as "admin" | "user",
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md bg-background mt-1"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">Generate Invite Link</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowInviteUser(false)
                          setInviteLink("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    {inviteLink && (
                      <div className="p-3 bg-muted rounded border">
                        <p className="text-sm font-medium mb-2">Invite Link:</p>
                        <p className="text-sm break-all">{inviteLink}</p>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* Users List */}
              <div className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No users yet.
                  </p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
                          <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                          <th className="px-6 py-3 text-left text-sm font-medium">Role</th>
                          <th className="px-6 py-3 text-left text-sm font-medium">Created</th>
                          <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-t hover:bg-muted/30">
                            <td className="px-6 py-4 text-sm">{user.name}</td>
                            <td className="px-6 py-4 text-sm">{user.email}</td>
                            <td className="px-6 py-4 text-sm">
                              {user.id === session.user.id ? (
                                <span className="px-2 py-1 bg-primary/10 rounded text-xs font-medium">
                                  {user.role} (You)
                                </span>
                              ) : (
                                <select
                                  value={user.role}
                                  onChange={(e) =>
                                    handleUpdateUserRole(user.id, e.target.value as "admin" | "user")
                                  }
                                  disabled={updatingUserId === user.id}
                                  className="px-2 py-1 border rounded text-sm bg-background"
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </select>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {user.id !== session.user.id && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={deletingUserId === user.id}
                                >
                                  {deletingUserId === user.id ? "Deleting..." : "Delete"}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
