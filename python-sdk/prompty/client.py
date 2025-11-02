"""
Prompty Python SDK

A Python client for interacting with the Prompty API to fetch real-time prompts for AI agents.
"""

import requests
from typing import Optional


class PromptyClient:
    """
    Client for interacting with the Prompty API.
    
    Args:
        base_url: The base URL of the Prompty platform (e.g., 'http://localhost:3000')
        project_id: The project ID
        api_key: The API key for authentication
    
    Example:
        >>> client = PromptyClient(
        ...     base_url='https://prompty.example.com',
        ...     project_id='project-123',
        ...     api_key='pk_...'
        ... )
        >>> prompt = client.get_prompt('customer-support-agent')
        >>> print(prompt)
    """
    
    def __init__(self, base_url: str, project_id: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.project_id = project_id
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        })
    
    def get_prompt(self, agent_name: str) -> Optional[str]:
        """
        Get the active prompt text for an agent.
        
        Args:
            agent_name: The name of the agent
            
        Returns:
            The prompt text if found, None otherwise
            
        Raises:
            ValueError: If the API key is invalid or agent not found
            RuntimeError: If there's a server error
            
        Example:
            >>> client = PromptyClient(base_url='...', project_id='...', api_key='...')
            >>> prompt = client.get_prompt('my-agent')
            >>> print(prompt)
            "You are a helpful assistant..."
        """
        url = f"{self.base_url}/api/prompt"
        params = {'agent_name': agent_name}
        
        try:
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return data.get('prompt_text')
            elif response.status_code == 401:
                raise ValueError("Invalid API key")
            elif response.status_code == 404:
                error = response.json().get('error', 'Not found')
                raise ValueError(f"Agent or prompt not found: {error}")
            elif response.status_code >= 500:
                raise RuntimeError("Server error occurred")
            else:
                raise RuntimeError(f"Unexpected error: {response.status_code}")
        except requests.RequestException as e:
            raise RuntimeError(f"Network error: {str(e)}")
    
    def get_prompt_details(self, agent_name: str) -> Optional[dict]:
        """
        Get detailed information about the active prompt for an agent.
        
        Args:
            agent_name: The name of the agent
            
        Returns:
            A dictionary containing prompt details (prompt_text, prompt_id, updated_at)
            
        Raises:
            ValueError: If the API key is invalid or agent not found
            RuntimeError: If there's a server error
            
        Example:
            >>> client = PromptyClient(base_url='...', project_id='...', api_key='...')
            >>> details = client.get_prompt_details('my-agent')
            >>> print(details['prompt_text'])
            >>> print(details['updated_at'])
        """
        url = f"{self.base_url}/api/prompt"
        params = {'agent_name': agent_name}
        
        try:
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 401:
                raise ValueError("Invalid API key")
            elif response.status_code == 404:
                error = response.json().get('error', 'Not found')
                raise ValueError(f"Agent or prompt not found: {error}")
            elif response.status_code >= 500:
                raise RuntimeError("Server error occurred")
            else:
                raise RuntimeError(f"Unexpected error: {response.status_code}")
        except requests.RequestException as e:
            raise RuntimeError(f"Network error: {str(e)}")
