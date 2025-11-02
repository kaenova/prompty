import { CosmosClient, SqlParameter } from "@azure/cosmos"

const endpoint = process.env.COSMOS_DB_ENDPOINT || ""
const key = process.env.COSMOS_DB_KEY || ""
const databaseId = process.env.COSMOS_DB_DATABASE_ID || "prompty-db"

// Container name constants
export const CONTAINER_NAMES = {
  USERS: "users",
  USER_INVITES: "user_invites",
  PROJECTS: "projects",
  AGENTS: "agents",
  AGENT_PROMPTS: "agent_prompts",
  PROJECT_API_KEYS: "project_api_keys",
} as const

// Create Cosmos DB client only if credentials are provided
let cosmosClient: CosmosClient | null = null

if (endpoint && key) {
  cosmosClient = new CosmosClient({
    endpoint,
    key,
  })
}

// Database and container references
export async function getDatabase() {
  if (!cosmosClient) {
    throw new Error("CosmosDB client not initialized. Please set COSMOS_DB_ENDPOINT and COSMOS_DB_KEY environment variables.")
  }
  const { database } = await cosmosClient.databases.createIfNotExists({
    id: databaseId,
  })
  return database
}

export async function getContainer(containerId: string) {
  const database = await getDatabase()
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ["/id"] },
  })
  return container
}

// Initialize all containers
export async function initializeContainers() {
  if (!cosmosClient) {
    throw new Error("CosmosDB client not initialized. Please set COSMOS_DB_ENDPOINT and COSMOS_DB_KEY environment variables.")
  }

  try {
    // Initialize all containers
    const containerIds = Object.values(CONTAINER_NAMES)
    for (const containerId of containerIds) {
      await getContainer(containerId)
    }
    console.log("All containers initialized successfully")
  } catch (error) {
    console.error("Error initializing containers:", error)
    throw error
  }
}

// Helper function to perform database operations
export async function queryItems<T>(
  containerId: string,
  query: string,
  parameters?: SqlParameter[]
) {
  const container = await getContainer(containerId)
  const { resources } = await container.items
    .query<T>({
      query,
      parameters,
    })
    .fetchAll()
  return resources
}

export async function createItem<T extends { id: string }>(
  containerId: string,
  item: T
) {
  const container = await getContainer(containerId)
  const { resource } = await container.items.create(item)
  return resource
}

export async function updateItem<T extends { id: string }>(
  containerId: string,
  id: string,
  item: T
) {
  const container = await getContainer(containerId)
  const { resource } = await container.item(id, id).replace(item)
  return resource
}

export async function deleteItem(containerId: string, id: string) {
  const container = await getContainer(containerId)
  await container.item(id, id).delete()
}
