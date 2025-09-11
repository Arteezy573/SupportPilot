/**
 * Main agent message container with ReAct pattern support
 * Displays agent responses with expandable sections for thoughts, actions, and results
 */

import React from "react";
import { makeStyles, tokens, shorthands, Button } from "@fluentui/react-components";
import { Bot24Regular } from "@fluentui/react-icons";
import { AgentMessage, AgentAction, AgentThought } from "../../types/chat";

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

interface AgentMessageCardProps {
    message: AgentMessage;
    isStreaming?: boolean;
    onRetry?: () => void;
    onExpand?: (messageId: string, section: string) => void;
}

// =============================================================================
// COMPONENT STYLES
// =============================================================================

const useAgentMessageCardStyles = makeStyles({
    content: {
        padding: "12px 16px",
        borderRadius: "8px",
        maxWidth: "80%",
        paddingTop: tokens.spacingVerticalS,
        boxShadow: tokens.shadow4,
    },
    copilotIcon: {
        fontSize: "12px",
        color: tokens.colorNeutralForeground2,
    },
    mainResponse: {
        marginBottom: tokens.spacingVerticalM,
        lineHeight: tokens.lineHeightBase400,
    },
    expandableSections: {
        marginTop: tokens.spacingVerticalM,
    },
    section: {
        marginBottom: tokens.spacingVerticalS,
    },
    sectionHeader: {
        display: "flex",
        alignItems: "center",
        ...shorthands.gap(tokens.spacingHorizontalS),
        cursor: "pointer",
        paddingVertical: tokens.spacingVerticalXS,
        paddingHorizontal: tokens.spacingHorizontalS,
        ...shorthands.borderRadius(tokens.borderRadiusSmall),
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
    },
    sectionContent: {
        paddingTop: tokens.spacingVerticalS,
        paddingLeft: tokens.spacingHorizontalXL,
    },
    timestamp: {
        color: tokens.colorNeutralForeground3,
        fontSize: "11px",
    },
    retryButton: {
        marginTop: tokens.spacingVerticalS,
    },
    // New styles for inline steps
    stepsContainer: {
        marginTop: tokens.spacingVerticalM,
        marginBottom: tokens.spacingVerticalL,
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap(tokens.spacingVerticalXS),
    },
    thoughtStep: {
        fontSize: "12px",
        color: tokens.colorNeutralForeground3,
        lineHeight: "1.4",
        ...shorthands.padding(tokens.spacingVerticalXXS, 0),
    },
    actionStep: {
        fontSize: "12px",
        borderRadius: "4px",
        color: tokens.colorNeutralForeground2,
        lineHeight: "1.4",
        width: "fit-content",
        backgroundColor: tokens.colorNeutralBackground2,
        ...shorthands.padding(tokens.spacingVerticalXXS, tokens.spacingHorizontalXS),
        ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke2),
    },
    // New styles for prominent content
    mainContent: {
        fontSize: "12px",
    },
    citationsContainer: {
        marginTop: tokens.spacingVerticalM,
        ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalS),
        backgroundColor: tokens.colorNeutralBackground2,
        ...shorthands.borderRadius(tokens.borderRadiusSmall),
        ...shorthands.border(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke2),
    },
    citationItem: {
        marginBottom: tokens.spacingVerticalXS,
        fontSize: "11px",
        color: tokens.colorNeutralForeground3,
    },
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const AgentMessageCard: React.FC<AgentMessageCardProps> = ({ message, isStreaming: _isStreaming = false, onRetry }) => {
    const styles = useAgentMessageCardStyles();

    // Get steps in order - preserving the ReAct pattern sequence
    const steps = message.steps || [];

    // Helper functions to identify step types
    const isThought = (step: AgentThought | AgentAction): step is AgentThought => {
        return "content" in step && !("type" in step);
    };

    const isAction = (step: AgentThought | AgentAction): step is AgentAction => {
        return "type" in step && "status" in step;
    };

    return (
        <div className={styles.content}>
            {/* Copilot Header */}
            <Bot24Regular className={styles.copilotIcon} />

            {/* Inline steps - thoughts and actions as simple spans */}
            {steps.length > 0 && (
                <div className={styles.stepsContainer}>
                    {steps.map((step, index) => {
                        if (isThought(step)) {
                            return (
                                <span key={step.id || `thought-${index}`} className={styles.thoughtStep}>
                                    {step.content}
                                </span>
                            );
                        } else if (isAction(step)) {
                            return (
                                <span key={step.id || `action-${index}`} className={styles.actionStep}>
                                    🔧 {step.type}
                                    {/* TODO expandable action details */}
                                </span>
                            );
                        }
                        return null;
                    })}
                </div>
            )}

            {/* Main content - prominent and salient */}
            <div className={styles.mainContent}>{message.content}</div>

            {/* Citations section */}
            {message.citations && message.citations.length > 0 && <div className={styles.citationsContainer}>{/* TODO expand citations */}</div>}

            {/* Retry button for failed messages */}
            {message.status === "failed" && onRetry && (
                <Button className={styles.retryButton} appearance='outline' onClick={onRetry}>
                    Retry Analysis
                </Button>
            )}
        </div>
    );
};

export default AgentMessageCard;
