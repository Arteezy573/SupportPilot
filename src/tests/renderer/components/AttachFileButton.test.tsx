/**
 * Unit tests for AttachFileButton component
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { AttachFileButton } from "../../../sources/renderer/components/AttachFileButton";

// Test wrapper with FluentProvider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => <FluentProvider theme={webLightTheme}>{children}</FluentProvider>;

// Mock file for testing
const createMockFile = (name: string, size: number, type: string): File => {
    const file = new File(["mock content"], name, { type });
    Object.defineProperty(file, "size", {
        value: size,
        writable: false,
    });
    return file;
};

describe("AttachFileButton", () => {
    const mockOnFilesSelected = jest.fn();

    beforeEach(() => {
        mockOnFilesSelected.mockClear();
    });

    describe("Rendering", () => {
        it("renders with default props", () => {
            render(
                <TestWrapper>
                    <AttachFileButton onFilesSelected={mockOnFilesSelected} />
                </TestWrapper>
            );

            const button = screen.getByRole("button");
            expect(button).toBeInTheDocument();
        });

        it("renders icon-only button when iconOnly is true", () => {
            render(
                <TestWrapper>
                    <AttachFileButton onFilesSelected={mockOnFilesSelected} iconOnly={true} buttonText='Custom Text' />
                </TestWrapper>
            );

            const button = screen.getByRole("button");
            expect(button).toHaveAttribute("aria-label", "Custom Text");
            expect(screen.queryByText("Custom Text")).not.toBeInTheDocument();
        });

        it("renders with custom button text", () => {
            render(
                <TestWrapper>
                    <AttachFileButton onFilesSelected={mockOnFilesSelected} buttonText='Upload Files' />
                </TestWrapper>
            );

            expect(screen.getByText("Upload Files")).toBeInTheDocument();
        });

        it("renders disabled button when disabled prop is true", () => {
            render(
                <TestWrapper>
                    <AttachFileButton onFilesSelected={mockOnFilesSelected} disabled={true} />
                </TestWrapper>
            );

            const button = screen.getByRole("button");
            expect(button).toBeDisabled();
        });
    });

    describe("File Selection", () => {
        it("opens file dialog when button is clicked", () => {
            const { container } = render(
                <TestWrapper>
                    <AttachFileButton onFilesSelected={mockOnFilesSelected} />
                </TestWrapper>
            );

            const button = screen.getByRole("button");
            const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

            // Mock the click method
            const clickSpy = jest.spyOn(fileInput, "click").mockImplementation(() => {});

            fireEvent.click(button);
            expect(clickSpy).toHaveBeenCalled();

            clickSpy.mockRestore();
        });

        it("calls onFilesSelected when files are selected", async () => {
            const { container } = render(
                <TestWrapper>
                    <AttachFileButton onFilesSelected={mockOnFilesSelected} />
                </TestWrapper>
            );

            const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
            const mockFile = createMockFile("test.txt", 1024, "text/plain");

            // Mock the FileList
            Object.defineProperty(fileInput, "files", {
                value: [mockFile],
                writable: false,
            });

            fireEvent.change(fileInput);

            await waitFor(() => {
                expect(mockOnFilesSelected).toHaveBeenCalledWith([mockFile]);
            });
        });

        it("filters files by accepted types", async () => {
            const { container } = render(
                <TestWrapper>
                    <AttachFileButton onFilesSelected={mockOnFilesSelected} acceptedFileTypes='.txt,.log' />
                </TestWrapper>
            );

            const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
            const validFile = createMockFile("test.txt", 1024, "text/plain");
            const invalidFile = createMockFile("test.jpg", 1024, "image/jpeg");

            Object.defineProperty(fileInput, "files", {
                value: [validFile, invalidFile],
                writable: false,
            });

            fireEvent.change(fileInput);

            await waitFor(() => {
                expect(mockOnFilesSelected).toHaveBeenCalledWith([validFile]);
            });
        });

        it("filters files by size limit", async () => {
            const { container } = render(
                <TestWrapper>
                    <AttachFileButton onFilesSelected={mockOnFilesSelected} maxFileSize={1024} />
                </TestWrapper>
            );

            const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
            const validFile = createMockFile("small.txt", 512, "text/plain");
            const invalidFile = createMockFile("large.txt", 2048, "text/plain");

            Object.defineProperty(fileInput, "files", {
                value: [validFile, invalidFile],
                writable: false,
            });

            fireEvent.change(fileInput);

            await waitFor(() => {
                expect(mockOnFilesSelected).toHaveBeenCalledWith([validFile]);
            });
        });
    });

    describe("Accessibility", () => {
        it("file input has proper accessibility attributes", () => {
            const { container } = render(
                <TestWrapper>
                    <AttachFileButton onFilesSelected={mockOnFilesSelected} />
                </TestWrapper>
            );

            const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
            expect(fileInput).toHaveAttribute("aria-hidden", "true");
            expect(fileInput).toHaveAttribute("tabindex", "-1");
        });
    });

    describe("Multiple Files", () => {
        it("allows multiple file selection when multiple is true", () => {
            const { container } = render(
                <TestWrapper>
                    <AttachFileButton onFilesSelected={mockOnFilesSelected} multiple={true} />
                </TestWrapper>
            );

            const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
            expect(fileInput).toHaveAttribute("multiple");
        });

        it("does not allow multiple file selection when multiple is false", () => {
            const { container } = render(
                <TestWrapper>
                    <AttachFileButton onFilesSelected={mockOnFilesSelected} multiple={false} />
                </TestWrapper>
            );

            const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
            expect(fileInput).not.toHaveAttribute("multiple");
        });
    });
});
