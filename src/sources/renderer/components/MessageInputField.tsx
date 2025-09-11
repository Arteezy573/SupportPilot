/**
 * Text input field for user queries and commands
 * Provides a multiline text input with proper keyboard handling
 */

import React from "react";
import {
    Textarea,
    makeStyles,
    tokens,
    shorthands,
} from "@fluentui/react-components";

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

export interface MessageInputFieldProps {
    /** Current input value */
    value: string;
    /** Called when the input value changes */
    onChange: (value: string) => void;
    /** Called when a key is pressed */
    onKeyDown?: (event: React.KeyboardEvent) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Whether the input is disabled */
    disabled?: boolean;
    /** Whether to allow multiple lines */
    multiline?: boolean;
    /** Whether to auto-focus the input */
    autoFocus?: boolean;
    /** Maximum length of the input */
    maxLength?: number;
    /** Minimum number of rows for multiline input */
    minRows?: number;
    /** Maximum number of rows for multiline input */
    maxRows?: number;
    /** Custom CSS class name */
    className?: string;
}

// =============================================================================
// COMPONENT STYLES
// =============================================================================

const useMessageInputFieldStyles = makeStyles({
    root: {
        width: "100%",
        minWidth: 0, // Allow the component to shrink
    },
    textarea: {
        width: "100%",
        minHeight: "40px",
        fontSize: tokens.fontSizeBase300,
        fontFamily: tokens.fontFamilyBase,
        lineHeight: tokens.lineHeightBase300,
        backgroundColor: "transparent",
        ...shorthands.border("none"),
        ...shorthands.borderRadius("0"),
        ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
        resize: "none",
        ":focus": {
            outline: "none",
            backgroundColor: "transparent",
        },
        "::placeholder": {
            color: tokens.colorNeutralForeground3,
            fontSize: tokens.fontSizeBase300,
        },
    },
    singleLine: {
        ...shorthands.overflow("hidden"),
        whiteSpace: "nowrap",
    },
    multiLine: {
        ...shorthands.overflow("hidden"),
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
    },
    disabled: {
        backgroundColor: tokens.colorNeutralBackgroundDisabled,
        color: tokens.colorNeutralForegroundDisabled,
        cursor: "not-allowed",
        "::placeholder": {
            color: tokens.colorNeutralForegroundDisabled,
        },
    },
});

// =============================================================================
// COMPONENT
// =============================================================================

export const MessageInputField: React.FC<MessageInputFieldProps> = ({
    value,
    onChange,
    onKeyDown,
    placeholder = "Type your message...",
    disabled = false,
    multiline = true,
    autoFocus = false,
    maxLength = 4000,
    minRows = 1,
    maxRows = 6,
    className,
}) => {
    const styles = useMessageInputFieldStyles();

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = event.target.value;
        
        // Enforce max length
        if (maxLength && newValue.length > maxLength) {
            return;
        }
        
        onChange(newValue);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Handle single-line mode
        if (!multiline && event.key === "Enter") {
            event.preventDefault();
        }
        
        // Call parent handler
        if (onKeyDown) {
            onKeyDown(event);
        }
    };

    // Calculate dynamic rows based on content
    const calculateRows = (): number => {
        if (!multiline) return 1;
        
        const lineCount = value.split("\n").length;
        const contentRows = Math.max(minRows || 1, lineCount);
        
        if (maxRows && contentRows > maxRows) {
            return maxRows;
        }
        
        return contentRows;
    };

    const textareaClassName = [
        styles.textarea,
        multiline ? styles.multiLine : styles.singleLine,
        disabled ? styles.disabled : "",
        className,
    ].filter(Boolean).join(" ");

    return (
        <div className={styles.root}>
            <Textarea
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                rows={calculateRows()}
                className={textareaClassName}
                resize="none"
                appearance="filled-lighter"
                aria-label="Message input"
                aria-multiline={multiline}
                spellCheck={true}
                autoComplete="off"
                autoCorrect="on"
                autoCapitalize="sentences"
                maxLength={maxLength}
            />
        </div>
    );
};

export default MessageInputField;
