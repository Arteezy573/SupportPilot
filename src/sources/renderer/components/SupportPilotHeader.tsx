/**
 * Header component with tool branding and chat history access
 * Provides the main header for the Support Pilot application
 */

import React from "react";
import {
    Button,
    Text,
    makeStyles,
    tokens,
    shorthands,
} from "@fluentui/react-components";
import {
    History20Regular,
    Settings20Regular,
} from "@fluentui/react-icons";

// =============================================================================
// COMPONENT STYLES
// =============================================================================

const useHeaderStyles = makeStyles({
    root: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
        backgroundColor: tokens.colorNeutralBackground2,
        ...shorthands.borderBottom(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke2),
        minHeight: "64px",
    },
    brandingSection: {
        display: "flex",
        alignItems: "center",
        ...shorthands.gap(tokens.spacingHorizontalM),
    },
    logo: {
        width: "32px",
        height: "32px",
        backgroundColor: tokens.colorBrandBackground,
        borderRadius: tokens.borderRadiusCircular,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: tokens.colorNeutralForegroundOnBrand,
        fontSize: "16px",
        fontWeight: tokens.fontWeightSemibold,
    },
    titleSection: {
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap("2px"),
    },
    title: {
        fontSize: tokens.fontSizeBase300,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground1,
        lineHeight: tokens.lineHeightBase300,
    },
    subtitle: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
        lineHeight: tokens.lineHeightBase200,
    },
    actionsSection: {
        display: "flex",
        alignItems: "center",
        ...shorthands.gap(tokens.spacingHorizontalS),
    },
    actionButton: {
        minWidth: "auto",
    },
});

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

/**
 * Props for the SupportPilotHeader component
 */
export interface SupportPilotHeaderProps {
    /** Whether to show the chat history button */
    showHistoryButton?: boolean;
    /** Whether to show the settings button */
    showSettingsButton?: boolean;
    /** Callback when chat history button is clicked */
    onHistoryClick?: () => void;
    /** Callback when settings button is clicked */
    onSettingsClick?: () => void;
    /** Custom subtitle text */
    subtitle?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Header component that displays the Support Pilot branding and navigation
 * Includes tool logo, title, and action buttons for history and settings
 */
export const SupportPilotHeader: React.FC<SupportPilotHeaderProps> = ({
    showHistoryButton = true,
    showSettingsButton = true,
    onHistoryClick,
    onSettingsClick,
    subtitle = "AI-powered support ticket assistant",
}) => {
    const styles = useHeaderStyles();

    return (
        <header className={styles.root}>
            {/* Branding Section */}
            <div className={styles.brandingSection}>
                {/* Logo */}
                <div className={styles.logo}>
                    SP
                </div>
                
                {/* Title and Subtitle */}
                <div className={styles.titleSection}>
                    <Text className={styles.title}>
                        Support Pilot
                    </Text>
                    <Text className={styles.subtitle}>
                        {subtitle}
                    </Text>
                </div>
            </div>

            {/* Actions Section */}
            <div className={styles.actionsSection}>
                {showHistoryButton && (
                    <Button
                        appearance="subtle"
                        icon={<History20Regular />}
                        onClick={onHistoryClick}
                        className={styles.actionButton}
                        title="Chat History"
                        aria-label="Open chat history"
                    />
                )}
                
                {showSettingsButton && (
                    <Button
                        appearance="subtle"
                        icon={<Settings20Regular />}
                        onClick={onSettingsClick}
                        className={styles.actionButton}
                        title="Settings"
                        aria-label="Open settings"
                    />
                )}
            </div>
        </header>
    );
};

export default SupportPilotHeader;
