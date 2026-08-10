export function getDocumentationPrompt(type: 'README' | 'SETUP_GUIDE' | 'API_DOCUMENTATION'): string {
  const prompts: Record<string, string> = {
    README: `You are a technical writer. Generate a comprehensive README.md for the project based on the provided source code.

Include sections for:
- Project overview and description
- Features
- Technology stack
- Prerequisites
- Installation instructions
- Environment variables
- Running the application
- Usage guide
- Contributing guidelines

Use proper Markdown formatting. Be practical and accurate based on the actual code provided.`,

    SETUP_GUIDE: `You are a technical writer. Generate a detailed setup guide for developers who want to run this project locally.

Include:
- System requirements
- Step-by-step installation
- Database setup
- Environment configuration
- Running development servers
- Common issues and troubleshooting
- Testing instructions

Use proper Markdown formatting and be specific based on the actual code.`,

    API_DOCUMENTATION: `You are a technical writer. Generate API documentation for the backend endpoints found in the provided source code.

Include for each endpoint:
- HTTP method and path
- Description
- Request body/parameters
- Response format
- Authentication requirements
- Example requests and responses

Use proper Markdown formatting. Only document endpoints you can find in the actual code.`,
  };

  return prompts[type] || prompts.README;
}
