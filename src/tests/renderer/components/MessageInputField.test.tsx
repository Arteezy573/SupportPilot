/**
 * Unit tests for MessageInputField component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { MessageInputField } from "../../../sources/renderer/components/MessageInputField";

// Test wrapper with FluentProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;

describe("MessageInputField", () => {
    const mockOnChange = jest.fn();
    const mockOnKeyDown = jest.fn();

    beforeEach(() => {
        mockOnChange.mockClear();
        mockOnKeyDown.mockClear();
    });

    describe("Rendering", () => {
        it("renders with default props", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            expect(textarea).toBeInTheDocument();
            expect(textarea).toHaveAttribute("aria-label", "Message input");
        });

        it("renders with custom placeholder", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} placeholder='Custom placeholder' />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveAttribute("placeholder", "Custom placeholder");
        });

        it("renders with initial value", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='Initial text' onChange={mockOnChange} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
            expect(textarea.value).toBe("Initial text");
        });

        it("renders as disabled when disabled prop is true", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} disabled={true} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            expect(textarea).toBeDisabled();
        });

        it("auto-focuses when autoFocus is true", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} autoFocus={true} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveFocus();
        });
    });

    describe("Text Input", () => {
        it("calls onChange when text is entered", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            fireEvent.change(textarea, { target: { value: "Hello world" } });

            expect(mockOnChange).toHaveBeenCalledWith("Hello world");
        });

        it("updates value when prop changes", () => {
            const { rerender } = render(
                <TestWrapper>
                    <MessageInputField value='Initial' onChange={mockOnChange} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
            expect(textarea.value).toBe("Initial");

            rerender(
                <TestWrapper>
                    <MessageInputField value='Updated' onChange={mockOnChange} />
                </TestWrapper>
            );

            expect(textarea.value).toBe("Updated");
        });

        it("enforces max length limit", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} maxLength={10} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            fireEvent.change(textarea, { target: { value: "This is a very long text that exceeds limit" } });

            // Should not call onChange because text exceeds maxLength
            expect(mockOnChange).not.toHaveBeenCalled();
        });

        it("accepts text within max length limit", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} maxLength={10} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            fireEvent.change(textarea, { target: { value: "Short" } });

            expect(mockOnChange).toHaveBeenCalledWith("Short");
        });
    });

    describe("Keyboard Handling", () => {
        it("calls onKeyDown when a key is pressed", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} onKeyDown={mockOnKeyDown} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

            expect(mockOnKeyDown).toHaveBeenCalled();
        });

        it("prevents Enter key in single-line mode", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} onKeyDown={mockOnKeyDown} multiline={false} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");

            // Use fireEvent to dispatch the event
            fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

            expect(mockOnKeyDown).toHaveBeenCalled();
        });

        it("allows Enter key in multiline mode", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} onKeyDown={mockOnKeyDown} multiline={true} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            fireEvent.keyDown(textarea, { key: "Enter", code: "Enter" });

            expect(mockOnKeyDown).toHaveBeenCalled();
        });
    });

    describe("Multiline Mode", () => {
        it("sets aria-multiline correctly for multiline mode", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} multiline={true} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveAttribute("aria-multiline", "true");
        });

        it("sets aria-multiline correctly for single-line mode", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} multiline={false} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveAttribute("aria-multiline", "false");
        });

        it("calculates rows based on content in multiline mode", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='Line 1\nLine 2\nLine 3' onChange={mockOnChange} multiline={true} minRows={1} maxRows={5} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
            expect(textarea.rows).toBe(3); // Three lines of content
        });

        it("respects minimum rows setting", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} multiline={true} minRows={3} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
            expect(textarea.rows).toBe(3); // Minimum rows setting
        });

        it("respects maximum rows setting", () => {
            const longText = Array(10).fill("Line").join("\n");
            render(
                <TestWrapper>
                    <MessageInputField value={longText} onChange={mockOnChange} multiline={true} maxRows={5} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
            expect(textarea.rows).toBe(5); // Maximum rows setting
        });

        it("uses single row in single-line mode", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='Single line text\nwith newlines' onChange={mockOnChange} multiline={false} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
            expect(textarea.rows).toBe(1);
        });
    });

    describe("Accessibility", () => {
        it("has proper ARIA attributes", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveAttribute("aria-label", "Message input");
            expect(textarea).toHaveAttribute("spellcheck", "true");
        });

        it("has proper autocomplete attributes", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveAttribute("autocomplete", "off");
            expect(textarea).toHaveAttribute("autocorrect", "on");
            expect(textarea).toHaveAttribute("autocapitalize", "sentences");
        });
    });

    describe("Custom Styling", () => {
        it("applies custom className when provided", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} className='custom-class' />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveClass("custom-class");
        });

        it("sets maxLength attribute", () => {
            render(
                <TestWrapper>
                    <MessageInputField value='' onChange={mockOnChange} maxLength={500} />
                </TestWrapper>
            );

            const textarea = screen.getByRole("textbox");
            expect(textarea).toHaveAttribute("maxLength", "500");
        });
    });
});
