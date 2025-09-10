import axios from 'axios';
import { z } from 'zod';
import { ErrorMessage, SearchOptions } from '../types.js';

const SearchErrorMessageArgsSchema = z.object({
  errorMessage: z.string().describe('Error message or stack trace to search for'),
  component: z.string().optional().describe('Filter by component or service name'),
  repository: z.string().optional().describe('Filter by specific repository'),
  timeRange: z.string().optional().describe('Time range for search (e.g., "7d", "1h", "30m")'),
  maxResults: z.number().optional().default(20).describe('Maximum number of results to return'),
  includeStackTrace: z.boolean().optional().default(true).describe('Include stack trace in results'),
  minFrequency: z.number().optional().default(1).describe('Minimum frequency of error occurrence'),
});

export type SearchErrorMessageArgs = z.infer<typeof SearchErrorMessageArgsSchema>;

export async function searchErrorMessage(args: SearchErrorMessageArgs): Promise<ErrorMessage[]> {
  try {
    const { 
      errorMessage, 
      component, 
      repository, 
      timeRange = '7d',
      maxResults = 20, 
      includeStackTrace = true,
      minFrequency = 1
    } = SearchErrorMessageArgsSchema.parse(args);

    // Return mock data in development mode
    if (process.env.NODE_ENV === 'development') {
      return getMockErrorMessages(args, maxResults, minFrequency);
    }

    const adoOrganization = process.env.ADO_ORGANIZATION;
    const adoProject = process.env.ADO_PROJECT;
    const adoPat = process.env.ADO_PAT;

    if (!adoOrganization || !adoProject || !adoPat) {
      throw new Error('Azure DevOps configuration missing. Set ADO_ORGANIZATION, ADO_PROJECT, and ADO_PAT environment variables.');
    }

    // Search in multiple locations: work items, pull requests, and code
    const results: ErrorMessage[] = [];

    // 1. Search in work items for error messages
    const workItemResults = await searchInWorkItems(
      errorMessage, 
      component, 
      { adoOrganization, adoProject, adoPat }
    );
    results.push(...workItemResults);

    // 2. Search in code repositories
    const codeResults = await searchInCodeRepositories(
      errorMessage, 
      repository, 
      component,
      { adoOrganization, adoProject, adoPat }
    );
    results.push(...codeResults);

    // 3. Search in pull request comments and descriptions
    const prResults = await searchInPullRequests(
      errorMessage, 
      repository,
      { adoOrganization, adoProject, adoPat }
    );
    results.push(...prResults);

    // Filter by frequency and deduplicate
    const filteredResults = results
      .filter(error => error.frequency >= minFrequency)
      .reduce((acc, current) => {
        const existing = acc.find(item => 
          item.message.toLowerCase() === current.message.toLowerCase() && 
          item.component === current.component
        );
        if (existing) {
          existing.frequency += current.frequency;
          if (current.relatedPullRequests) {
            existing.relatedPullRequests = [
              ...(existing.relatedPullRequests || []),
              ...current.relatedPullRequests
            ];
          }
        } else {
          acc.push(current);
        }
        return acc;
      }, [] as ErrorMessage[])
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, maxResults);

    return filteredResults;

  } catch (error) {
    throw new Error(`Failed to search error messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function getMockErrorMessages(args: SearchErrorMessageArgs, maxResults: number, minFrequency: number): ErrorMessage[] {
  const { errorMessage, component, repository, includeStackTrace } = args;
  
  const mockErrors: ErrorMessage[] = [
    {
      id: 'ERR001',
      message: `${errorMessage}: Connection timeout`,
      stackTrace: includeStackTrace ? `java.net.SocketTimeoutException: ${errorMessage}\n    at java.net.SocketInputStream.socketRead0(SocketInputStream.java:116)\n    at java.net.SocketInputStream.read(SocketInputStream.java:171)\n    at com.company.service.DatabaseClient.query(DatabaseClient.java:234)` : undefined,
      component: component || 'database-service',
      repository: repository || 'backend-services',
      frequency: 45,
      firstSeen: '2024-01-08T10:15:00Z',
      lastSeen: '2024-01-16T16:20:00Z',
      relatedPullRequests: ['PR #1234: Fix connection timeout handling', 'PR #1267: Add retry logic'],
    },
    {
      id: 'ERR002',
      message: `NullPointerException in ${errorMessage} processing`,
      stackTrace: includeStackTrace ? `java.lang.NullPointerException\n    at com.company.service.ProcessingService.handleRequest(ProcessingService.java:89)\n    at com.company.controller.ApiController.processData(ApiController.java:156)` : undefined,
      component: component || 'api-gateway',
      repository: repository || 'main-application',
      frequency: 23,
      firstSeen: '2024-01-12T14:30:00Z',
      lastSeen: '2024-01-15T11:45:00Z',
      relatedPullRequests: ['PR #1245: Add null checks', 'PR #1289: Improve error handling'],
    },
    {
      id: 'ERR003',
      message: `Authentication failed: ${errorMessage}`,
      stackTrace: includeStackTrace ? `javax.security.auth.login.LoginException: ${errorMessage}\n    at com.company.auth.AuthService.authenticate(AuthService.java:67)\n    at com.company.filter.AuthFilter.doFilter(AuthFilter.java:45)` : undefined,
      component: component || 'auth-service',
      repository: repository || 'security-services',
      frequency: 18,
      firstSeen: '2024-01-10T09:22:00Z',
      lastSeen: '2024-01-16T14:18:00Z',
      relatedPullRequests: ['PR #1256: Update auth token validation'],
    },
    {
      id: 'ERR004',
      message: `OutOfMemoryError during ${errorMessage} operation`,
      stackTrace: includeStackTrace ? `java.lang.OutOfMemoryError: Java heap space\n    at java.util.ArrayList.grow(ArrayList.java:267)\n    at com.company.service.DataProcessor.processLargeDataset(DataProcessor.java:123)` : undefined,
      component: component || 'data-processor',
      repository: repository || 'analytics-services',
      frequency: 12,
      firstSeen: '2024-01-11T16:10:00Z',
      lastSeen: '2024-01-14T13:55:00Z',
      relatedPullRequests: ['PR #1278: Increase heap size', 'PR #1301: Optimize memory usage'],
    },
    {
      id: 'ERR005',
      message: `HTTP 500 Internal Server Error: ${errorMessage}`,
      stackTrace: includeStackTrace ? `org.springframework.web.util.NestedServletException: Request processing failed\n    at com.company.controller.BaseController.handleRequest(BaseController.java:78)\n    at com.company.service.BusinessLogic.execute(BusinessLogic.java:203)` : undefined,
      component: component || 'web-service',
      repository: repository || 'frontend-api',
      frequency: 34,
      firstSeen: '2024-01-09T11:40:00Z',
      lastSeen: '2024-01-16T15:32:00Z',
      relatedPullRequests: ['PR #1290: Fix error response handling', 'PR #1312: Add better logging'],
    },
    {
      id: 'ERR006',
      message: `Redis connection failed: ${errorMessage}`,
      stackTrace: includeStackTrace ? `redis.clients.jedis.exceptions.JedisConnectionException: ${errorMessage}\n    at redis.clients.jedis.Connection.connect(Connection.java:164)\n    at com.company.cache.RedisClient.getConnection(RedisClient.java:89)` : undefined,
      component: component || 'cache-service',
      repository: repository || 'infrastructure-services',
      frequency: 8,
      firstSeen: '2024-01-13T08:25:00Z',
      lastSeen: '2024-01-15T17:10:00Z',
      relatedPullRequests: ['PR #1305: Improve Redis connection handling'],
    },
    {
      id: 'ERR007',
      message: `Validation error: ${errorMessage}`,
      stackTrace: includeStackTrace ? `javax.validation.ConstraintViolationException: ${errorMessage}\n    at com.company.validator.InputValidator.validate(InputValidator.java:34)\n    at com.company.controller.FormController.submitForm(FormController.java:123)` : undefined,
      component: component || 'validation-service',
      repository: repository || 'common-utilities',
      frequency: 27,
      firstSeen: '2024-01-07T13:15:00Z',
      lastSeen: '2024-01-16T10:22:00Z',
      relatedPullRequests: ['PR #1198: Update validation rules', 'PR #1287: Fix form validation'],
    },
  ];

  // Filter by minimum frequency
  const filteredErrors = mockErrors.filter(error => error.frequency >= minFrequency);

  // Sort by frequency (descending) and limit results
  return filteredErrors
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, maxResults);
}

async function searchInWorkItems(
  errorMessage: string, 
  component?: string, 
  config?: { adoOrganization: string; adoProject: string; adoPat: string }
): Promise<ErrorMessage[]> {
  if (!config) return [];

  try {
    const wiqlQuery = `SELECT [System.Id], [System.Title], [System.Description], [System.WorkItemType], [System.CreatedDate], [System.ChangedDate] 
                      FROM WorkItems 
                      WHERE ([System.Description] CONTAINS '${errorMessage}' OR [System.Title] CONTAINS '${errorMessage}')
                      ${component ? `AND [System.Tags] CONTAINS '${component}'` : ''}
                      ORDER BY [System.ChangedDate] DESC`;

    const wiqlUrl = `https://dev.azure.com/${config.adoOrganization}/${config.adoProject}/_apis/wit/wiql?api-version=7.0`;
    
    const response = await axios.post(
      wiqlUrl,
      { query: wiqlQuery },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`:${config.adoPat}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const workItemIds = response.data.workItems.map((wi: any) => wi.id);
    if (workItemIds.length === 0) return [];

    const detailsUrl = `https://dev.azure.com/${config.adoOrganization}/${config.adoProject}/_apis/wit/workitems?ids=${workItemIds.join(',')}&api-version=7.0`;
    const detailsResponse = await axios.get(detailsUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${config.adoPat}`).toString('base64')}`,
      },
    });

    return detailsResponse.data.value.map((wi: any, index: number) => ({
      id: `WI-${wi.id}`,
      message: errorMessage,
      component: component || 'unknown',
      repository: 'work-items',
      frequency: 1,
      firstSeen: wi.fields['System.CreatedDate'],
      lastSeen: wi.fields['System.ChangedDate'],
      relatedPullRequests: [],
    }));
  } catch (error) {
    console.warn('Failed to search work items:', error);
    return [];
  }
}

async function searchInCodeRepositories(
  errorMessage: string, 
  repository?: string, 
  component?: string,
  config?: { adoOrganization: string; adoProject: string; adoPat: string }
): Promise<ErrorMessage[]> {
  if (!config) return [];

  try {
    const searchUrl = `https://almsearch.dev.azure.com/${config.adoOrganization}/${config.adoProject}/_apis/search/codesearchresults?api-version=7.0`;
    
    let searchQuery = `"${errorMessage}"`;
    if (repository) {
      searchQuery += ` repo:${repository}`;
    }
    if (component) {
      searchQuery += ` ${component}`;
    }

    const response = await axios.post(
      searchUrl,
      {
        searchText: searchQuery,
        $top: 10,
        includeSnippet: true,
      },
      {
        headers: {
          'Authorization': `Basic ${Buffer.from(`:${config.adoPat}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.results?.map((result: any, index: number) => ({
      id: `CODE-${index}`,
      message: errorMessage,
      component: component || result.repository?.name || 'unknown',
      repository: result.repository?.name || repository || 'unknown',
      frequency: result.matches?.length || 1,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      relatedPullRequests: [],
    })) || [];
  } catch (error) {
    console.warn('Failed to search code repositories:', error);
    return [];
  }
}

async function searchInPullRequests(
  errorMessage: string, 
  repository?: string,
  config?: { adoOrganization: string; adoProject: string; adoPat: string }
): Promise<ErrorMessage[]> {
  if (!config) return [];

  try {
    const prUrl = `https://dev.azure.com/${config.adoOrganization}/${config.adoProject}/_apis/git/pullrequests?api-version=7.0&$top=50&searchCriteria.status=all`;
    
    const response = await axios.get(prUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${config.adoPat}`).toString('base64')}`,
      },
    });

    const matchingPRs = response.data.value.filter((pr: any) => 
      pr.title?.toLowerCase().includes(errorMessage.toLowerCase()) ||
      pr.description?.toLowerCase().includes(errorMessage.toLowerCase())
    );

    return matchingPRs.map((pr: any) => ({
      id: `PR-${pr.pullRequestId}`,
      message: errorMessage,
      component: repository || pr.repository?.name || 'unknown',
      repository: pr.repository?.name || repository || 'unknown',
      frequency: 1,
      firstSeen: pr.creationDate,
      lastSeen: pr.lastMergeCommit?.commitId ? pr.creationDate : new Date().toISOString(),
      relatedPullRequests: [`PR #${pr.pullRequestId}`],
    }));
  } catch (error) {
    console.warn('Failed to search pull requests:', error);
    return [];
  }
}

export const searchErrorMessageTool = {
  name: 'searchErrorMessage',
  description: 'Search for error messages across Azure DevOps repositories, work items, and pull requests',
  inputSchema: {
    type: 'object',
    properties: {
      errorMessage: {
        type: 'string',
        description: 'Error message or stack trace to search for'
      },
      component: {
        type: 'string',
        description: 'Filter by component or service name'
      },
      repository: {
        type: 'string',
        description: 'Filter by specific repository'
      },
      timeRange: {
        type: 'string',
        description: 'Time range for search (e.g., "7d", "1h", "30m")'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 20
      },
      includeStackTrace: {
        type: 'boolean',
        description: 'Include stack trace in results',
        default: true
      },
      minFrequency: {
        type: 'number',
        description: 'Minimum frequency of error occurrence',
        default: 1
      }
    },
    required: ['errorMessage']
  }
};