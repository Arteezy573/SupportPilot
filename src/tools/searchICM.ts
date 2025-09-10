import axios from 'axios';
import { z } from 'zod';
import { ICMIncident, SearchOptions } from '../types.js';

const SearchICMArgsSchema = z.object({
  query: z.string().describe('Search query for incidents (title, description, keywords)'),
  severity: z.enum(['Sev0', 'Sev1', 'Sev2', 'Sev3', 'Sev4']).optional().describe('Filter by incident severity'),
  status: z.string().optional().describe('Filter by incident status (Active, Resolved, etc.)'),
  assignedTeam: z.string().optional().describe('Filter by assigned team'),
  maxResults: z.number().optional().default(20).describe('Maximum number of results to return'),
  includeResolved: z.boolean().optional().default(true).describe('Include resolved incidents'),
  similarityThreshold: z.number().optional().default(0.7).describe('Minimum similarity score for matching (0-1)'),
});

export type SearchICMArgs = z.infer<typeof SearchICMArgsSchema>;

export async function searchICM(args: SearchICMArgs): Promise<ICMIncident[]> {
  try {
    const { 
      query, 
      severity, 
      status, 
      assignedTeam, 
      maxResults = 20, 
      includeResolved = true,
      similarityThreshold = 0.7
    } = SearchICMArgsSchema.parse(args);

    // Return mock data in development mode
    if (process.env.NODE_ENV === 'development') {
      return getMockICMIncidents(args, maxResults, similarityThreshold);
    }

    const icmApiUrl = process.env.ICM_API_URL;
    const icmApiKey = process.env.ICM_API_KEY;
    const icmTenant = process.env.ICM_TENANT;

    if (!icmApiUrl || !icmApiKey || !icmTenant) {
      throw new Error('ICM configuration missing. Set ICM_API_URL, ICM_API_KEY, and ICM_TENANT environment variables.');
    }

    // Build ICM API query parameters
    const searchParams = new URLSearchParams({
      '$top': maxResults.toString(),
      '$orderby': 'CreatedDate desc',
    });

    // Build filter conditions
    const filters: string[] = [];
    
    if (severity) {
      filters.push(`Severity eq '${severity}'`);
    }
    
    if (status) {
      filters.push(`Status eq '${status}'`);
    } else if (!includeResolved) {
      filters.push(`Status ne 'Resolved' and Status ne 'Closed'`);
    }
    
    if (assignedTeam) {
      filters.push(`contains(OwningTeam, '${assignedTeam}')`);
    }

    // Add text search filter
    if (query.trim()) {
      filters.push(`(contains(Title, '${query}') or contains(Description, '${query}') or contains(Keywords, '${query}'))`);
    }

    if (filters.length > 0) {
      searchParams.append('$filter', filters.join(' and '));
    }

    const requestUrl = `${icmApiUrl}/v1/${icmTenant}/incidents?${searchParams.toString()}`;

    const response = await axios.get(requestUrl, {
      headers: {
        'Authorization': `Bearer ${icmApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const incidents: ICMIncident[] = response.data.value?.map((incident: any) => {
      // Calculate similarity score based on query match
      let similarityScore = 0;
      if (query.trim()) {
        const queryLower = query.toLowerCase();
        const titleMatch = incident.Title?.toLowerCase().includes(queryLower) ? 0.4 : 0;
        const descMatch = incident.Description?.toLowerCase().includes(queryLower) ? 0.3 : 0;
        const keywordMatch = incident.Keywords?.toLowerCase().includes(queryLower) ? 0.3 : 0;
        similarityScore = titleMatch + descMatch + keywordMatch;
      } else {
        similarityScore = 1.0; // Full score if no query filtering
      }

      return {
        id: incident.Id,
        title: incident.Title || '',
        severity: incident.Severity || '',
        status: incident.Status || '',
        assignedTeam: incident.OwningTeam || incident.ResponsibleTeam,
        description: incident.Description || incident.Summary,
        resolution: incident.Resolution,
        createdDate: incident.CreatedDate,
        resolvedDate: incident.ResolvedDate,
        similarityScore: Math.round(similarityScore * 100) / 100,
      };
    }) || [];

    // Filter by similarity threshold and sort by similarity score
    return incidents
      .filter(incident => incident.similarityScore >= similarityThreshold)
      .sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0))
      .slice(0, maxResults);

  } catch (error) {
    throw new Error(`Failed to search ICM incidents: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function getMockICMIncidents(args: SearchICMArgs, maxResults: number, similarityThreshold: number): ICMIncident[] {
  const { query, severity, status, assignedTeam } = args;
  
  const mockIncidents: ICMIncident[] = [
    {
      id: 'INC12345678',
      title: `Authentication service failure affecting ${query || 'login'} functionality`,
      severity: severity || 'Sev1',
      status: status || 'Resolved',
      assignedTeam: assignedTeam || 'Platform Engineering',
      description: `Critical authentication service outage causing widespread login failures. Users unable to authenticate via SSO, API tokens, and password-based logins. Impact estimated at 85% of user base.`,
      resolution: 'Root cause identified as expired SSL certificate on auth proxy. Certificate renewed and service restored. Added monitoring to prevent future certificate expirations.',
      createdDate: '2024-01-15T10:30:00Z',
      resolvedDate: '2024-01-15T14:45:00Z',
      similarityScore: calculateSimilarity(query, 'Authentication service failure affecting login functionality'),
    },
    {
      id: 'INC12345679',
      title: `Database connection timeouts causing ${query || 'service'} degradation`,
      severity: severity || 'Sev2',
      status: status || 'Resolved',
      assignedTeam: assignedTeam || 'Service Reliability',
      description: 'Multiple services experiencing database connection timeouts resulting in 504 gateway timeouts for end users. Connection pool exhaustion identified as primary cause.',
      resolution: 'Increased database connection pool size from 50 to 200. Implemented connection lifecycle monitoring and alerting.',
      createdDate: '2024-01-12T08:15:00Z',
      resolvedDate: '2024-01-12T16:20:00Z',
      similarityScore: calculateSimilarity(query, 'Database connection timeouts causing service degradation'),
    },
    {
      id: 'INC12345680',
      title: `API rate limiting causing customer ${query || 'request'} failures`,
      severity: severity || 'Sev3',
      status: status || 'Active',
      assignedTeam: assignedTeam || 'API Team',
      description: 'Aggressive rate limiting configuration causing legitimate customer requests to be throttled. Multiple customer complaints received.',
      resolution: undefined,
      createdDate: '2024-01-16T09:00:00Z',
      resolvedDate: undefined,
      similarityScore: calculateSimilarity(query, 'API rate limiting causing customer request failures'),
    },
    {
      id: 'INC12345681',
      title: `Memory leak in background ${query || 'processing'} service`,
      severity: severity || 'Sev2',
      status: status || 'Resolved',
      assignedTeam: assignedTeam || 'Backend Services',
      description: 'Background processing service consuming increasing amounts of memory over time, leading to OOM kills and service restarts every 4-6 hours.',
      resolution: 'Memory leak identified in event handler cleanup. Fixed in version 3.2.1 and deployed to production.',
      createdDate: '2024-01-10T14:20:00Z',
      resolvedDate: '2024-01-11T11:30:00Z',
      similarityScore: calculateSimilarity(query, 'Memory leak in background processing service'),
    },
    {
      id: 'INC12345682',
      title: `CDN cache invalidation causing ${query || 'content'} delivery issues`,
      severity: severity || 'Sev3',
      status: status || 'Resolved',
      assignedTeam: assignedTeam || 'Infrastructure',
      description: 'CDN cache not properly invalidating after content updates, resulting in users seeing stale content and 404 errors for new resources.',
      resolution: 'Updated cache invalidation logic to use wildcard patterns. Implemented cache warming for critical assets.',
      createdDate: '2024-01-08T16:45:00Z',
      resolvedDate: '2024-01-09T10:15:00Z',
      similarityScore: calculateSimilarity(query, 'CDN cache invalidation causing content delivery issues'),
    },
    {
      id: 'INC12345683',
      title: `Payment gateway timeout during ${query || 'checkout'} process`,
      severity: severity || 'Sev1',
      status: status || 'Resolved',
      assignedTeam: assignedTeam || 'Payments Team',
      description: 'Third-party payment gateway experiencing timeouts during checkout, preventing customers from completing purchases. Revenue impact significant.',
      resolution: 'Implemented circuit breaker pattern and fallback to secondary payment processor. Primary gateway issues resolved by vendor.',
      createdDate: '2024-01-14T11:30:00Z',
      resolvedDate: '2024-01-14T15:20:00Z',
      similarityScore: calculateSimilarity(query, 'Payment gateway timeout during checkout process'),
    },
  ];

  // Filter by similarity threshold and other criteria
  let filteredIncidents = mockIncidents.filter(incident => 
    incident.similarityScore >= similarityThreshold
  );

  if (!args.includeResolved) {
    filteredIncidents = filteredIncidents.filter(incident => 
      !['Resolved', 'Closed'].includes(incident.status)
    );
  }

  return filteredIncidents
    .sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0))
    .slice(0, maxResults);
}

function calculateSimilarity(query: string, title: string): number {
  if (!query || !title) return 0.5;
  
  const queryLower = query.toLowerCase();
  const titleLower = title.toLowerCase();
  
  // Simple similarity calculation based on word matches
  const queryWords = queryLower.split(/\s+/);
  const titleWords = titleLower.split(/\s+/);
  
  let matches = 0;
  queryWords.forEach(word => {
    if (titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))) {
      matches++;
    }
  });
  
  const similarity = matches / Math.max(queryWords.length, 1);
  return Math.min(Math.max(similarity + 0.3, 0.5), 1.0); // Boost base similarity
}

export const searchICMTool = {
  name: 'searchICM',
  description: 'Search for similar incidents in ICM (Incident Command and Management) system',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query for incidents (title, description, keywords)'
      },
      severity: {
        type: 'string',
        enum: ['Sev0', 'Sev1', 'Sev2', 'Sev3', 'Sev4'],
        description: 'Filter by incident severity'
      },
      status: {
        type: 'string',
        description: 'Filter by incident status (Active, Resolved, etc.)'
      },
      assignedTeam: {
        type: 'string',
        description: 'Filter by assigned team'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 20
      },
      includeResolved: {
        type: 'boolean',
        description: 'Include resolved incidents',
        default: true
      },
      similarityThreshold: {
        type: 'number',
        description: 'Minimum similarity score for matching (0-1)',
        default: 0.7,
        minimum: 0,
        maximum: 1
      }
    },
    required: ['query']
  }
};