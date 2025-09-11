/**
 * TypeScript interfaces for main process functionality
 * This file contains type definitions used by the main Electron process
 */

// Interface for file information returned by attach-files handler
export interface FileInfo {
    path: string;
    name: string;
    size: number;
    type: string;
    content?: string;
}

// Interface for log analysis results
export interface LogAnalysis {
    errors: string[];
    warnings: string[];
    suggestions: string[];
    timeline: Array<{
        timestamp: string;
        level: string;
        message: string;
    }>;
}

// Interface for email processing summary
export interface EmailSummary {
    participants: string[];
    timeline: string[];
    issues: string[];
    customerImpact: string;
}

// Interface for standard API response structure
export interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// Interface for file attachment API response
export interface AttachFilesResponse extends APIResponse {
    files: FileInfo[];
}

// Interface for log analysis API response
export interface AnalyzeLogResponse extends APIResponse {
    analysis?: LogAnalysis;
}

// Interface for email processing API response
export interface ProcessEmailResponse extends APIResponse {
    summary?: EmailSummary;
}

// Interface for window state management
export interface WindowState {
    x: number;
    y: number;
    width: number;
    height: number;
    isMaximized: boolean;
}
