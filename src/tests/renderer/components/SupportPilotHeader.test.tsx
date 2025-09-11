/**
 * Unit tests for SupportPilotHeader component
 * Tests header functionality, branding, and button interactions
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import "@testing-library/jest-dom";

import { SupportPilotHeader, SupportPilotHeaderProps } from "../../../sources/renderer/components/SupportPilotHeader";

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Renders SupportPilotHeader with FluentProvider wrapper
 */
const renderWithProvider = (props: Partial<SupportPilotHeaderProps> = {}) => {
    const defaultProps: SupportPilotHeaderProps = {
        showHistoryButton: true,
        showSettingsButton: true,
        onHistoryClick: jest.fn(),
        onSettingsClick: jest.fn(),
        subtitle: "AI-powered support ticket assistant",
        ...props,
    };

    return render(
        <FluentProvider theme={webLightTheme}>
            <SupportPilotHeader {...defaultProps} />
        </FluentProvider>
    );
};

// =============================================================================
// TESTS
// =============================================================================

describe("SupportPilotHeader", () => {
    describe("Rendering", () => {
        it("renders the component with default props", () => {
            renderWithProvider();

            expect(screen.getByText("Support Pilot")).toBeInTheDocument();
            expect(screen.getByText("AI-powered support ticket assistant")).toBeInTheDocument();
            expect(screen.getByText("SP")).toBeInTheDocument(); // Logo
        });

        it("renders custom subtitle when provided", () => {
            const customSubtitle = "Custom subtitle text";
            renderWithProvider({ subtitle: customSubtitle });

            expect(screen.getByText(customSubtitle)).toBeInTheDocument();
        });

        it("renders both action buttons by default", () => {
            renderWithProvider();

            expect(screen.getByLabelText("Open chat history")).toBeInTheDocument();
            expect(screen.getByLabelText("Open settings")).toBeInTheDocument();
        });

        it("hides history button when showHistoryButton is false", () => {
            renderWithProvider({ showHistoryButton: false });

            expect(screen.queryByLabelText("Open chat history")).not.toBeInTheDocument();
            expect(screen.getByLabelText("Open settings")).toBeInTheDocument();
        });

        it("hides settings button when showSettingsButton is false", () => {
            renderWithProvider({ showSettingsButton: false });

            expect(screen.getByLabelText("Open chat history")).toBeInTheDocument();
            expect(screen.queryByLabelText("Open settings")).not.toBeInTheDocument();
        });

        it("hides both buttons when both are set to false", () => {
            renderWithProvider({
                showHistoryButton: false,
                showSettingsButton: false,
            });

            expect(screen.queryByLabelText("Open chat history")).not.toBeInTheDocument();
            expect(screen.queryByLabelText("Open settings")).not.toBeInTheDocument();
        });
    });

    describe("Interactions", () => {
        it("calls onHistoryClick when history button is clicked", () => {
            const onHistoryClick = jest.fn();
            renderWithProvider({ onHistoryClick });

            const historyButton = screen.getByLabelText("Open chat history");
            fireEvent.click(historyButton);

            expect(onHistoryClick).toHaveBeenCalledTimes(1);
        });

        it("calls onSettingsClick when settings button is clicked", () => {
            const onSettingsClick = jest.fn();
            renderWithProvider({ onSettingsClick });

            const settingsButton = screen.getByLabelText("Open settings");
            fireEvent.click(settingsButton);

            expect(onSettingsClick).toHaveBeenCalledTimes(1);
        });

        it("does not crash when callbacks are not provided", () => {
            renderWithProvider({
                onHistoryClick: undefined,
                onSettingsClick: undefined,
            });

            const historyButton = screen.getByLabelText("Open chat history");
            const settingsButton = screen.getByLabelText("Open settings");

            expect(() => {
                fireEvent.click(historyButton);
                fireEvent.click(settingsButton);
            }).not.toThrow();
        });
    });

    describe("Accessibility", () => {
        it("has proper ARIA labels for buttons", () => {
            renderWithProvider();

            const historyButton = screen.getByLabelText("Open chat history");
            const settingsButton = screen.getByLabelText("Open settings");

            expect(historyButton).toHaveAttribute("aria-label", "Open chat history");
            expect(settingsButton).toHaveAttribute("aria-label", "Open settings");
        });

        it("has proper title attributes for tooltips", () => {
            renderWithProvider();

            const historyButton = screen.getByLabelText("Open chat history");
            const settingsButton = screen.getByLabelText("Open settings");

            expect(historyButton).toHaveAttribute("title", "Chat History");
            expect(settingsButton).toHaveAttribute("title", "Settings");
        });

        it("uses semantic header element", () => {
            const { container } = renderWithProvider();

            const header = container.querySelector("header");
            expect(header).toBeInTheDocument();
        });
    });
});
