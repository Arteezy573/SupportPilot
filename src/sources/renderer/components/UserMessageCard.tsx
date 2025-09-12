/**
 * UserMessageCard component for displaying user messages in the chat
 * Renders user message content with attachment indicators
 */

import React from "react";
import { makeStyles, tokens, shorthands, Text, mergeClasses } from "@fluentui/react-components";
import { Attach12Filled } from "@fluentui/react-icons";
import type { UserMessage } from "../../types/chat";

// =============================================================================
// COMPONENT STYLES
// =============================================================================

const useUserMessageCardStyles = makeStyles({
    container: {
        ...shorthands.padding("12px", "16px"),
        backgroundColor: tokens.colorNeutralBackground3,
        borderRadius: "8px",
        marginLeft: "auto",
        maxWidth: "80%",
        alignSelf: "flex-end",
        boxShadow: tokens.shadow4,
    },
    messageText: {
        marginTop: "4px",
        fontSize: "12px",
    },
    attachmentInfo: {
        marginTop: "8px",
        fontSize: "12px",
        opacity: 0.8,
    },
});

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

/**
 * Props for the UserMessageCard component
 */
export interface UserMessageCardProps {
    /** The user message to display */
    message: UserMessage;
    /** Optional CSS class name */
    className?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * UserMessageCard component that displays a user message with content and attachment info
 */
export const UserMessageCard: React.FC<UserMessageCardProps> = ({ message, className }) => {
    const styles = useUserMessageCardStyles();

    return (
        <div className={mergeClasses(styles.container, className)}>
            <Text block className={styles.messageText}>
                {message.content}
            </Text>
            {message.attachedFiles && message.attachedFiles.length > 0 && (
                <div className={styles.attachmentInfo}>
                    <Attach12Filled /> {message.attachedFiles.length} file(s) attached
                </div>
            )}
        </div>
    );
};

export default UserMessageCard;
