# Prompty ✨

Real-time agent prompt management platform with collaborative features and Python SDK integration.

## Features

- 🤖 **Agent Management** - Create and manage AI agents with customizable prompts
- ⚡ **Real-time Updates** - Update prompts in real-time via Python SDK
- 👥 **Team Collaboration** - Share projects with role-based permissions (Owner, Editor, Viewer)
- 🔐 **Secure API Keys** - Manage API keys for secure client access
- 🎯 **Prompt Activation** - Activate specific prompts for production use
- 📝 **Version History** - Track multiple prompt versions per agent

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v3** - Utility-first CSS framework
- **Shadcn UI** - Component library built on Radix UI
- **NextAuth v4** - Authentication with JWT strategy
- **Azure CosmosDB** - NoSQL database for scalable storage

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Azure CosmosDB account

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
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production
COSMOS_DB_ENDPOINT=https://your-account.documents.azure.com:443/
COSMOS_DB_KEY=your-cosmos-db-key-here
COSMOS_DB_DATABASE_ID=prompty-db
```

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

## Application Workflow

### 1. Initialization

When first accessing the application, you'll be redirected to the initialization page to create the first admin user.

### 2. User Management (Admin Only)

Admins can invite new users:
- Click "Invite User" on the dashboard
- Enter the user's name and role (Admin or User)
- Share the generated invite link with the user
- The invited user can complete registration by providing their email and password

### 3. Project Management

- **Create Projects**: Users can create new projects with name and description
- **Permissions**: Projects support three permission levels:
  - **Owner**: Full control over the project
  - **Editor**: Can create/edit/delete agents and prompts
  - **Viewer**: Read-only access
- **Add Members**: Owners and Editors can add other users to projects

### 4. Agent Management

Within a project:
- **Create Agents**: Owners and Editors can create agents with name and description
- **View Agents**: All members can view agents based on their permission level
- **Delete Agents**: Owners and Editors can delete agents

### 5. Prompt Management

Within an agent:
- **Split View**: Prompts are displayed in a left panel, with the editor on the right
- **Create Prompts**: Owners and Editors can create multiple prompt versions
- **Edit Prompts**: Edit prompt text (only inactive prompts)
- **Delete Prompts**: Delete prompts (only inactive prompts)
- **Activate Prompts**: Set one prompt as active for production use
- **Protection**: Active prompts cannot be edited or deleted

### 6. API Key Management

In project settings:
- **Generate Keys**: Create API keys for external access
- **View Keys**: See all API keys with creation dates
- **Delete Keys**: Remove API keys when no longer needed

## Python SDK Usage

Install the SDK:
```bash
cd python-sdk
pip install -e .
```

Use in your Python application:
```python
from prompty import PromptyClient

# Initialize the client
client = PromptyClient(
    base_url='https://your-prompty-instance.com',
    project_id='your-project-id',
    api_key='pk_your_api_key_here'
)

# Get the active prompt for an agent
prompt = client.get_prompt('customer-support-agent')
print(prompt)

# Use with OpenAI or other AI services
import openai

response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": prompt},
        {"role": "user", "content": "How can I help you?"}
    ]
)
```

## API Reference

### GET /api/prompt

Fetch the active prompt for an agent.

**Headers:**
- `X-API-Key`: Your project API key

**Query Parameters:**
- `agent_name`: Name of the agent

**Response:**
```json
{
  "agent_name": "customer-support-agent",
  "prompt_text": "You are a helpful customer support assistant...",
  "prompt_id": "prompt-123",
  "updated_at": "2025-11-02T13:44:51.216Z"
}
```

**Error Responses:**
- `401`: Invalid API key
- `404`: Agent not found or no active prompt
- `500`: Server error

## Database Schema

The application uses the following CosmosDB containers:

- **users**: User accounts with roles
- **user_invites**: Invitation tokens for new users
- **projects**: Project definitions with member permissions
- **agents**: Agents within projects
- **agent_prompts**: Prompt versions for agents
- **project_api_keys**: API keys for external access

## Security

- Passwords are hashed using SHA-256 (use bcrypt in production)
- JWT-based session authentication
- API key validation for external access
- Role-based access control
- Active prompts are protected from modification

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn UI](https://ui.shadcn.com)
- [NextAuth.js](https://next-auth.js.org)
- [Azure CosmosDB](https://docs.microsoft.com/azure/cosmos-db/)
