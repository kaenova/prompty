"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  getProjectById,
  addUserToProject,
  updateMemberPermission,
  removeMemberFromProject
} from "@/lib/server-actions/projects"
import { getUserById } from "@/lib/server-actions/users"
import { Project } from "@/types/models"

interface SettingsTabProps {
  projectId: string
  userId: string
  project: Project
  canEdit: boolean
  onProjectChange: (project: Project) => void
}

export function SettingsTab({
  projectId,
  userId,
  project,
  canEdit,
  onProjectChange,
}: SettingsTabProps) {
  const [showAddUser, setShowAddUser] = useState(false)
  const [addUserData, setAddUserData] = useState({
    email: "",
    permission: "viewer" as "editor" | "viewer",
  })
  const [isAdding, setIsAdding] = useState(false)
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [loadingNames, setLoadingNames] = useState(true)
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)

  // Fetch user names for all project members
  useEffect(() => {
    const fetchUserNames = async () => {
      setLoadingNames(true)
      const names: Record<string, string> = {}
      
      for (const memberId of Object.keys(project.permissions)) {
        const user = await getUserById(memberId)
        if (user) {
          names[memberId] = user.name
        } else {
          names[memberId] = `Unknown (${memberId})`
        }
      }
      
      setUserNames(names)
      setLoadingNames(false)
    }

    fetchUserNames()
  }, [project.permissions])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)

    const result = await addUserToProject(
      projectId,
      userId,
      addUserData.email,
      addUserData.permission
    )

    setIsAdding(false)

    if (result.success) {
      const projectData = await getProjectById(projectId)
      if (projectData) {
        onProjectChange(projectData)
      }
      setShowAddUser(false)
      setAddUserData({ email: "", permission: "viewer" })
      alert("User added successfully!")
    } else {
      alert(result.error || "Failed to add user")
    }
  }

  const handleUpdatePermission = async (memberId: string, newPermission: "editor" | "viewer" | "owner") => {
    setUpdatingMemberId(memberId)
    
    const result = await updateMemberPermission(
      projectId,
      userId,
      memberId,
      newPermission
    )

    setUpdatingMemberId(null)

    if (result.success) {
      const projectData = await getProjectById(projectId)
      if (projectData) {
        onProjectChange(projectData)
      }
    } else {
      alert(result.error || "Failed to update permission")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the project?")) return
    
    setRemovingMemberId(memberId)
    
    const result = await removeMemberFromProject(
      projectId,
      userId,
      memberId
    )

    setRemovingMemberId(null)

    if (result.success) {
      const projectData = await getProjectById(projectId)
      if (projectData) {
        onProjectChange(projectData)
      }
    } else {
      alert(result.error || "Failed to remove member")
    }
  }

  return (
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
                  <Button type="submit" disabled={isAdding}>
                    {isAdding ? "Adding..." : "Add"}
                  </Button>
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
          {loadingNames ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : (
            Object.entries(project.permissions).map(([memberId, perm]) => (
              <div
                key={memberId}
                className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    {userNames[memberId] || `Unknown (${memberId})`}
                  </span>
                  {memberId === userId && (
                    <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                  )}
                </div>

                {/* Show controls only to owner for non-self members */}
                {canEdit && memberId !== userId ? (
                  <div className="flex gap-2 items-center">
                    <select
                      value={perm as "editor" | "viewer" | "owner"}
                      onChange={(e) =>
                        handleUpdatePermission(memberId, e.target.value as "editor" | "viewer" | "owner")
                      }
                      disabled={updatingMemberId === memberId}
                      className="px-2 py-1 text-sm border rounded bg-background"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="owner">Owner</option>
                    </select>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveMember(memberId)}
                      disabled={removingMemberId === memberId}
                    >
                      {removingMemberId === memberId ? "Removing..." : "Remove"}
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs px-2 py-1 bg-muted rounded font-medium">
                    {perm}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
