/**
 * Input area with file attachment and message field
 * Provides the main input interface for user messages and file uploads
 */

import React from "react";
import {
    makeStyles,
    tokens,
    shorthands,
    Button,
} from "@fluentui/react-components";
import {
    Send24Regular,
} from "@fluentui/react-icons";
import { AttachFileButton } from "./AttachFileButton";
import { MessageInputField } from "./MessageInputField";

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

export interface MessageInputAreaProps {
    /** Current message text */
    value: string;
    /** Called when message text changes */
    onChange: (value: string) => void;
    /** Called when send button is clicked */
    onSend: () => void;
    /** Called when files are attached */
    onFilesAttached: (files: File[]) => void;
    /** Whether the input is disabled */
    disabled?: boolean;
    /** Whether sending is in progress */
    isSending?: boolean;
    /** Placeholder text for the input field */
    placeholder?: string;
    /** List of attached files */
    attachedFiles?: File[];
    /** Called when a file is removed */
    onFileRemove?: (file: File) => void;
}

// =============================================================================
// COMPONENT STYLES
// =============================================================================

const useMessageInputAreaStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap(tokens.spacingVerticalXS),
        width: "100%",
        ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
        backgroundColor: tokens.colorNeutralBackground2,
        ...shorthands.borderTop(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke2),
    },
    inputContainer: {
        display: "flex",
        alignItems: "flex-end",
        ...shorthands.gap(tokens.spacingHorizontalXS),
        width: "100%",
        ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
        backgroundColor: tokens.colorNeutralBackground1,
        ...shorthands.borderRadius("20px"),
        ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke1),
        ":focus-within": {
            ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorBrandStroke2),
            boxShadow: `0 0 0 1px ${tokens.colorBrandStroke2}`,
        },
        ":hover": {
            ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke1Hover),
        },
    },
    attachButtonContainer: {
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
    },
    inputFieldContainer: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
    },
    sendButtonContainer: {
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
    },
    sendButton: {
        minWidth: "32px",
        minHeight: "32px",
        ...shorthands.borderRadius("16px"),
        backgroundColor: tokens.colorBrandBackground,
        ":hover": {
            backgroundColor: tokens.colorBrandBackgroundHover,
        },
        ":disabled": {
            backgroundColor: tokens.colorNeutralBackgroundDisabled,
        },
    },
    attachedFilesContainer: {
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        ...shorthands.gap(tokens.spacingHorizontalXS),
        ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
        backgroundColor: tokens.colorNeutralBackground1,
        ...shorthands.borderRadius("12px"),
        ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke2),
        marginBottom: tokens.spacingVerticalXS,
    },
    attachedFilesTitle: {
        fontSize: tokens.fontSizeBase100,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground3,
        marginRight: tokens.spacingHorizontalS,
        flexShrink: 0,
        alignSelf: "center",
    },
    attachedFilesList: {
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        ...shorthands.gap(tokens.spacingHorizontalXS),
        flex: 1,
    },
    attachedFileItem: {
        display: "flex",
        alignItems: "center",
        ...shorthands.gap(tokens.spacingHorizontalXS),
        ...shorthands.padding("4px", "8px"),
        backgroundColor: tokens.colorNeutralBackground3,
        ...shorthands.borderRadius("12px"),
        ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke2),
        maxWidth: "200px",
    },
    fileInfo: {
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap("1px"),
        flex: 1,
        minWidth: 0,
    },
    fileName: {
        fontSize: tokens.fontSizeBase100,
        fontWeight: tokens.fontWeightRegular,
        color: tokens.colorNeutralForeground1,
        ...shorthands.overflow("hidden"),
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        lineHeight: "1.2",
    },
    fileSize: {
        fontSize: "10px",
        color: tokens.colorNeutralForeground3,
        lineHeight: "1.1",
    },
    removeFileButton: {
        minWidth: "16px",
        minHeight: "16px",
        fontSize: "12px",
        ...shorthands.borderRadius("8px"),
        flexShrink: 0,
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

// =============================================================================
// COMPONENT
// =============================================================================

export const MessageInputArea: React.FC<MessageInputAreaProps> = ({
    value,
    onChange,
    onSend,
    onFilesAttached,
    disabled = false,
    isSending = false,
    placeholder = "Ask me about your support issue...",
    attachedFiles = [],
    onFileRemove,
}) => {
    const styles = useMessageInputAreaStyles();

    const handleSendClick = () => {
        if (value.trim() && !disabled && !isSending) {
            onSend();
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSendClick();
        }
    };

    const handleFileRemove = (file: File) => {
        if (onFileRemove) {
            onFileRemove(file);
        }
    };

    const canSend = value.trim().length > 0 && !disabled && !isSending;

    return (
        <div className={styles.root}>
            {/* Attached Files Display */}
            {attachedFiles.length > 0 && (
                <div className={styles.attachedFilesContainer}>
                    <div className={styles.attachedFilesTitle}>
                        {attachedFiles.length} file{attachedFiles.length !== 1 ? 's' : ''}:
                    </div>
                    <div className={styles.attachedFilesList}>
                        {attachedFiles.map((file, index) => (
                            <div key={`${file.name}-${index}`} className={styles.attachedFileItem}>
                                <div className={styles.fileInfo}>
                                    <div className={styles.fileName} title={file.name}>
                                        {file.name}
                                    </div>
                                    <div className={styles.fileSize}>
                                        {formatFileSize(file.size)}
                                    </div>
                                </div>
                                <Button
                                    appearance="subtle"
                                    size="small"
                                    className={styles.removeFileButton}
                                    onClick={() => handleFileRemove(file)}
                                    aria-label={`Remove ${file.name}`}
                                    title={`Remove ${file.name}`}
                                >
                                    ×
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Container */}
            <div className={styles.inputContainer}>
                {/* Attach File Button */}
                <div className={styles.attachButtonContainer}>
                    <AttachFileButton
                        onFilesSelected={onFilesAttached}
                        disabled={disabled}
                        multiple={true}
                        acceptedFileTypes=".txt,.log,.json,.csv,.xml,.eml,.msg"
                        iconOnly={true}
                        buttonText="Attach files"
                    />
                </div>

                {/* Message Input Field */}
                <div className={styles.inputFieldContainer}>
                    <MessageInputField
                        value={value}
                        onChange={onChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        multiline={true}
                        autoFocus={true}
                    />
                </div>

                {/* Send Button */}
                <div className={styles.sendButtonContainer}>
                    <Button
                        appearance="primary"
                        className={styles.sendButton}
                        onClick={handleSendClick}
                        disabled={!canSend}
                        aria-label="Send message"
                        title="Send message (Enter)"
                    >
                        <Send24Regular />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MessageInputArea;
