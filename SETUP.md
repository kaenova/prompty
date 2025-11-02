# Setup Guide

This Next.js application is configured with the following technologies:

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v3** - Utility-first CSS framework
- **Shadcn UI** - Component library built on Radix UI
- **NextAuth v4** - Authentication with JWT strategy
- **Azure CosmosDB** - NoSQL database client

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Azure CosmosDB account (for database features)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
- `NEXTAUTH_SECRET`: Generate a secure random string
- `COSMOS_DB_ENDPOINT`: Your Azure CosmosDB endpoint
- `COSMOS_DB_KEY`: Your Azure CosmosDB primary key
- `COSMOS_DB_DATABASE_ID`: Your database name (defaults to "prompty-db")

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

Build for production:
```bash
npm run build
```

### Lint

Run ESLint:
```bash
npm run lint
```

## Project Structure

```
.
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── auth/          # NextAuth configuration
│   ├── auth/              # Authentication pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── session-provider.tsx
├── lib/                   # Utility functions
│   ├── cosmosdb.ts       # CosmosDB client and helpers
│   └── utils.ts          # General utilities
├── types/                 # TypeScript type definitions
│   └── next-auth.d.ts    # NextAuth type extensions
└── public/               # Static files
```

## Key Features

### Authentication (NextAuth v4)

- JWT-based session strategy
- Credentials provider configured (can be extended)
- Protected routes support
- Session management with React hooks

Example usage:
```tsx
import { useSession } from "next-auth/react"

export default function Component() {
  const { data: session, status } = useSession()
  
  if (status === "authenticated") {
    return <p>Signed in as {session.user.email}</p>
  }
  
  return <p>Not signed in</p>
}
```

### Shadcn UI Components

Components are located in `components/ui/` and can be imported as:
```tsx
import { Button } from "@/components/ui/button"
```

To add more Shadcn components, use:
```bash
npx shadcn@latest add [component-name]
```

### Azure CosmosDB Integration

The CosmosDB client is configured in `lib/cosmosdb.ts` with helper functions:

```typescript
import { queryItems, createItem, updateItem, deleteItem } from "@/lib/cosmosdb"

// Query items
const items = await queryItems("container-name", "SELECT * FROM c")

// Create item
await createItem("container-name", { id: "1", name: "Item" })

// Update item
await updateItem("container-name", "1", { id: "1", name: "Updated" })

// Delete item
await deleteItem("container-name", "1")
```

### Tailwind CSS

Custom theme colors and design tokens are configured in `tailwind.config.ts`.
Global styles and CSS variables are in `app/globals.css`.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXTAUTH_URL` | Application URL | Yes |
| `NEXTAUTH_SECRET` | Secret for JWT encryption | Yes |
| `COSMOS_DB_ENDPOINT` | Azure CosmosDB endpoint | Yes (for DB features) |
| `COSMOS_DB_KEY` | Azure CosmosDB key | Yes (for DB features) |
| `COSMOS_DB_DATABASE_ID` | Database ID | No (defaults to "prompty-db") |

## Next Steps

1. Configure Azure CosmosDB credentials
2. Customize authentication logic in `app/api/auth/[...nextauth]/route.ts`
3. Add more Shadcn UI components as needed
4. Build your application features
5. Deploy to Vercel or your preferred platform

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [NextAuth.js](https://next-auth.js.org)
- [Azure CosmosDB](https://docs.microsoft.com/azure/cosmos-db/)
