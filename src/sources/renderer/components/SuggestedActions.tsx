/**
 * Container for suggested action buttons (Summarize, Create ICM)
 * Provides quick access to common Support Pilot workflows
 */

import React from "react";
import { makeStyles, tokens, shorthands } from "@fluentui/react-components";

// =============================================================================
// COMPONENT STYLES
// =============================================================================

const useSuggestedActionsStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...shorthands.gap(tokens.spacingVerticalXL),
        maxWidth: "600px",
        margin: "0 auto",
        marginTop: "100px",
    },
    actionsContainer: {
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        ...shorthands.gap(tokens.spacingHorizontalL),
        width: "100%",
        alignItems: "flex-start",
        justifyContent: "flex-start",
    },
    // Specialized styles for each action
    actionButtonSpan: {
        padding: "5px",
        borderRadius: "4px",
        cursor: "pointer",
        backgroundColor: tokens.colorNeutralBackground1,
        ...shorthands.border(tokens.strokeWidthThin, "dashed", tokens.colorNeutralStroke1),
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground1Hover,
            ...shorthands.border(tokens.strokeWidthThin, "dashed", tokens.colorNeutralStroke1Hover),
            boxShadow: tokens.shadow8,
        },
        ":active": {
            backgroundColor: tokens.colorNeutralBackground1Pressed,
        },
    },
});

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

/**
 * Props for the SuggestedActions component
 */
export interface SuggestedActionsProps {
    /** Whether to show the summarize issue button */
    showSummarizeButton?: boolean;
    /** Whether to show the create ICM button */
    showCreateIcmButton?: boolean;
    /** Callback when summarize issue button is clicked */
    onSummarizeClick?: () => void;
    /** Callback when create ICM button is clicked */
    onCreateIcmClick?: () => void;
    /** Whether the buttons are disabled */
    disabled?: boolean;
    /** Loading state for summarize action */
    summarizeLoading?: boolean;
    /** Loading state for create ICM action */
    createIcmLoading?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * SuggestedActions component that displays quick action buttons
 * for common Support Pilot workflows like summarizing issues and creating ICM tickets
 */
export const SuggestedActions: React.FC<SuggestedActionsProps> = ({
    showSummarizeButton = true,
    showCreateIcmButton = true,
    onSummarizeClick,
    onCreateIcmClick,
    summarizeLoading = false,
    createIcmLoading = false,
}) => {
    const styles = useSuggestedActionsStyles();

    return (
        <div className={styles.root}>
            <div className={styles.actionsContainer}>
                {/* Summarize Issue Button */}
                {showSummarizeButton && (
                    <span className={styles.actionButtonSpan} onClick={onSummarizeClick}>
                        {summarizeLoading ? "Analyzing..." : "Summarize the customer issue and suggest the next step."}
                    </span>
                )}

                {/* Create ICM Button */}
                {showCreateIcmButton && (
                    <span className={styles.actionButtonSpan} onClick={onCreateIcmClick}>
                        {createIcmLoading ? "Creating..." : "Use the info from attachments to create an ICM for the Operations team"}
                    </span>
                )}
            </div>
        </div>
    );
};

export default SuggestedActions;
