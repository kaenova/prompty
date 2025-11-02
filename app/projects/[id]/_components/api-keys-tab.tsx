"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  getApiKeysForProject, 
  createProjectApiKey, 
  deleteApiKey 
} from "@/lib/server-actions/api-keys"
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

  const handleCreateApiKey = async () => {
    setIsCreating(true)
    const result = await createProjectApiKey(projectId, userId)
    setIsCreating(false)
    
    if (result.success) {
      const projectApiKeys = await getApiKeysForProject(projectId)
      onApiKeysChange(projectApiKeys)
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
          onClick={handleCreateApiKey}
          disabled={isCreating}
        >
          {isCreating ? "Generating..." : "Generate New API Key"}
        </Button>
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
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div className="flex-1">
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {key.apiKey}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(key.createdAt).toLocaleDateString()}
                </p>
              </div>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteApiKey(key.id)}
                  disabled={isDeletingId === key.id}
                >
                  {isDeletingId === key.id ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
