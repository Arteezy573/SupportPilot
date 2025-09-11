/**
 * Unit tests for SuggestedActions component
 * Tests action buttons, callbacks, and loading states
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import "@testing-library/jest-dom";

import { SuggestedActions, SuggestedActionsProps } from "../../../sources/renderer/components/SuggestedActions";

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Renders SuggestedActions with FluentProvider wrapper
 */
const renderWithProvider = (props: Partial<SuggestedActionsProps> = {}) => {
    const defaultProps: SuggestedActionsProps = {
        showSummarizeButton: true,
        showCreateIcmButton: true,
        onSummarizeClick: jest.fn(),
        onCreateIcmClick: jest.fn(),
        disabled: false,
        summarizeLoading: false,
        createIcmLoading: false,
        ...props,
    };

    return render(
        <FluentProvider theme={webLightTheme}>
            <SuggestedActions {...defaultProps} />
        </FluentProvider>
    );
};

// =============================================================================
// TESTS
// =============================================================================

describe("SuggestedActions", () => {
    describe("Rendering", () => {
        it("renders the component with default props", () => {
            renderWithProvider();
            
            expect(screen.getByText("Quick Actions")).toBeInTheDocument();
            expect(screen.getByText("Summarize Issue")).toBeInTheDocument();
            expect(screen.getByText("Create ICM Draft")).toBeInTheDocument();
        });

        it("shows both action buttons by default", () => {
            renderWithProvider();
            
            expect(screen.getByLabelText("Summarize issue from attached files")).toBeInTheDocument();
            expect(screen.getByLabelText("Create ICM ticket draft")).toBeInTheDocument();
        });

        it("hides summarize button when showSummarizeButton is false", () => {
            renderWithProvider({ showSummarizeButton: false });
            
            expect(screen.queryByLabelText("Summarize issue from attached files")).not.toBeInTheDocument();
            expect(screen.getByLabelText("Create ICM ticket draft")).toBeInTheDocument();
        });

        it("hides create ICM button when showCreateIcmButton is false", () => {
            renderWithProvider({ showCreateIcmButton: false });
            
            expect(screen.getByLabelText("Summarize issue from attached files")).toBeInTheDocument();
            expect(screen.queryByLabelText("Create ICM ticket draft")).not.toBeInTheDocument();
        });

        it("hides both buttons when both flags are false", () => {
            renderWithProvider({ 
                showSummarizeButton: false, 
                showCreateIcmButton: false 
            });
            
            expect(screen.getByText("Quick Actions")).toBeInTheDocument();
            expect(screen.queryByLabelText("Summarize issue from attached files")).not.toBeInTheDocument();
            expect(screen.queryByLabelText("Create ICM ticket draft")).not.toBeInTheDocument();
        });
    });

    describe("Button content", () => {
        it("displays correct content for summarize button", () => {
            renderWithProvider();
            
            expect(screen.getByText("Summarize Issue")).toBeInTheDocument();
            expect(screen.getByText("Analyze logs and emails to extract key issue details")).toBeInTheDocument();
        });

        it("displays correct content for create ICM button", () => {
            renderWithProvider();
            
            expect(screen.getByText("Create ICM Draft")).toBeInTheDocument();
            expect(screen.getByText("Generate structured incident ticket from analysis")).toBeInTheDocument();
        });

        it("shows loading state for summarize button", () => {
            renderWithProvider({ summarizeLoading: true });
            
            expect(screen.getByText("Analyzing...")).toBeInTheDocument();
            expect(screen.queryByText("Summarize Issue")).not.toBeInTheDocument();
        });

        it("shows loading state for create ICM button", () => {
            renderWithProvider({ createIcmLoading: true });
            
            expect(screen.getByText("Creating...")).toBeInTheDocument();
            expect(screen.queryByText("Create ICM Draft")).not.toBeInTheDocument();
        });
    });

    describe("Interactions", () => {
        it("calls onSummarizeClick when summarize button is clicked", () => {
            const onSummarizeClick = jest.fn();
            renderWithProvider({ onSummarizeClick });
            
            const summarizeButton = screen.getByLabelText("Summarize issue from attached files");
            fireEvent.click(summarizeButton);
            
            expect(onSummarizeClick).toHaveBeenCalledTimes(1);
        });

        it("calls onCreateIcmClick when create ICM button is clicked", () => {
            const onCreateIcmClick = jest.fn();
            renderWithProvider({ onCreateIcmClick });
            
            const createIcmButton = screen.getByLabelText("Create ICM ticket draft");
            fireEvent.click(createIcmButton);
            
            expect(onCreateIcmClick).toHaveBeenCalledTimes(1);
        });

        it("does not crash when callbacks are not provided", () => {
            renderWithProvider({ 
                onSummarizeClick: undefined, 
                onCreateIcmClick: undefined 
            });
            
            const summarizeButton = screen.getByLabelText("Summarize issue from attached files");
            const createIcmButton = screen.getByLabelText("Create ICM ticket draft");
            
            expect(() => {
                fireEvent.click(summarizeButton);
                fireEvent.click(createIcmButton);
            }).not.toThrow();
        });
    });

    describe("Disabled states", () => {
        it("disables buttons when disabled prop is true", () => {
            renderWithProvider({ disabled: true });
            
            const summarizeButton = screen.getByLabelText("Summarize issue from attached files");
            const createIcmButton = screen.getByLabelText("Create ICM ticket draft");
            
            expect(summarizeButton).toBeDisabled();
            expect(createIcmButton).toBeDisabled();
        });

        it("disables summarize button when loading", () => {
            renderWithProvider({ summarizeLoading: true });
            
            const summarizeButton = screen.getByLabelText("Summarize issue from attached files");
            expect(summarizeButton).toBeDisabled();
        });

        it("disables create ICM button when loading", () => {
            renderWithProvider({ createIcmLoading: true });
            
            const createIcmButton = screen.getByLabelText("Create ICM ticket draft");
            expect(createIcmButton).toBeDisabled();
        });

        it("does not call handlers when buttons are disabled", () => {
            const onSummarizeClick = jest.fn();
            const onCreateIcmClick = jest.fn();
            renderWithProvider({ 
                disabled: true,
                onSummarizeClick,
                onCreateIcmClick
            });
            
            const summarizeButton = screen.getByLabelText("Summarize issue from attached files");
            const createIcmButton = screen.getByLabelText("Create ICM ticket draft");
            
            fireEvent.click(summarizeButton);
            fireEvent.click(createIcmButton);
            
            expect(onSummarizeClick).not.toHaveBeenCalled();
            expect(onCreateIcmClick).not.toHaveBeenCalled();
        });
    });

    describe("Accessibility", () => {
        it("has proper ARIA labels for buttons", () => {
            renderWithProvider();
            
            const summarizeButton = screen.getByLabelText("Summarize issue from attached files");
            const createIcmButton = screen.getByLabelText("Create ICM ticket draft");
            
            expect(summarizeButton).toHaveAttribute("aria-label", "Summarize issue from attached files");
            expect(createIcmButton).toHaveAttribute("aria-label", "Create ICM ticket draft");
        });

        it("has proper icons with aria-hidden", () => {
            const { container } = renderWithProvider();
            
            // Icons should have aria-hidden attribute
            const icons = container.querySelectorAll("svg");
            icons.forEach(icon => {
                expect(icon).toHaveAttribute("aria-hidden", "true");
            });
        });
    });

    describe("Layout and styling", () => {
        it("maintains consistent button structure", () => {
            const { container } = renderWithProvider();
            
            // Check that buttons have proper structure
            const buttons = container.querySelectorAll("button");
            expect(buttons).toHaveLength(2);
            
            // Each button should contain icon, text, and arrow
            buttons.forEach(button => {
                const icons = button.querySelectorAll("svg");
                expect(icons.length).toBeGreaterThanOrEqual(2); // Main icon + arrow icon
            });
        });

        it("displays title section correctly", () => {
            renderWithProvider();
            
            expect(screen.getByText("Quick Actions")).toBeInTheDocument();
        });
    });
});
