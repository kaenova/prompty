"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  getApiKeysForProject, 
  createProjectApiKey, 
  deleteApiKey 
} from "@/lib/server-actions/api-keys"
import { getUserById } from "@/lib/server-actions/users"
import { ProjectApiKey } from "@/types/models"

interface ApiKeysTabProps {
  projectId: string
  userId: string
  apiKeys: ProjectApiKey[]
  canEdit: boolean
  onApiKeysChange: (apiKeys: ProjectApiKey[]) => void
}

export function ApiKeysTab({
  projectId,
  userId,
  apiKeys,
  canEdit,
  onApiKeysChange,
}: ApiKeysTabProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({})
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [keyDescription, setKeyDescription] = useState("")
  const [generatedKey, setGeneratedKey] = useState<ProjectApiKey | null>(null)
  const [showGeneratedKey, setShowGeneratedKey] = useState(false)

  // Fetch creator names for API keys
  useEffect(() => {
    const fetchCreatorNames = async () => {
      const names: Record<string, string> = {}
      
      for (const key of apiKeys) {
        if (!names[key.userId]) {
          const user = await getUserById(key.userId)
          names[key.userId] = user?.name || "Unknown"
        }
      }
      
      setCreatorNames(names)
    }

    if (apiKeys.length > 0) {
      fetchCreatorNames()
    }
  }, [apiKeys])

  const handleCreateApiKey = async () => {
    setIsCreating(true)
    const result = await createProjectApiKey(projectId, userId, keyDescription)
    setIsCreating(false)
    
    if (result.success) {
      const projectApiKeys = await getApiKeysForProject(projectId)
      // Find the newly created key
      const newKey = projectApiKeys.find(k => k.apiKey === result.apiKey)
      if (newKey) {
        setGeneratedKey(newKey)
        setShowGeneratedKey(true)
      }
      onApiKeysChange(projectApiKeys)
      setShowDescriptionModal(false)
      setKeyDescription("")
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return

    setIsDeletingId(keyId)
    const result = await deleteApiKey(keyId, userId)
    setIsDeletingId(null)
    
    if (result.success) {
      const projectApiKeys = await getApiKeysForProject(projectId)
      onApiKeysChange(projectApiKeys)
    }
  }

  const pythonExample = `from prompty import PromptyClient

# Initialize the client
client = PromptyClient(
    base_url='${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}',
    project_id='${projectId}',
    api_key='pk_your_api_key_here'  # Replace with your actual API key
)

# Get the active prompt for an agent
prompt = client.get_prompt('agent-name')
print(prompt)

# Use with OpenAI or other AI services
import openai

response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": prompt},
        {"role": "user", "content": "Your user message here"}
    ]
)`

  return (
    <div className="space-y-4">
      {/* Python SDK Example */}
      <div className="p-4 border border-border bg-card rounded-lg">
        <h3 className="font-semibold text-foreground mb-3">Python SDK Example</h3>
        
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Use this SDK to fetch your active prompts from this project:
          </p>
          <pre className="bg-muted text-foreground p-3 rounded text-xs overflow-x-auto border border-border">
            <code>{pythonExample}</code>
          </pre>
          <p className="text-xs text-muted-foreground">
            📦 Install SDK: <code className="bg-muted border border-border px-1.5 py-0.5 rounded text-foreground">pip install kaenova-prompty</code>
          </p>
        </div>
      </div>

      {canEdit && (
        <Button  
          className="w-full"
          onClick={() => setShowDescriptionModal(true)}
          disabled={isCreating}
        >
          Generate New API Key
        </Button>
      )}

      {/* Description Modal */}
      {showDescriptionModal && (
        <div className="p-6 border rounded-lg space-y-4 bg-card">
          <h3 className="font-semibold">Generate New API Key</h3>
          <div>
            <label className="text-sm font-medium">Description (Optional)</label>
            <input
              type="text"
              value={keyDescription}
              onChange={(e) => setKeyDescription(e.target.value)}
              placeholder="e.g., Production API Key, Mobile App Key..."
              className="w-full px-3 py-2 border rounded-md bg-background mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCreateApiKey}
              disabled={isCreating}
            >
              {isCreating ? "Generating..." : "Generate"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDescriptionModal(false)
                setKeyDescription("")
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Generated Key Display */}
      {showGeneratedKey && generatedKey && (
        <div className="p-6 border border-green-200 rounded-lg space-y-4 bg-green-50 dark:bg-green-950">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">✓ API Key Generated Successfully</h3>
              <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                Save this key somewhere safe. You won&apos;t be able to see it again.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGeneratedKey(false)}
            >
              Done
            </Button>
          </div>
          <div>
            <p className="text-xs text-green-700 dark:text-green-300 mb-1">Your API Key:</p>
            <code className="text-sm bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 px-3 py-2 rounded block font-mono break-all">
              {generatedKey.apiKey}
            </code>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-green-700 dark:text-green-300">Description</p>
              <p className="font-medium text-green-900 dark:text-green-100">
                {generatedKey.description || "No description"}
              </p>
            </div>
            <div>
              <p className="text-xs text-green-700 dark:text-green-300">Project ID</p>
              <p className="font-medium text-green-900 dark:text-green-100">{projectId}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No API keys yet. Generate your first API key!
          </p>
        ) : (
          apiKeys.map((key) => (
            <div
              key={key.id}
              className="p-6 border rounded-lg space-y-4 bg-card"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm font-medium text-foreground">
                      {key.description || <span className="italic text-muted-foreground">No description</span>}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Created By</p>
                      <p className="text-sm font-medium text-foreground">
                        {creatorNames[key.userId] || "Loading..."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created At</p>
                      <p className="text-sm font-medium text-foreground">
                        {new Date(key.createdAt).toLocaleDateString()} {new Date(key.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteApiKey(key.id)}
                    disabled={isDeletingId === key.id}
                    className="ml-4"
                  >
                    {isDeletingId === key.id ? "Deleting..." : "Delete"}
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
