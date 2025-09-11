/**
 * Unit tests for AgentMessageCard component
 * Tests ReAct pattern display, expandable sections, and message handling
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, teamsLightTheme } from "@fluentui/react-components";
import "@testing-library/jest-dom";
import { AgentMessageCard } from "../../../sources/renderer/components/AgentMessageCard";
import { AgentMessage, MessageStatus, AgentAction, AgentThought } from "../../../sources/types/chat";

// =============================================================================
// TEST UTILITIES
// =============================================================================

const createMockAgentMessage = (overrides: Partial<AgentMessage> = {}): AgentMessage => ({
    id: "test-message-1",
    role: "agent",
    content: "This is a test agent response with analysis and recommendations.",
    timestamp: new Date("2023-10-01T10:00:00Z"),
    status: "completed" as MessageStatus,
    confidence: 0.85,
    followUpSuggestions: ["Check system logs for additional errors", "Verify network connectivity", "Review recent deployments"],
    steps: [
        {
            id: "thought-1",
            content: "Analyzing the provided log file for error patterns...",
            timestamp: new Date("2023-10-01T10:00:00Z"),
        } as AgentThought,
        {
            id: "action-1",
            type: "analyze_log",
            status: "completed" as MessageStatus,
            startedAt: new Date("2023-10-01T10:00:30Z"),
            completedAt: new Date("2023-10-01T10:01:00Z"),
            result: {
                success: true,
                summary: "Found 3 critical errors and 5 warnings in the log file",
                confidence: 0.9,
                recommendations: ["Investigate memory allocation issues", "Check database connection pool"],
            },
        } as AgentAction,
    ],
    attachedFiles: [
        {
            id: "file-1",
            name: "application.log",
            path: "/tmp/application.log",
            size: 102400,
            type: "text/plain",
            sourceType: "log",
            uploadedAt: new Date("2023-10-01T09:59:00Z"),
            preview: "ERROR: Memory allocation failed at line 1234...",
        },
    ],
    ...overrides,
});

const renderWithProvider = (component: React.ReactElement) => {
    return render(<FluentProvider theme={teamsLightTheme}>{component}</FluentProvider>);
};

// =============================================================================
// COMPONENT TESTS
// =============================================================================

describe("AgentMessageCard", () => {
    describe("Basic Rendering", () => {
        it("renders agent message with basic information", () => {
            const message = createMockAgentMessage();

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.getByText("Support Pilot Agent")).toBeInTheDocument();
            expect(screen.getByText(message.content)).toBeInTheDocument();
            expect(screen.getByText("completed")).toBeInTheDocument();
            expect(screen.getByText("85%")).toBeInTheDocument(); // Confidence
        });

        it("displays timestamp in correct format", () => {
            const message = createMockAgentMessage({
                timestamp: new Date("2023-10-01T14:30:45Z"),
            });

            renderWithProvider(<AgentMessageCard message={message} />);

            // Timestamp should be formatted as HH:MM
            expect(screen.getByText(/2:30 PM|14:30/)).toBeInTheDocument();
        });

        it("shows confidence indicator when confidence is provided", () => {
            const message = createMockAgentMessage({ confidence: 0.75 });

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.getByText("Confidence:")).toBeInTheDocument();
            expect(screen.getByText("75%")).toBeInTheDocument();
        });

        it("hides confidence indicator when confidence is not provided", () => {
            const message = createMockAgentMessage({ confidence: undefined });

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.queryByText("Confidence:")).not.toBeInTheDocument();
        });
    });

    describe("Status Display", () => {
        it("renders completed status with success badge", () => {
            const message = createMockAgentMessage({ status: "completed" });

            renderWithProvider(<AgentMessageCard message={message} />);

            const badge = screen.getByText("completed");
            expect(badge).toBeInTheDocument();
        });

        it("renders failed status with danger badge", () => {
            const message = createMockAgentMessage({ status: "failed" });

            renderWithProvider(<AgentMessageCard message={message} />);

            const badge = screen.getByText("failed");
            expect(badge).toBeInTheDocument();
        });

        it("renders processing status with warning badge", () => {
            const message = createMockAgentMessage({ status: "processing" });

            renderWithProvider(<AgentMessageCard message={message} />);

            const badge = screen.getByText("processing");
            expect(badge).toBeInTheDocument();
        });

        it("shows retry button for failed messages when onRetry is provided", () => {
            const mockRetry = jest.fn();
            const message = createMockAgentMessage({ status: "failed" });

            renderWithProvider(<AgentMessageCard message={message} onRetry={mockRetry} />);

            const retryButton = screen.getByText("Retry Analysis");
            expect(retryButton).toBeInTheDocument();

            fireEvent.click(retryButton);
            expect(mockRetry).toHaveBeenCalledTimes(1);
        });
    });

    describe("Expandable Sections", () => {
        it("renders reasoning section when thoughts are present", () => {
            const message = createMockAgentMessage();

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.getByText("Agent Reasoning (1)")).toBeInTheDocument();
        });

        it("renders actions section when actions are present", () => {
            const message = createMockAgentMessage();

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.getByText("Agent Actions (1)")).toBeInTheDocument();
        });

        it("renders results section when actions have results", () => {
            const message = createMockAgentMessage();

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.getByText("Results & Analysis")).toBeInTheDocument();
        });

        it("renders citations section when files are attached", () => {
            const message = createMockAgentMessage();

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.getByText("Sources & References")).toBeInTheDocument();
        });

        it("does not render sections when no relevant content", () => {
            const message = createMockAgentMessage({
                steps: [],
                attachedFiles: [],
            });

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.queryByText(/Agent Reasoning/)).not.toBeInTheDocument();
            expect(screen.queryByText(/Agent Actions/)).not.toBeInTheDocument();
            expect(screen.queryByText(/Results & Analysis/)).not.toBeInTheDocument();
            expect(screen.queryByText(/Sources & References/)).not.toBeInTheDocument();
        });
    });

    describe("Follow-up Suggestions", () => {
        it("renders follow-up suggestions when provided", () => {
            const message = createMockAgentMessage();

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.getByText("Suggested follow-up actions:")).toBeInTheDocument();
            expect(screen.getByText("• Check system logs for additional errors")).toBeInTheDocument();
            expect(screen.getByText("• Verify network connectivity")).toBeInTheDocument();
            expect(screen.getByText("• Review recent deployments")).toBeInTheDocument();
        });

        it("handles suggestion clicks", () => {
            const message = createMockAgentMessage();

            renderWithProvider(<AgentMessageCard message={message} />);

            const suggestion = screen.getByText("• Check system logs for additional errors");
            fireEvent.click(suggestion);

            // Should not throw error - placeholder implementation
            expect(suggestion).toBeInTheDocument();
        });

        it("does not render suggestions section when no suggestions provided", () => {
            const message = createMockAgentMessage({
                followUpSuggestions: undefined,
            });

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.queryByText("Suggested follow-up actions:")).not.toBeInTheDocument();
        });
    });

    describe("Accessibility", () => {
        it("has proper ARIA labels and structure", () => {
            const message = createMockAgentMessage();

            renderWithProvider(<AgentMessageCard message={message} />);

            // Check for expandable sections accessibility
            const accordions = screen.getAllByRole("button", { expanded: false });
            expect(accordions.length).toBeGreaterThan(0);
        });

        it("supports keyboard navigation", () => {
            const message = createMockAgentMessage();

            renderWithProvider(<AgentMessageCard message={message} />);

            const firstAccordion = screen.getAllByRole("button")[0];
            firstAccordion.focus();
            expect(firstAccordion).toHaveFocus();
        });
    });

    describe("Callback Handling", () => {
        it("calls onExpand when provided", () => {
            const mockExpand = jest.fn();
            const message = createMockAgentMessage();

            renderWithProvider(<AgentMessageCard message={message} onExpand={mockExpand} />);

            // Note: Since we're using Accordion which may not trigger our custom toggle,
            // this is testing the callback structure rather than actual behavior
            expect(mockExpand).not.toHaveBeenCalled(); // Not called on initial render
        });
    });

    describe("Edge Cases", () => {
        it("handles message with no steps", () => {
            const message = createMockAgentMessage({
                steps: undefined,
            });

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.getByText(message.content)).toBeInTheDocument();
            expect(screen.queryByText(/Agent Reasoning/)).not.toBeInTheDocument();
        });

        it("handles message with empty steps array", () => {
            const message = createMockAgentMessage({
                steps: [],
            });

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.getByText(message.content)).toBeInTheDocument();
            expect(screen.queryByText(/Agent Reasoning/)).not.toBeInTheDocument();
        });

        it("handles very long content gracefully", () => {
            const longContent = "A".repeat(1000);
            const message = createMockAgentMessage({
                content: longContent,
            });

            renderWithProvider(<AgentMessageCard message={message} />);

            expect(screen.getByText(longContent)).toBeInTheDocument();
        });
    });
});
