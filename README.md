# SupportPilot MCP Server

An AI-driven support ticket resolution tool that empowers support engineers to resolve customer tickets more efficiently. This MCP (Model Context Protocol) server provides tools for searching Azure DevOps work items, ICM incidents, error messages, and summarizing customer emails.

## Features

- **searchAdoWorkItem**: Search Azure DevOps work items by query, type, state, and assignee
- **searchICM**: Find similar incidents in ICM (Incident Command and Management) system
- **searchErrorMessage**: Search for error messages across Azure DevOps repositories, work items, and pull requests
- **summarizeCustomerEmail**: Analyze and summarize customer emails with key information extraction

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your environment variables
4. Build the project:
   ```bash
   npm run build
   ```

## Configuration

Configure the following environment variables in your `.env` file:

### Azure DevOps
- `ADO_ORGANIZATION`: Your Azure DevOps organization name
- `ADO_PROJECT`: Your Azure DevOps project name
- `ADO_PAT`: Personal Access Token with work item read permissions

### ICM (Incident Command and Management)
- `ICM_API_URL`: ICM API endpoint URL
- `ICM_API_KEY`: ICM API authentication key
- `ICM_TENANT`: Your ICM tenant identifier

### Development
- `NODE_ENV`: Set to 'development' for mock data during development

## Usage

### As an MCP Server

Run the server:
```bash
npm start
```

### Development Mode

For development with auto-reload:
```bash
npm run dev
```

## Tools

### searchAdoWorkItem

Search Azure DevOps work items with various filters.

**Parameters:**
- `query` (string): Search query for work items
- `workItemType` (optional): Filter by work item type (Bug, Task, User Story, etc.)
- `state` (optional): Filter by state (New, Active, Resolved, Closed, etc.)
- `assignedTo` (optional): Filter by assigned user
- `maxResults` (optional): Maximum results to return (default: 20)
- `includeResolved` (optional): Include resolved/closed items (default: true)

### searchICM

Find similar incidents in the ICM system.

**Parameters:**
- `query` (string): Search query for incidents
- `severity` (optional): Filter by severity (Sev0, Sev1, Sev2, Sev3, Sev4)
- `status` (optional): Filter by incident status
- `assignedTeam` (optional): Filter by assigned team
- `maxResults` (optional): Maximum results to return (default: 20)
- `includeResolved` (optional): Include resolved incidents (default: true)
- `similarityThreshold` (optional): Minimum similarity score (default: 0.7)

### searchErrorMessage

Search for error messages across repositories and work items.

**Parameters:**
- `errorMessage` (string): Error message or stack trace to search for
- `component` (optional): Filter by component or service name
- `repository` (optional): Filter by specific repository
- `timeRange` (optional): Time range for search (e.g., "7d", "1h", "30m")
- `maxResults` (optional): Maximum results to return (default: 20)
- `includeStackTrace` (optional): Include stack trace in results (default: true)
- `minFrequency` (optional): Minimum frequency of error occurrence (default: 1)

### summarizeCustomerEmail

Analyze and summarize customer email content.

**Parameters:**
- `emailContent` (string): Full content of the customer email
- `includeAttachmentInfo` (optional): Include attachment information (default: false)
- `customerContext` (optional): Additional customer context
  - `customerName` (optional): Customer name
  - `organization` (optional): Customer organization
  - `previousTickets` (optional): Array of previous ticket IDs
  - `accountTier` (optional): Account tier (free, basic, premium, enterprise)

## Development

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
```

### Testing
```bash
npm test
```

## Architecture

The SupportPilot MCP Server follows a modular architecture:

- `src/index.ts`: Main server entry point and tool registration
- `src/types.ts`: TypeScript type definitions
- `src/tools/`: Individual tool implementations
  - `searchAdoWorkItem.ts`: Azure DevOps work item search
  - `searchICM.ts`: ICM incident search
  - `searchErrorMessage.ts`: Error message search
  - `summarizeCustomerEmail.ts`: Email content analysis

Each tool is implemented as a separate module with its own schema validation using Zod, making the codebase maintainable and extensible.

## Contributing

1. Follow the existing code style and patterns
2. Add appropriate error handling and validation
3. Include TypeScript types for all new functionality
4. Test with both real and mock data scenarios

## License

MIT License