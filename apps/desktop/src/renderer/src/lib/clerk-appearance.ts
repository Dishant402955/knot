/** Shared Clerk UI theme — light text on dark surfaces (no dark-on-dark). */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#8fd3ff",
    colorBackground: "#0c1219",
    colorDanger: "#ff6b81",
    colorSuccess: "#5eead4",
    colorWarning: "#fbbf24",
    borderRadius: "12px",
    fontFamily: '"IBM Plex Sans Variable", "IBM Plex Sans", sans-serif',
    fontSize: "0.95rem",
  },
  elements: {
    rootBox: {
      width: "100%",
    },
    cardBox: {
      width: "100%",
      boxShadow: "none",
    },
    card: {
      background: "transparent",
      boxShadow: "none",
      border: "none",
      padding: "0",
      width: "100%",
    },
    headerTitle: {
      color: "#edf2f7",
      fontFamily: '"Space Grotesk Variable", "Space Grotesk", sans-serif',
      fontSize: "1.15rem",
    },
    headerSubtitle: {
      color: "#a8b4c4",
    },
    socialButtonsBlockButton: {
      background: "#161e2a",
      border: "1px solid rgba(170, 200, 230, 0.22)",
      color: "#edf2f7",
      boxShadow: "none",
    },
    socialButtonsBlockButtonText: {
      color: "#edf2f7",
      fontWeight: "600",
    },
    socialButtonsProviderIcon: {
      filter: "none",
    },
    socialButtonsBlockButtonArrow: {
      color: "#a8b4c4",
    },
    dividerLine: {
      background: "rgba(170, 200, 230, 0.16)",
    },
    dividerText: {
      color: "#8b98ab",
    },
    formFieldLabel: {
      color: "#c8d2e0",
      fontWeight: "500",
    },
    formFieldInput: {
      background: "#10161f",
      border: "1px solid rgba(170, 200, 230, 0.2)",
      color: "#edf2f7",
      caretColor: "#8fd3ff",
    },
    formFieldInputShowPasswordButton: {
      color: "#a8b4c4",
    },
    formButtonPrimary: {
      background: "#8fd3ff",
      color: "#05070a",
      fontWeight: "700",
      boxShadow: "none",
    },
    footerActionText: {
      color: "#8b98ab",
    },
    footerActionLink: {
      color: "#8fd3ff",
    },
    identityPreviewText: {
      color: "#edf2f7",
    },
    identityPreviewEditButton: {
      color: "#8fd3ff",
    },
    formFieldSuccessText: {
      color: "#5eead4",
    },
    formFieldErrorText: {
      color: "#ff8fa3",
    },
    alertText: {
      color: "#edf2f7",
    },
    otpCodeFieldInput: {
      background: "#10161f",
      border: "1px solid rgba(170, 200, 230, 0.2)",
      color: "#edf2f7",
    },
    alternativeMethodsBlockButton: {
      color: "#edf2f7",
      background: "#161e2a",
      border: "1px solid rgba(170, 200, 230, 0.18)",
    },
    formResendCodeLink: {
      color: "#8fd3ff",
    },
  },
} as const;
