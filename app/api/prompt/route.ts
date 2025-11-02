import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/server-actions/api-keys"
import { getAgentByName } from "@/lib/server-actions/agents"
import { getPromptById } from "@/lib/server-actions/prompts"

export async function GET(request: NextRequest) {
  try {
    // Get API key from header
    const apiKey = request.headers.get("x-api-key")
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 401 }
      )
    }

    // Validate API key and get project ID
    const projectId = await validateApiKey(apiKey)
    if (!projectId) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      )
    }

    // Get agent name from query parameter
    const { searchParams } = new URL(request.url)
    const agentName = searchParams.get("agent_name")
    
    if (!agentName) {
      return NextResponse.json(
        { error: "agent_name parameter required" },
        { status: 400 }
      )
    }

    // Get agent by name
    const agent = await getAgentByName(projectId, agentName)
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      )
    }

    // Check if agent has an active prompt
    if (!agent.activeAgentPromptId) {
      return NextResponse.json(
        { error: "No active prompt for this agent" },
        { status: 404 }
      )
    }

    // Get the active prompt
    const prompt = await getPromptById(agent.activeAgentPromptId)
    if (!prompt) {
      return NextResponse.json(
        { error: "Active prompt not found" },
        { status: 404 }
      )
    }

    // Return the prompt text
    return NextResponse.json({
      agent_name: agent.name,
      prompt_text: prompt.promptText,
      prompt_id: prompt.id,
      updated_at: prompt.createdAt,
    })
  } catch (error) {
    console.error("Error fetching prompt:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
