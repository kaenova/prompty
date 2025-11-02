import { CosmosClient, SqlParameter } from "@azure/cosmos"

if (!process.env.COSMOS_DB_ENDPOINT) {
  throw new Error("COSMOS_DB_ENDPOINT is not defined in environment variables")
}

if (!process.env.COSMOS_DB_KEY) {
  throw new Error("COSMOS_DB_KEY is not defined in environment variables")
}

const endpoint = process.env.COSMOS_DB_ENDPOINT
const key = process.env.COSMOS_DB_KEY
const databaseId = process.env.COSMOS_DB_DATABASE_ID || "prompty-db"

// Create Cosmos DB client
export const cosmosClient = new CosmosClient({
  endpoint,
  key,
})

// Database and container references
export async function getDatabase() {
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

export async function createItem<T extends Record<string, unknown>>(
  containerId: string,
  item: T
) {
  const container = await getContainer(containerId)
  const { resource } = await container.items.create(item)
  return resource
}

export async function updateItem<T extends Record<string, unknown>>(
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
