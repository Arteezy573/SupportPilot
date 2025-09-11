/**
 * Styles for the React app entry point using Fluent UI makeStyles
 * Uses design tokens for consistent theming and better performance
 */

import { makeStyles, tokens } from "@fluentui/react-components";

export const useAppStyles = makeStyles({
    container: {
        fontFamily: tokens.fontFamilyBase,
        padding: tokens.spacingVerticalXXL,
        textAlign: "center",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground1,
    },
    title: {
        color: tokens.colorBrandForeground1,
        marginBottom: tokens.spacingVerticalXL,
        fontSize: tokens.fontSizeHero800,
        fontWeight: tokens.fontWeightSemibold,
        lineHeight: tokens.lineHeightHero800,
        margin: `0 0 ${tokens.spacingVerticalXL} 0`,
    },
    description: {
        marginBottom: tokens.spacingVerticalXL,
        fontSize: tokens.fontSizeBase300,
        color: tokens.colorNeutralForeground2,
        lineHeight: tokens.lineHeightBase300,
        margin: `0 0 ${tokens.spacingVerticalXL} 0`,
    },
    buttonContainer: {
        marginBottom: tokens.spacingVerticalXL,
        display: "flex",
        gap: tokens.spacingHorizontalM,
        alignItems: "center",
    },
    primaryButton: {
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
        fontSize: tokens.fontSizeBase300,
        backgroundColor: tokens.colorBrandBackground,
        color: tokens.colorNeutralForegroundOnBrand,
        border: "none",
        borderRadius: tokens.borderRadiusMedium,
        cursor: "pointer",
        fontFamily: tokens.fontFamilyBase,
        fontWeight: tokens.fontWeightMedium,
        lineHeight: tokens.lineHeightBase300,
        ":hover": {
            backgroundColor: tokens.colorBrandBackgroundHover,
        },
        ":active": {
            backgroundColor: tokens.colorBrandBackgroundPressed,
        },
        ":focus": {
            outline: `${tokens.strokeWidthThick} solid ${tokens.colorStrokeFocus2}`,
            outlineOffset: tokens.spacingHorizontalXXS,
        },
    },
    secondaryButton: {
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
        fontSize: tokens.fontSizeBase300,
        backgroundColor: tokens.colorNeutralBackground3,
        color: tokens.colorNeutralForeground1,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        cursor: "pointer",
        fontFamily: tokens.fontFamilyBase,
        fontWeight: tokens.fontWeightMedium,
        lineHeight: tokens.lineHeightBase300,
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground3Hover,
        },
        ":active": {
            backgroundColor: tokens.colorNeutralBackground3Pressed,
        },
        ":focus": {
            outline: `${tokens.strokeWidthThick} solid ${tokens.colorStrokeFocus2}`,
            outlineOffset: tokens.spacingHorizontalXXS,
        },
    },
    statusText: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
        lineHeight: tokens.lineHeightBase200,
        margin: "0",
    },
});
