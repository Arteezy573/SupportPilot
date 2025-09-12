/**
 * Unit tests for MessageInputArea component
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { MessageInputArea } from "../../../sources/renderer/components/MessageInputArea";

// Test wrapper with FluentProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;

// Mock child components
jest.mock("../../../sources/renderer/components/AttachFileButton", () => ({
    AttachFileButton: ({ onFilesSelected, disabled }: any) => (
        <button data-testid='attach-file-button' onClick={() => onFilesSelected([new File(["test"], "test.txt", { type: "text/plain" })])} disabled={disabled}>
            Attach Files
        </button>
    ),
}));

jest.mock("../../../sources/renderer/components/MessageInputField", () => ({
    MessageInputField: ({ value, onChange, onKeyDown, disabled, placeholder }: any) => (
        <textarea
            data-testid='message-input-field'
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder={placeholder}
        />
    ),
}));

// Mock file for testing
const createMockFile = (name: string, size = 1024): File => {
    const file = new File(["mock content"], name, { type: "text/plain" });
    Object.defineProperty(file, "size", {
        value: size,
        writable: false,
    });
    return file;
};

describe("MessageInputArea", () => {
    const mockOnChange = jest.fn();
    const mockOnSend = jest.fn();
    const mockOnFilesAttached = jest.fn();
    const mockOnFileRemove = jest.fn();

    beforeEach(() => {
        mockOnChange.mockClear();
        mockOnSend.mockClear();
        mockOnFilesAttached.mockClear();
        mockOnFileRemove.mockClear();
    });

    describe("Rendering", () => {
        it("renders with default props", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} />
                </TestWrapper>
            );

            expect(screen.getByTestId("attach-file-button")).toBeInTheDocument();
            expect(screen.getByTestId("message-input-field")).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
        });

        it("renders with custom placeholder", () => {
            render(
                <TestWrapper>
                    <MessageInputArea
                        value=''
                        onChange={mockOnChange}
                        onSend={mockOnSend}
                        onFilesAttached={mockOnFilesAttached}
                        placeholder='Custom placeholder'
                    />
                </TestWrapper>
            );

            const textField = screen.getByTestId("message-input-field");
            expect(textField).toHaveAttribute("placeholder", "Custom placeholder");
        });

        it("renders send button as disabled when no text", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} />
                </TestWrapper>
            );

            const sendButton = screen.getByRole("button", { name: /send/i });
            expect(sendButton).toBeDisabled();
        });

        it("renders send button as enabled when text is present", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='Hello world' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} />
                </TestWrapper>
            );

            const sendButton = screen.getByRole("button", { name: /send/i });
            expect(sendButton).not.toBeDisabled();
        });

        it("renders all components as disabled when disabled prop is true", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='Test message' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} disabled={true} />
                </TestWrapper>
            );

            expect(screen.getByTestId("attach-file-button")).toBeDisabled();
            expect(screen.getByTestId("message-input-field")).toBeDisabled();
            expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
        });
    });

    describe("Message Input", () => {
        it("calls onChange when text input changes", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} />
                </TestWrapper>
            );

            const textField = screen.getByTestId("message-input-field");
            fireEvent.change(textField, { target: { value: "Hello world" } });

            expect(mockOnChange).toHaveBeenCalledWith("Hello world");
        });

        it("calls onSend when send button is clicked with valid text", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='Hello world' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} />
                </TestWrapper>
            );

            const sendButton = screen.getByRole("button", { name: /send/i });
            fireEvent.click(sendButton);

            expect(mockOnSend).toHaveBeenCalled();
        });

        it("does not call onSend when send button is clicked with empty text", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} />
                </TestWrapper>
            );

            const sendButton = screen.getByRole("button", { name: /send/i });
            fireEvent.click(sendButton);

            expect(mockOnSend).not.toHaveBeenCalled();
        });

        it("calls onSend when Enter key is pressed", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='Hello world' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} />
                </TestWrapper>
            );

            const textField = screen.getByTestId("message-input-field");
            fireEvent.keyDown(textField, { key: "Enter", shiftKey: false });

            expect(mockOnSend).toHaveBeenCalled();
        });

        it("does not call onSend when Shift+Enter is pressed", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='Hello world' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} />
                </TestWrapper>
            );

            const textField = screen.getByTestId("message-input-field");
            fireEvent.keyDown(textField, { key: "Enter", shiftKey: true });

            expect(mockOnSend).not.toHaveBeenCalled();
        });
    });

    describe("File Attachment", () => {
        it("calls onFilesAttached when files are selected", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} />
                </TestWrapper>
            );

            const attachButton = screen.getByTestId("attach-file-button");
            fireEvent.click(attachButton);

            expect(mockOnFilesAttached).toHaveBeenCalledWith([expect.objectContaining({ name: "test.txt" })]);
        });



        it("calls onFileRemove when remove button is clicked", () => {
            const mockFile = createMockFile("test.txt", 1024);

            render(
                <TestWrapper>
                    <MessageInputArea
                        value=''
                        onChange={mockOnChange}
                        onSend={mockOnSend}
                        onFilesAttached={mockOnFilesAttached}
                        attachedFiles={[mockFile]}
                        onFileRemove={mockOnFileRemove}
                    />
                </TestWrapper>
            );

            const removeButton = screen.getByRole("button", { name: /remove test\.txt/i });
            fireEvent.click(removeButton);

            expect(mockOnFileRemove).toHaveBeenCalledWith(mockFile);
        });

        it("does not display attached files section when no files", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} attachedFiles={[]} />
                </TestWrapper>
            );

            expect(screen.queryByText(/attached files/i)).not.toBeInTheDocument();
        });
    });

    describe("Loading States", () => {
        it("disables send button when isSending is true", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='Hello world' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} isSending={true} />
                </TestWrapper>
            );

            const sendButton = screen.getByRole("button", { name: /send/i });
            expect(sendButton).toBeDisabled();
        });

        it("does not call onSend when isSending is true", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='Hello world' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} isSending={true} />
                </TestWrapper>
            );

            const sendButton = screen.getByRole("button", { name: /send/i });
            fireEvent.click(sendButton);

            expect(mockOnSend).not.toHaveBeenCalled();
        });
    });

    describe("Accessibility", () => {
        it("has proper ARIA labels on send button", () => {
            render(
                <TestWrapper>
                    <MessageInputArea value='Test message' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} />
                </TestWrapper>
            );

            const sendButton = screen.getByRole("button", { name: /send/i });
            expect(sendButton).toHaveAttribute("aria-label", "Send message");
            expect(sendButton).toHaveAttribute("title", "Send message (Enter)");
        });

        it("has proper ARIA labels on file remove buttons", () => {
            const mockFile = createMockFile("important.txt", 1024);

            render(
                <TestWrapper>
                    <MessageInputArea
                        value=''
                        onChange={mockOnChange}
                        onSend={mockOnSend}
                        onFilesAttached={mockOnFilesAttached}
                        attachedFiles={[mockFile]}
                        onFileRemove={mockOnFileRemove}
                    />
                </TestWrapper>
            );

            const removeButton = screen.getByRole("button", { name: /remove important\.txt/i });
            expect(removeButton).toHaveAttribute("aria-label", "Remove important.txt");
            expect(removeButton).toHaveAttribute("title", "Remove important.txt");
        });
    });

    describe("File Size Formatting", () => {
        it("formats file sizes correctly", () => {
            const files = [
                createMockFile("small.txt", 512), // 512 Bytes
                createMockFile("medium.txt", 1536), // 1.5 KB
                createMockFile("large.txt", 2097152), // 2 MB
            ];

            render(
                <TestWrapper>
                    <MessageInputArea value='' onChange={mockOnChange} onSend={mockOnSend} onFilesAttached={mockOnFilesAttached} attachedFiles={files} />
                </TestWrapper>
            );

            expect(screen.getByText("512 Bytes")).toBeInTheDocument();
            expect(screen.getByText("1.5 KB")).toBeInTheDocument();
            expect(screen.getByText("2 MB")).toBeInTheDocument();
        });
    });
});
