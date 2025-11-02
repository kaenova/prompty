# Prompty Python SDK

Python client for interacting with the Prompty API to fetch real-time prompts for AI agents.

## Installation

```bash
pip install prompty-sdk
```

Or install from source:

```bash
cd python-sdk
pip install -e .
```

## Usage

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
# Output: "You are a helpful customer support assistant..."

# Get detailed information about the prompt
details = client.get_prompt_details('customer-support-agent')
print(details['prompt_text'])
print(details['prompt_id'])
print(details['updated_at'])
```

## API Reference

### PromptyClient

Initialize a Prompty client.

**Parameters:**
- `base_url` (str): The base URL of your Prompty instance
- `project_id` (str): Your project ID
- `api_key` (str): Your API key

### get_prompt(agent_name)

Get the active prompt text for an agent.

**Parameters:**
- `agent_name` (str): The name of the agent

**Returns:**
- `str`: The prompt text

**Raises:**
- `ValueError`: If the API key is invalid or agent not found
- `RuntimeError`: If there's a server error

### get_prompt_details(agent_name)

Get detailed information about the active prompt.

**Parameters:**
- `agent_name` (str): The name of the agent

**Returns:**
- `dict`: Dictionary containing:
  - `prompt_text` (str): The prompt text
  - `prompt_id` (str): The prompt ID
  - `updated_at` (str): When the prompt was created/updated
  - `agent_name` (str): The agent name

**Raises:**
- `ValueError`: If the API key is invalid or agent not found
- `RuntimeError`: If there's a server error

## Example: Using with OpenAI

```python
from prompty import PromptyClient
import openai

# Initialize Prompty client
prompty = PromptyClient(
    base_url='https://your-prompty-instance.com',
    project_id='your-project-id',
    api_key='pk_your_api_key_here'
)

# Get the prompt from Prompty
system_prompt = prompty.get_prompt('customer-support-agent')

# Use it with OpenAI
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "How do I reset my password?"}
    ]
)

print(response.choices[0].message.content)
```

## Error Handling

The SDK raises the following exceptions:

- `ValueError`: When the API key is invalid or the requested agent/prompt is not found
- `RuntimeError`: When there's a server error or network issue

```python
try:
    prompt = client.get_prompt('my-agent')
except ValueError as e:
    print(f"Invalid request: {e}")
except RuntimeError as e:
    print(f"Server error: {e}")
```

## License

MIT
