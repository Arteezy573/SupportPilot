/**
 * Custom Fluent UI theme configuration for Support Pilot
 * Provides light/dark mode support with Microsoft design system tokens
 */

import { Theme, teamsDarkTheme, teamsLightTheme, createDarkTheme, createLightTheme, BrandVariants, tokens } from "@fluentui/react-components";

// =============================================================================
// BRAND COLOR DEFINITIONS
// =============================================================================

/**
 * Support Pilot brand color variants following Microsoft design guidelines
 * Based on the official Microsoft blue (#0078d4) with proper contrast ratios
 */
const supportPilotBrandColors: BrandVariants = {
    10: "#020305",
    20: "#111d2e",
    30: "#16263d",
    40: "#193257",
    50: "#1b3f72",
    60: "#1b4c8c",
    70: "#1959a6",
    80: "#0d5ec4",
    90: "#0078d4", // Primary brand color
    100: "#1a86d9",
    110: "#3192de",
    120: "#479fe1",
    130: "#5cabea",
    140: "#70b7f0",
    150: "#83c3f5",
    160: "#96cffa",
};

// =============================================================================
// CUSTOM THEME TOKENS
// =============================================================================

/**
 * Custom theme tokens for Support Pilot specific styling
 */
export const supportPilotTokens = {
    // Spacing tokens for consistent layout
    spacing: {
        chatPadding: "16px",
        messagePadding: "12px",
        sectionGap: "24px",
        componentGap: "8px",
    },

    // Typography tokens for chat interface
    typography: {
        chatHeaderSize: tokens.fontSizeHero700,
        messageTextSize: tokens.fontSizeBase300,
        timestampSize: tokens.fontSizeBase200,
        captionSize: tokens.fontSizeBase100,
    },

    // Chat-specific color tokens
    colors: {
        // Message bubble colors
        userMessageBackground: "#e3f2fd",
        agentMessageBackground: "#f8f9fa",
        systemMessageBackground: "#fff3cd",

        // Dark mode message colors
        userMessageBackgroundDark: "#1a365d",
        agentMessageBackgroundDark: "#2d3748",
        systemMessageBackgroundDark: "#744210",

        // Status indicator colors
        processingColor: "#ff8c00",
        successColor: "#107c10",
        errorColor: "#d13438",
        warningColor: "#ff8c00",

        // Border and accent colors
        attachmentBorder: "#d1d1d1",
        focusBorder: "#0078d4",
        hoverBackground: "#f3f2f1",
        hoverBackgroundDark: "#484644",
    },

    // Animation tokens
    animations: {
        messageAppear: "0.2s ease-out",
        buttonHover: "0.1s ease-in-out",
        accordionExpand: "0.3s ease-in-out",
        typingIndicator: "1.5s ease-in-out infinite",
    },

    // Shadow tokens for depth
    shadows: {
        message: "0 1px 2px rgba(0,0,0,0.1)",
        attachmentCard: "0 2px 4px rgba(0,0,0,0.1)",
        dropdown: "0 4px 8px rgba(0,0,0,0.15)",
    },
};

// =============================================================================
// LIGHT THEME CONFIGURATION
// =============================================================================

/**
 * Support Pilot light theme with custom brand colors and chat-optimized tokens
 */
export const supportPilotLightTheme: Theme = createLightTheme(supportPilotBrandColors);

/**
 * Enhanced light theme with additional customizations
 */
export const supportPilotLightThemeEnhanced: Theme = {
    ...supportPilotLightTheme,

    // Custom color overrides for better chat experience
    colorNeutralBackground1: "#ffffff",
    colorNeutralBackground2: "#fafafa",
    colorNeutralBackground3: "#f5f5f5",
    colorNeutralBackground4: "#f0f0f0",

    // Enhanced text colors for better readability
    colorNeutralForeground1: "#323130",
    colorNeutralForeground2: "#605e5c",
    colorNeutralForeground3: "#8a8886",

    // Chat-specific background colors
    colorBrandBackground: supportPilotBrandColors[90],
    colorBrandBackgroundHover: supportPilotBrandColors[100],
    colorBrandBackgroundPressed: supportPilotBrandColors[80],

    // Border and stroke customizations
    colorNeutralStroke1: "#d1d1d1",
    colorNeutralStroke2: "#e1e1e1",
    colorStrokeFocus2: supportPilotBrandColors[90],
};

// =============================================================================
// DARK THEME CONFIGURATION
// =============================================================================

/**
 * Support Pilot dark theme with custom brand colors and chat-optimized tokens
 */
export const supportPilotDarkTheme: Theme = createDarkTheme(supportPilotBrandColors);

/**
 * Enhanced dark theme with additional customizations
 */
export const supportPilotDarkThemeEnhanced: Theme = {
    ...supportPilotDarkTheme,

    // Custom dark background colors
    colorNeutralBackground1: "#1f1f1f",
    colorNeutralBackground2: "#2d2d2d",
    colorNeutralBackground3: "#404040",
    colorNeutralBackground4: "#4a4a4a",

    // Enhanced dark text colors
    colorNeutralForeground1: "#ffffff",
    colorNeutralForeground2: "#e1e1e1",
    colorNeutralForeground3: "#c7c7c7",

    // Dark mode brand colors
    colorBrandBackground: supportPilotBrandColors[100],
    colorBrandBackgroundHover: supportPilotBrandColors[110],
    colorBrandBackgroundPressed: supportPilotBrandColors[90],

    // Dark mode borders and strokes
    colorNeutralStroke1: "#484644",
    colorNeutralStroke2: "#3b3a39",
    colorStrokeFocus2: supportPilotBrandColors[100],
};

// =============================================================================
// TEAMS INTEGRATION THEMES
// =============================================================================

/**
 * Teams light theme integration for consistency with Microsoft Teams
 */
export const supportPilotTeamsLightTheme: Theme = {
    ...teamsLightTheme,
    ...supportPilotLightThemeEnhanced,
};

/**
 * Teams dark theme integration for consistency with Microsoft Teams
 */
export const supportPilotTeamsDarkTheme: Theme = {
    ...teamsDarkTheme,
    ...supportPilotDarkThemeEnhanced,
};

// =============================================================================
// THEME MANAGEMENT
// =============================================================================

/**
 * Available theme modes for Support Pilot
 */
export type ThemeMode = "light" | "dark" | "auto" | "teams-light" | "teams-dark";

/**
 * Theme configuration interface
 */
export interface ThemeConfig {
    mode: ThemeMode;
    theme: Theme;
    isDark: boolean;
}

/**
 * Gets the appropriate theme based on the mode
 */
export function getTheme(mode: ThemeMode, systemPrefersDark = false): ThemeConfig {
    switch (mode) {
        case "light":
            return {
                mode,
                theme: supportPilotLightThemeEnhanced,
                isDark: false,
            };
        case "dark":
            return {
                mode,
                theme: supportPilotDarkThemeEnhanced,
                isDark: true,
            };
        case "teams-light":
            return {
                mode,
                theme: supportPilotTeamsLightTheme,
                isDark: false,
            };
        case "teams-dark":
            return {
                mode,
                theme: supportPilotTeamsDarkTheme,
                isDark: true,
            };
        case "auto":
        default:
            return systemPrefersDark
                ? {
                      mode: "auto",
                      theme: supportPilotDarkThemeEnhanced,
                      isDark: true,
                  }
                : {
                      mode: "auto",
                      theme: supportPilotLightThemeEnhanced,
                      isDark: false,
                  };
    }
}

/**
 * Custom hook for theme management
 */
export function useThemeDetection(): boolean {
    const [isDark, setIsDark] = React.useState(() => {
        if (typeof window !== "undefined" && window.matchMedia) {
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
        }
        return false;
    });

    React.useEffect(() => {
        if (typeof window !== "undefined" && window.matchMedia) {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);

            mediaQuery.addEventListener("change", handler);
            return () => mediaQuery.removeEventListener("change", handler);
        }
    }, []);

    return isDark;
}

// =============================================================================
// ACCESSIBILITY ENHANCEMENTS
// =============================================================================

/**
 * High contrast theme variants for accessibility
 */
export const supportPilotHighContrastTheme: Theme = {
    ...supportPilotLightThemeEnhanced,

    // High contrast colors for accessibility
    colorNeutralForeground1: "#000000",
    colorNeutralBackground1: "#ffffff",
    colorBrandBackground: "#0000ff",
    colorBrandForeground1: "#0000ff",

    // Enhanced border contrast
    colorNeutralStroke1: "#000000",
    colorStrokeFocus2: "#ff0000",
};

/**
 * Accessibility-focused theme configuration
 */
export interface AccessibilityThemeConfig extends ThemeConfig {
    highContrast: boolean;
    reducedMotion: boolean;
}

/**
 * Gets accessibility-aware theme configuration
 */
export function getAccessibilityTheme(
    mode: ThemeMode,
    systemPrefersDark = false,
    prefersHighContrast = false,
    prefersReducedMotion = false
): AccessibilityThemeConfig {
    const baseTheme = getTheme(mode, systemPrefersDark);

    return {
        ...baseTheme,
        theme: prefersHighContrast ? supportPilotHighContrastTheme : baseTheme.theme,
        highContrast: prefersHighContrast,
        reducedMotion: prefersReducedMotion,
    };
}

// =============================================================================
// EXPORTS
// =============================================================================

// Default export for the primary theme
export default supportPilotLightThemeEnhanced;

// Re-export React for the hook
import React from "react";
