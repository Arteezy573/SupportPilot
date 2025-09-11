/**
 * Personalized greeting and usage guidance component
 * Provides welcome message and helpful instructions for using Support Pilot
 */

import React from "react";
import {
    Text,
    makeStyles,
    tokens,
    shorthands,
} from "@fluentui/react-components";
import {
    ChatSparkle24Regular,
    DocumentText24Regular,
    Attach24Regular,
} from "@fluentui/react-icons";

// =============================================================================
// COMPONENT STYLES
// =============================================================================

const useGreetingStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...shorthands.gap(tokens.spacingVerticalXL),
        maxWidth: "600px",
        margin: "0 auto",
        textAlign: "center",
    },
    welcomeSection: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...shorthands.gap(tokens.spacingVerticalM),
    },
    icon: {
        fontSize: "48px",
        color: tokens.colorBrandBackground,
        marginBottom: tokens.spacingVerticalS,
    },
    title: {
        fontSize: tokens.fontSizeHero800,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground1,
        lineHeight: tokens.lineHeightHero800,
        marginBottom: tokens.spacingVerticalXS,
    },
    subtitle: {
        fontSize: tokens.fontSizeBase400,
        color: tokens.colorNeutralForeground2,
        lineHeight: tokens.lineHeightBase400,
        maxWidth: "480px",
    },
    guidanceSection: {
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap(tokens.spacingVerticalL),
        width: "100%",
    },
    guidanceTitle: {
        fontSize: tokens.fontSizeBase500,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground1,
        lineHeight: tokens.lineHeightBase500,
        marginBottom: tokens.spacingVerticalM,
    },
    stepsContainer: {
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap(tokens.spacingVerticalL),
        alignItems: "flex-start",
        textAlign: "left",
    },
    step: {
        display: "flex",
        alignItems: "flex-start",
        ...shorthands.gap(tokens.spacingHorizontalM),
        width: "100%",
    },
    stepIcon: {
        fontSize: "24px",
        color: tokens.colorBrandBackground,
        flexShrink: 0,
        marginTop: "2px",
    },
    stepContent: {
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap(tokens.spacingVerticalXS),
        flex: 1,
    },
    stepTitle: {
        fontSize: tokens.fontSizeBase300,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground1,
        lineHeight: tokens.lineHeightBase300,
    },
    stepDescription: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
        lineHeight: tokens.lineHeightBase200,
    }
});

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

/**
 * Props for the GreetingText component
 */
export interface GreetingTextProps {
    /** Custom user name for personalization */
    userName?: string;
    /** Whether to show the guidance steps */
    showGuidance?: boolean;
    /** Custom welcome message */
    customMessage?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * GreetingText component that displays a personalized welcome message
 * and provides usage guidance for Support Pilot
 */
export const GreetingText: React.FC<GreetingTextProps> = ({
    userName,
    showGuidance = true,
    customMessage,
}) => {
    const styles = useGreetingStyles();

    // Get appropriate greeting based on time of day
    const getTimeBasedGreeting = (): string => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    };

    const greeting = userName 
        ? `${getTimeBasedGreeting()}, ${userName}!`
        : `${getTimeBasedGreeting()}!`;

    const welcomeMessage = customMessage || 
        "I'm here to help you analyze logs, process emails, and create structured livesite tickets with AI assistance.";

    return (
        <div className={styles.root}>
            {/* Welcome Section */}
            <div className={styles.welcomeSection}>
                <ChatSparkle24Regular className={styles.icon} />
                <Text className={styles.title}>
                    {greeting}
                </Text>
                <Text className={styles.subtitle}>
                    {welcomeMessage}
                </Text>
            </div>

            {/* Usage Guidance */}
            {showGuidance && (
                <div className={styles.guidanceSection}>
                    <Text className={styles.guidanceTitle}>
                        How to get started:
                    </Text>
                    
                    <div className={styles.stepsContainer}>
                        {/* Step 1: Attach Files */}
                        <div className={styles.step}>
                            <Attach24Regular className={styles.stepIcon} />
                            <div className={styles.stepContent}>
                                <Text className={styles.stepTitle}>
                                    1. Attach your files
                                </Text>
                                <Text className={styles.stepDescription}>
                                    Upload trace logs, email threads, or error reports to get started. 
                                    I can analyze various file formats and extract key information.
                                </Text>
                            </div>
                        </div>

                        {/* Step 2: Describe the Issue */}
                        <div className={styles.step}>
                            <DocumentText24Regular className={styles.stepIcon} />
                            <div className={styles.stepContent}>
                                <Text className={styles.stepTitle}>
                                    2. Describe the issue
                                </Text>
                                <Text className={styles.stepDescription}>
                                    Tell me about the problem you're investigating. Include any relevant context, 
                                    timeline, or customer impact details.
                                </Text>
                            </div>
                        </div>

                        {/* Step 3: Get AI Analysis */}
                        <div className={styles.step}>
                            <ChatSparkle24Regular className={styles.stepIcon} />
                            <div className={styles.stepContent}>
                                <Text className={styles.stepTitle}>
                                    3. Get AI-powered analysis
                                </Text>
                                <Text className={styles.stepDescription}>
                                    I'll analyze your files, suggest solutions, help with root cause analysis, 
                                    and provide structured information for your livesite tickets.
                                </Text>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GreetingText;
