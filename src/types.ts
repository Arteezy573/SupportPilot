export interface AdoWorkItem {
  id: string;
  title: string;
  workItemType: string;
  state: string;
  assignedTo?: string;
  description?: string;
  tags?: string[];
  createdDate: string;
  lastModified: string;
  url: string;
}

export interface ICMIncident {
  id: string;
  title: string;
  severity: string;
  status: string;
  assignedTeam?: string;
  description?: string;
  resolution?: string;
  createdDate: string;
  resolvedDate?: string;
  similarityScore?: number;
}

export interface ErrorMessage {
  id: string;
  message: string;
  stackTrace?: string;
  component: string;
  repository: string;
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  relatedPullRequests?: string[];
}

export interface CustomerEmailSummary {
  summary: string;
  keyPoints: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  suggestedActions: string[];
  extractedContext: {
    errorMessages?: string[];
    reproductionSteps?: string[];
    affectedSystems?: string[];
    customerInfo?: {
      name?: string;
      organization?: string;
      contact?: string;
    };
  };
}

export interface SearchOptions {
  maxResults?: number;
  includeResolved?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}