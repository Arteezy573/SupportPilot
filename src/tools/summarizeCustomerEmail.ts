import { z } from 'zod';
import { CustomerEmailSummary } from '../types.js';

const SummarizeCustomerEmailArgsSchema = z.object({
  emailContent: z.string().describe('The full content of the customer email to summarize'),
  includeAttachmentInfo: z.boolean().optional().default(false).describe('Whether to include information about email attachments'),
  customerContext: z.object({
    customerName: z.string().optional(),
    organization: z.string().optional(),
    previousTickets: z.array(z.string()).optional(),
    accountTier: z.enum(['free', 'basic', 'premium', 'enterprise']).optional(),
  }).optional().describe('Additional context about the customer'),
});

export type SummarizeCustomerEmailArgs = z.infer<typeof SummarizeCustomerEmailArgsSchema>;

export async function summarizeCustomerEmail(args: SummarizeCustomerEmailArgs): Promise<CustomerEmailSummary> {
  try {
    const { emailContent, includeAttachmentInfo = false, customerContext } = SummarizeCustomerEmailArgsSchema.parse(args);

    // Return mock data in development mode
    if (process.env.NODE_ENV === 'development') {
      return getMockCustomerEmailSummary(emailContent, customerContext);
    }

    // Extract key information using natural language processing patterns
    const summary = await analyzeEmailContent(emailContent);
    const keyPoints = extractKeyPoints(emailContent);
    const urgency = determineUrgency(emailContent);
    const category = categorizeIssue(emailContent);
    const suggestedActions = generateSuggestedActions(emailContent, category);
    const extractedContext = extractTechnicalContext(emailContent);

    // Enhance with customer context if provided
    if (customerContext) {
      if (customerContext.customerName) {
        extractedContext.customerInfo = {
          ...extractedContext.customerInfo,
          name: customerContext.customerName,
          organization: customerContext.organization,
        };
      }

      // Adjust urgency based on account tier
      if (customerContext.accountTier === 'enterprise' && urgency === 'medium') {
        // Escalate enterprise customers
      }
    }

    return {
      summary,
      keyPoints,
      urgency,
      category,
      suggestedActions,
      extractedContext,
    };

  } catch (error) {
    throw new Error(`Failed to summarize customer email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function analyzeEmailContent(content: string): string {
  const emailLower = content.toLowerCase();
  
  // Extract the main issue/request
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const importantSentences = sentences.filter(sentence => {
    const lower = sentence.toLowerCase();
    return lower.includes('error') || 
           lower.includes('issue') || 
           lower.includes('problem') || 
           lower.includes('help') || 
           lower.includes('unable') ||
           lower.includes('not working') ||
           lower.includes('failure') ||
           lower.includes('broken');
  });

  if (importantSentences.length > 0) {
    return importantSentences[0].trim() + (importantSentences.length > 1 ? `. Additional issues mentioned: ${importantSentences.slice(1, 3).join('; ')}` : '');
  }

  // Fallback to first few sentences
  return sentences.slice(0, 2).join('. ').trim();
}

function extractKeyPoints(content: string): string[] {
  const keyPoints: string[] = [];
  const emailLower = content.toLowerCase();

  // Error messages (look for quotes, error codes, stack traces)
  const errorMatches = content.match(/"[^"]*error[^"]*"/gi) || content.match(/error[:\s]+[^\n.!?]*/gi);
  if (errorMatches) {
    keyPoints.push(`Error mentioned: ${errorMatches[0].replace(/"/g, '').trim()}`);
  }

  // System/environment information
  const systemMatches = content.match(/(version|browser|os|operating system|environment)[:\s]+[^\n.!?]*/gi);
  if (systemMatches) {
    keyPoints.push(`System info: ${systemMatches[0].trim()}`);
  }

  // Urgency indicators
  if (emailLower.includes('urgent') || emailLower.includes('critical') || emailLower.includes('asap')) {
    keyPoints.push('Customer indicates urgency');
  }

  // Business impact
  if (emailLower.includes('production') || emailLower.includes('downtime') || emailLower.includes('customers affected')) {
    keyPoints.push('Production/business impact mentioned');
  }

  // Reproduction steps
  if (emailLower.includes('steps to reproduce') || emailLower.includes('how to reproduce')) {
    keyPoints.push('Reproduction steps provided');
  }

  // Timeline information
  const timeMatches = content.match(/(started|began|since|for the past|yesterday|today|this morning)[^\n.!?]*/gi);
  if (timeMatches) {
    keyPoints.push(`Timeline: ${timeMatches[0].trim()}`);
  }

  return keyPoints.slice(0, 5); // Limit to top 5 key points
}

function determineUrgency(content: string): 'low' | 'medium' | 'high' | 'critical' {
  const emailLower = content.toLowerCase();

  // Critical indicators
  if (emailLower.includes('critical') || 
      emailLower.includes('production down') || 
      emailLower.includes('system down') ||
      emailLower.includes('complete outage')) {
    return 'critical';
  }

  // High urgency indicators
  if (emailLower.includes('urgent') || 
      emailLower.includes('asap') || 
      emailLower.includes('immediately') ||
      emailLower.includes('production') ||
      emailLower.includes('blocking') ||
      emailLower.includes('customers affected')) {
    return 'high';
  }

  // Medium urgency indicators
  if (emailLower.includes('soon') || 
      emailLower.includes('important') || 
      emailLower.includes('need help') ||
      emailLower.includes('not working') ||
      emailLower.includes('broken')) {
    return 'medium';
  }

  return 'low';
}

function categorizeIssue(content: string): string {
  const emailLower = content.toLowerCase();

  if (emailLower.includes('login') || emailLower.includes('authentication') || emailLower.includes('sign in')) {
    return 'Authentication';
  }
  
  if (emailLower.includes('payment') || emailLower.includes('billing') || emailLower.includes('invoice')) {
    return 'Billing';
  }
  
  if (emailLower.includes('api') || emailLower.includes('integration') || emailLower.includes('webhook')) {
    return 'API/Integration';
  }
  
  if (emailLower.includes('performance') || emailLower.includes('slow') || emailLower.includes('timeout')) {
    return 'Performance';
  }
  
  if (emailLower.includes('data') || emailLower.includes('sync') || emailLower.includes('export')) {
    return 'Data Management';
  }
  
  if (emailLower.includes('ui') || emailLower.includes('interface') || emailLower.includes('display')) {
    return 'User Interface';
  }
  
  if (emailLower.includes('feature') || emailLower.includes('how to') || emailLower.includes('tutorial')) {
    return 'Feature Request/Question';
  }

  return 'General Support';
}

function generateSuggestedActions(content: string, category: string): string[] {
  const actions: string[] = [];
  const emailLower = content.toLowerCase();

  // Category-specific actions
  switch (category) {
    case 'Authentication':
      actions.push('Check user account status and permissions');
      actions.push('Verify authentication configuration');
      break;
    case 'API/Integration':
      actions.push('Review API logs and error responses');
      actions.push('Check API key validity and rate limits');
      break;
    case 'Performance':
      actions.push('Review system performance metrics');
      actions.push('Check for recent deployments or changes');
      break;
    case 'Billing':
      actions.push('Review account billing status');
      actions.push('Check payment method and subscription');
      break;
  }

  // Content-specific actions
  if (emailLower.includes('error') || emailLower.includes('exception')) {
    actions.push('Search for similar error messages in knowledge base');
    actions.push('Review error logs and stack traces');
  }

  if (emailLower.includes('not working') || emailLower.includes('broken')) {
    actions.push('Reproduce the issue in test environment');
    actions.push('Check service status and recent incidents');
  }

  // General actions
  actions.push('Acknowledge receipt and provide initial response timeline');
  
  if (determineUrgency(content) === 'high' || determineUrgency(content) === 'critical') {
    actions.unshift('Escalate to on-call engineer immediately');
  }

  return [...new Set(actions)]; // Remove duplicates
}

function extractTechnicalContext(content: string): CustomerEmailSummary['extractedContext'] {
  const context: CustomerEmailSummary['extractedContext'] = {};

  // Extract error messages
  const errorMessages = [];
  const errorPatterns = [
    /"[^"]*error[^"]*"/gi,
    /error[:\s]+[^\n.!?]*/gi,
    /exception[:\s]+[^\n.!?]*/gi,
    /failed[:\s]+[^\n.!?]*/gi
  ];

  for (const pattern of errorPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      errorMessages.push(...matches.map(m => m.replace(/"/g, '').trim()));
    }
  }
  
  if (errorMessages.length > 0) {
    context.errorMessages = [...new Set(errorMessages)].slice(0, 3);
  }

  // Extract reproduction steps
  const reproductionSteps = [];
  const stepPatterns = [
    /steps?\s+to\s+reproduce[:\s]*\n?([^]*?)(?=\n\s*\n|\n\s*[A-Z]|$)/i,
    /how\s+to\s+reproduce[:\s]*\n?([^]*?)(?=\n\s*\n|\n\s*[A-Z]|$)/i,
    /reproduction[:\s]*\n?([^]*?)(?=\n\s*\n|\n\s*[A-Z]|$)/i
  ];

  for (const pattern of stepPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const steps = match[1].split(/\n/).filter(line => line.trim().length > 0).slice(0, 5);
      reproductionSteps.push(...steps);
      break;
    }
  }

  if (reproductionSteps.length > 0) {
    context.reproductionSteps = reproductionSteps.map(step => step.trim());
  }

  // Extract affected systems
  const affectedSystems = [];
  const systemPatterns = [
    /(?:system|service|application|component)[:\s]+([^\n.!?]*)/gi,
    /(?:using|with|on)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:version|v\d)/gi
  ];

  for (const pattern of systemPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 2) {
        affectedSystems.push(match[1].trim());
      }
    }
  }

  if (affectedSystems.length > 0) {
    context.affectedSystems = [...new Set(affectedSystems)].slice(0, 3);
  }

  // Extract customer information
  const customerInfo: CustomerEmailSummary['extractedContext']['customerInfo'] = {};
  
  // Look for name patterns
  const nameMatch = content.match(/(?:my name is|i am|this is)\s+([A-Za-z\s]+)/i);
  if (nameMatch && nameMatch[1]) {
    customerInfo.name = nameMatch[1].trim();
  }

  // Look for organization patterns
  const orgMatch = content.match(/(?:company|organization|at)\s+([A-Za-z\s&.,]+)(?:\s|$)/i);
  if (orgMatch && orgMatch[1] && orgMatch[1].length > 2) {
    customerInfo.organization = orgMatch[1].trim();
  }

  // Look for contact information
  const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    customerInfo.contact = emailMatch[0];
  }

  if (Object.keys(customerInfo).length > 0) {
    context.customerInfo = customerInfo;
  }

  return context;
}

function getMockCustomerEmailSummary(emailContent: string, customerContext?: any): CustomerEmailSummary {
  const emailLower = emailContent.toLowerCase();
  
  // Determine urgency based on keywords in email
  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  if (emailLower.includes('urgent') || emailLower.includes('critical') || emailLower.includes('down') || emailLower.includes('outage')) {
    urgency = 'high';
  } else if (emailLower.includes('please help') || emailLower.includes('asap') || emailLower.includes('immediately')) {
    urgency = 'high';
  } else if (emailLower.includes('when you get a chance') || emailLower.includes('no rush')) {
    urgency = 'low';
  }

  // Determine category based on keywords
  let category = 'Technical Issue';
  if (emailLower.includes('login') || emailLower.includes('authentication') || emailLower.includes('password')) {
    category = 'Authentication & Access';
  } else if (emailLower.includes('billing') || emailLower.includes('payment') || emailLower.includes('invoice')) {
    category = 'Billing & Payments';
  } else if (emailLower.includes('feature') || emailLower.includes('enhancement')) {
    category = 'Feature Request';
  } else if (emailLower.includes('performance') || emailLower.includes('slow') || emailLower.includes('timeout')) {
    category = 'Performance Issue';
  }

  return {
    summary: `Customer is reporting ${category.toLowerCase()} that appears to be related to ${emailContent.substring(0, 100).replace(/\n/g, ' ')}...`,
    keyPoints: [
      'Customer experiencing difficulties with the system',
      'Issue appears to be reproducible',
      'Customer has provided detailed information',
      urgency === 'high' ? 'High priority issue requiring immediate attention' : 'Standard support request'
    ],
    urgency,
    category,
    suggestedActions: [
      'Acknowledge receipt of the customer\'s request',
      'Gather additional technical details if needed',
      'Review similar past incidents for solutions',
      'Escalate to appropriate technical team if necessary',
      'Provide estimated timeline for resolution'
    ],
    extractedContext: {
      errorMessages: emailLower.includes('error') ? ['Error message extracted from customer email'] : [],
      reproductionSteps: emailLower.includes('step') || emailLower.includes('reproduce') ? ['Steps to reproduce provided by customer'] : [],
      affectedSystems: emailLower.includes('system') || emailLower.includes('service') ? ['System/service mentioned in email'] : [],
      customerInfo: {
        name: customerContext?.customerName || 'John Doe',
        organization: customerContext?.organization || 'Acme Corporation',
        contact: 'customer@example.com'
      }
    }
  };
}

export const summarizeCustomerEmailTool = {
  name: 'summarizeCustomerEmail',
  description: 'Analyze and summarize customer email content, extracting key information, urgency, and suggested actions',
  inputSchema: {
    type: 'object',
    properties: {
      emailContent: {
        type: 'string',
        description: 'The full content of the customer email to summarize'
      },
      includeAttachmentInfo: {
        type: 'boolean',
        description: 'Whether to include information about email attachments',
        default: false
      },
      customerContext: {
        type: 'object',
        properties: {
          customerName: {
            type: 'string',
            description: 'Customer name'
          },
          organization: {
            type: 'string',
            description: 'Customer organization'
          },
          previousTickets: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Previous ticket IDs for this customer'
          },
          accountTier: {
            type: 'string',
            enum: ['free', 'basic', 'premium', 'enterprise'],
            description: 'Customer account tier'
          }
        },
        description: 'Additional context about the customer'
      }
    },
    required: ['emailContent']
  }
};