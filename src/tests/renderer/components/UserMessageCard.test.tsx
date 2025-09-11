/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { UserMessageCard } from "../../../sources/renderer/components/UserMessageCard";
import type { UserMessage } from "../../../sources/types/chat";

// Test wrapper with FluentProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <FluentProvider theme={webLightTheme}>{children}</FluentProvider>
);

describe("UserMessageCard", () => {
    const mockUserMessage: UserMessage = {
        id: "test-user-msg-1",
        role: "user",
        content: "Test user message content",
        query: "Test query",
        timestamp: new Date("2024-01-15T10:30:00Z"),
        status: "completed",
    };

    const mockUserMessageWithAttachments: UserMessage = {
        ...mockUserMessage,
        attachedFiles: [
            {
                id: "file-1",
                name: "test.log",
                path: "/test/test.log",
                size: 1024,
                type: "text/plain",
                sourceType: "log",
                uploadedAt: new Date("2024-01-15T10:25:00Z"),
                preview: "Test file content",
            },
            {
                id: "file-2",
                name: "error.txt",
                path: "/test/error.txt",
                size: 512,
                type: "text/plain",
                sourceType: "log",
                uploadedAt: new Date("2024-01-15T10:26:00Z"),
                preview: "Error file content",
            },
        ],
    };

    it("renders user message content", () => {
        render(
            <TestWrapper>
                <UserMessageCard message={mockUserMessage} />
            </TestWrapper>
        );

        expect(screen.getByText("Test user message content")).toBeInTheDocument();
    });

    it("renders attachment info when files are attached", () => {
        render(
            <TestWrapper>
                <UserMessageCard message={mockUserMessageWithAttachments} />
            </TestWrapper>
        );

        expect(screen.getByText("Test user message content")).toBeInTheDocument();
        expect(screen.getByText("2 file(s) attached")).toBeInTheDocument();
    });

    it("does not render attachment info when no files are attached", () => {
        render(
            <TestWrapper>
                <UserMessageCard message={mockUserMessage} />
            </TestWrapper>
        );

        expect(screen.getByText("Test user message content")).toBeInTheDocument();
        expect(screen.queryByText(/file\(s\) attached/)).not.toBeInTheDocument();
    });

    it("applies custom className when provided", () => {
        const { container } = render(
            <TestWrapper>
                <UserMessageCard message={mockUserMessage} className="custom-class" />
            </TestWrapper>
        );

        const messageCard = container.firstChild as HTMLElement;
        expect(messageCard).toHaveClass("custom-class");
    });

    it("handles empty attachedFiles array", () => {
        const messageWithEmptyAttachments: UserMessage = {
            ...mockUserMessage,
            attachedFiles: [],
        };

        render(
            <TestWrapper>
                <UserMessageCard message={messageWithEmptyAttachments} />
            </TestWrapper>
        );

        expect(screen.getByText("Test user message content")).toBeInTheDocument();
        expect(screen.queryByText(/file\(s\) attached/)).not.toBeInTheDocument();
    });
});
