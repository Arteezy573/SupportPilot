import axios from 'axios';
import { z } from 'zod';
import { AdoWorkItem, SearchOptions } from '../types.js';

const SearchAdoWorkItemArgsSchema = z.object({
  query: z.string().describe('Search query for work items (title, description, tags)'),
  workItemType: z.string().optional().describe('Filter by work item type (Bug, Task, User Story, etc.)'),
  state: z.string().optional().describe('Filter by state (New, Active, Resolved, Closed, etc.)'),
  assignedTo: z.string().optional().describe('Filter by assigned user'),
  maxResults: z.number().optional().default(20).describe('Maximum number of results to return'),
  includeResolved: z.boolean().optional().default(true).describe('Include resolved/closed items'),
});

export type SearchAdoWorkItemArgs = z.infer<typeof SearchAdoWorkItemArgsSchema>;

export async function searchAdoWorkItem(args: SearchAdoWorkItemArgs): Promise<AdoWorkItem[]> {
  try {
    const { 
      query, 
      workItemType, 
      state, 
      assignedTo, 
      maxResults = 20, 
      includeResolved = true 
    } = SearchAdoWorkItemArgsSchema.parse(args);

    // Return mock data in development mode
    if (process.env.NODE_ENV === 'development') {
      return getMockAdoWorkItems(args, maxResults);
    }

    const organization = process.env.ADO_ORGANIZATION;
    const project = process.env.ADO_PROJECT;
    const pat = process.env.ADO_PAT; // Personal Access Token

    if (!organization || !project || !pat) {
      throw new Error('Azure DevOps configuration missing. Set ADO_ORGANIZATION, ADO_PROJECT, and ADO_PAT environment variables.');
    }

    // Build WIQL (Work Item Query Language) query
    let wiqlQuery = `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [System.AssignedTo], [System.Description], [System.Tags], [System.CreatedDate], [System.ChangedDate] FROM WorkItems`;
    
    const conditions: string[] = [];
    
    // Add text search condition
    if (query.trim()) {
      conditions.push(`([System.Title] CONTAINS '${query}' OR [System.Description] CONTAINS '${query}' OR [System.Tags] CONTAINS '${query}')`);
    }
    
    // Add work item type filter
    if (workItemType) {
      conditions.push(`[System.WorkItemType] = '${workItemType}'`);
    }
    
    // Add state filter
    if (state) {
      conditions.push(`[System.State] = '${state}'`);
    } else if (!includeResolved) {
      conditions.push(`[System.State] NOT IN ('Resolved', 'Closed', 'Done', 'Completed')`);
    }
    
    // Add assigned to filter
    if (assignedTo) {
      conditions.push(`[System.AssignedTo] CONTAINS '${assignedTo}'`);
    }
    
    if (conditions.length > 0) {
      wiqlQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    wiqlQuery += ` ORDER BY [System.ChangedDate] DESC`;

    const wiqlUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/wiql?api-version=7.0`;
    
    // Execute WIQL query to get work item IDs
    const wiqlResponse = await axios.post(
      wiqlUrl,
      { query: wiqlQuery },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const workItemIds = wiqlResponse.data.workItems
      .slice(0, maxResults)
      .map((wi: any) => wi.id);

    if (workItemIds.length === 0) {
      return [];
    }

    // Get detailed work item information
    const detailsUrl = `https://dev.azure.com/${organization}/${project}/_apis/wit/workitems?ids=${workItemIds.join(',')}&$expand=all&api-version=7.0`;
    
    const detailsResponse = await axios.get(detailsUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${pat}`).toString('base64')}`,
      },
    });

    const workItems: AdoWorkItem[] = detailsResponse.data.value.map((wi: any) => ({
      id: wi.id.toString(),
      title: wi.fields['System.Title'] || '',
      workItemType: wi.fields['System.WorkItemType'] || '',
      state: wi.fields['System.State'] || '',
      assignedTo: wi.fields['System.AssignedTo']?.displayName,
      description: wi.fields['System.Description'] || wi.fields['Microsoft.VSTS.TCM.ReproSteps'],
      tags: wi.fields['System.Tags'] ? wi.fields['System.Tags'].split(';').map((tag: string) => tag.trim()) : [],
      createdDate: wi.fields['System.CreatedDate'],
      lastModified: wi.fields['System.ChangedDate'],
      url: wi._links.html.href,
    }));

    return workItems;
  } catch (error) {
    throw new Error(`Failed to search Azure DevOps work items: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function getMockAdoWorkItems(args: SearchAdoWorkItemArgs, maxResults: number): AdoWorkItem[] {
  const { query, workItemType, state, assignedTo } = args;
  
  const mockItems: AdoWorkItem[] = [
    {
      id: '12345',
      title: `Customer login issue related to ${query || 'authentication'}`,
      workItemType: workItemType || 'Bug',
      state: state || 'Active',
      assignedTo: assignedTo || 'Sarah Chen',
      description: `Customer reports being unable to log in with error message: "Invalid credentials". This appears to be related to the recent authentication service update. The issue affects users trying to access the dashboard after the 2.1.4 deployment.`,
      tags: ['authentication', 'login', 'customer-impacting'],
      createdDate: '2024-01-15T09:30:00Z',
      lastModified: '2024-01-16T14:20:00Z',
      url: 'https://dev.azure.com/mock-org/mock-project/_workitems/edit/12345',
    },
    {
      id: '12346',
      title: `API timeout issue when processing ${query || 'requests'}`,
      workItemType: workItemType || 'Bug',
      state: state || 'New',
      assignedTo: assignedTo || 'Mike Johnson',
      description: `Multiple customers reporting API timeouts when making requests to the /api/data endpoint. Response times have increased from ~200ms to 5+ seconds since the last deployment. This is causing downstream service failures.`,
      tags: ['api', 'performance', 'timeout'],
      createdDate: '2024-01-14T16:45:00Z',
      lastModified: '2024-01-15T10:15:00Z',
      url: 'https://dev.azure.com/mock-org/mock-project/_workitems/edit/12346',
    },
    {
      id: '12347',
      title: `Feature request: Enhanced ${query || 'search'} functionality`,
      workItemType: workItemType || 'User Story',
      state: state || 'Approved',
      assignedTo: assignedTo || 'Lisa Wang',
      description: `Customer feedback indicates need for more advanced search capabilities including filters, sorting, and saved searches. This would improve user experience significantly based on usage analytics.`,
      tags: ['feature-request', 'search', 'ux-improvement'],
      createdDate: '2024-01-10T11:20:00Z',
      lastModified: '2024-01-12T08:30:00Z',
      url: 'https://dev.azure.com/mock-org/mock-project/_workitems/edit/12347',
    },
    {
      id: '12348',
      title: `Database connection pool exhaustion`,
      workItemType: workItemType || 'Bug',
      state: state || 'Resolved',
      assignedTo: assignedTo || 'David Rodriguez',
      description: `High traffic periods causing database connection pool to be exhausted, resulting in "too many connections" errors. Implemented connection pooling improvements and monitoring.`,
      tags: ['database', 'performance', 'resolved'],
      createdDate: '2024-01-08T13:15:00Z',
      lastModified: '2024-01-11T17:45:00Z',
      url: 'https://dev.azure.com/mock-org/mock-project/_workitems/edit/12348',
    },
    {
      id: '12349',
      title: `Security vulnerability in user input validation`,
      workItemType: workItemType || 'Bug',
      state: state || 'Active',
      assignedTo: assignedTo || 'Emma Thompson',
      description: `Security audit revealed potential XSS vulnerability in user comment system. Need to implement proper input sanitization and output encoding. High priority fix required.`,
      tags: ['security', 'xss', 'high-priority'],
      createdDate: '2024-01-16T10:00:00Z',
      lastModified: '2024-01-16T15:30:00Z',
      url: 'https://dev.azure.com/mock-org/mock-project/_workitems/edit/12349',
    },
  ];

  // Filter mock items based on parameters
  let filteredItems = mockItems;
  
  if (!args.includeResolved) {
    filteredItems = filteredItems.filter(item => 
      !['Resolved', 'Closed', 'Done', 'Completed'].includes(item.state)
    );
  }

  return filteredItems.slice(0, maxResults);
}

export const searchAdoWorkItemTool = {
  name: 'searchAdoWorkItem',
  description: 'Search for work items in Azure DevOps based on query, type, state, and assignee',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for work items (title, description, tags)'
      },
      workItemType: {
        type: 'string',
        description: 'Filter by work item type (Bug, Task, User Story, etc.)'
      },
      state: {
        type: 'string',
        description: 'Filter by state (New, Active, Resolved, Closed, etc.)'
      },
      assignedTo: {
        type: 'string',
        description: 'Filter by assigned user'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 20
      },
      includeResolved: {
        type: 'boolean',
        description: 'Include resolved/closed items',
        default: true
      }
    },
    required: ['query']
  }
};