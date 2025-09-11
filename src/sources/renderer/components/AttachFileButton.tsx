/**
 * File attachment button with drag-and-drop support
 * Allows users to attach files to their support requests
 */

import React, { useRef, useState } from "react";
import { Button, makeStyles, tokens, shorthands } from "@fluentui/react-components";
import { Attach24Regular } from "@fluentui/react-icons";

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

export interface AttachFileButtonProps {
    /** Called when files are selected */
    onFilesSelected: (files: File[]) => void;
    /** Whether the button is disabled */
    disabled?: boolean;
    /** Whether to allow multiple file selection */
    multiple?: boolean;
    /** Accepted file types (e.g., ".txt,.log,.json") */
    acceptedFileTypes?: string;
    /** Maximum file size in bytes */
    maxFileSize?: number;
    /** Custom button text */
    buttonText?: string;
    /** Whether to show only icon (no text) */
    iconOnly?: boolean;
}

// =============================================================================
// COMPONENT STYLES
// =============================================================================

const useAttachFileButtonStyles = makeStyles({
    root: {
        position: "relative",
        display: "inline-block",
    },
    button: {
        minWidth: "40px",
        minHeight: "40px",
        ...shorthands.borderRadius(tokens.borderRadiusCircular),
        backgroundColor: tokens.colorNeutralBackground1,
        ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke1),
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground1Hover,
            ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke1Hover),
        },
        ":active": {
            backgroundColor: tokens.colorNeutralBackground1Pressed,
        },
        ":disabled": {
            backgroundColor: tokens.colorNeutralBackgroundDisabled,
            ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStrokeDisabled),
            color: tokens.colorNeutralForegroundDisabled,
        },
    },
    buttonWithText: {
        minWidth: "auto",
        ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
        ...shorthands.borderRadius(tokens.borderRadiusMedium),
    },
    hiddenInput: {
        position: "absolute",
        left: "-9999px",
        width: "1px",
        height: "1px",
        opacity: 0,
        pointerEvents: "none",
    },
    buttonContent: {
        display: "flex",
        alignItems: "center",
        ...shorthands.gap(tokens.spacingHorizontalXS),
    },
    icon: {
        fontSize: "20px",
        color: tokens.colorNeutralForeground2,
    },
    text: {
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightRegular,
        color: tokens.colorNeutralForeground1,
    },
    dragOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: tokens.colorBrandBackgroundSelected,
        ...shorthands.border(tokens.strokeWidthThick, "dashed", tokens.colorBrandStroke2),
        ...shorthands.borderRadius(tokens.borderRadiusMedium),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        pointerEvents: "none",
    },
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const validateFiles = (files: FileList, acceptedTypes?: string, maxSize?: number): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
        // Check file type
        if (acceptedTypes) {
            const types = acceptedTypes.split(",").map(t => t.trim().toLowerCase());
            const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
            const isValidType = types.some(type => type === fileExtension || (type.includes("/") && file.type === type));

            if (!isValidType) {
                errors.push(`${file.name}: Invalid file type. Accepted types: ${acceptedTypes}`);
                return;
            }
        }

        // Check file size
        if (maxSize && file.size > maxSize) {
            errors.push(`${file.name}: File too large. Maximum size: ${formatFileSize(maxSize)}`);
            return;
        }

        valid.push(file);
    });

    return { valid, errors };
};

// =============================================================================
// COMPONENT
// =============================================================================

export const AttachFileButton: React.FC<AttachFileButtonProps> = ({
    onFilesSelected,
    disabled = false,
    multiple = true,
    acceptedFileTypes = ".txt,.log,.json,.csv,.xml,.eml,.msg",
    maxFileSize = 10 * 1024 * 1024, // 10MB default
    buttonText = "Attach Files",
    iconOnly = false,
}) => {
    const styles = useAttachFileButtonStyles();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleButtonClick = () => {
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            const { valid, errors } = validateFiles(files, acceptedFileTypes, maxFileSize);

            if (errors.length > 0) {
                // In a real app, you'd show these errors to the user
                // For now, we'll silently ignore invalid files
            }

            if (valid.length > 0) {
                onFilesSelected(valid);
            }
        }

        // Reset the input value to allow selecting the same file again
        if (event.target) {
            event.target.value = "";
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (!disabled) {
            setIsDragOver(true);
        }
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);

        if (disabled) return;

        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            const { valid, errors } = validateFiles(files, acceptedFileTypes, maxFileSize);

            if (errors.length > 0) {
                // In a real app, you'd show these errors to the user
                // For now, we'll silently ignore invalid files
            }

            if (valid.length > 0) {
                onFilesSelected(valid);
            }
        }
    };

    const buttonClassName = iconOnly ? styles.button : `${styles.button} ${styles.buttonWithText}`;

    return (
        <div className={styles.root} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
            <Button
                appearance='subtle'
                className={buttonClassName}
                onClick={handleButtonClick}
                disabled={disabled}
                aria-label={iconOnly ? buttonText : undefined}
                title={iconOnly ? buttonText : `${buttonText} (${acceptedFileTypes})`}
            >
                <div className={styles.buttonContent}>
                    <Attach24Regular className={styles.icon} />
                    {!iconOnly && <span className={styles.text}>{buttonText}</span>}
                </div>
            </Button>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type='file'
                className={styles.hiddenInput}
                onChange={handleFileChange}
                multiple={multiple}
                accept={acceptedFileTypes}
                disabled={disabled}
                aria-hidden='true'
                tabIndex={-1}
            />

            {/* Drag overlay */}
            {isDragOver && <div className={styles.dragOverlay}>Drop files here</div>}
        </div>
    );
};

export default AttachFileButton;
