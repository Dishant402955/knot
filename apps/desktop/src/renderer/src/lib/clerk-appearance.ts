/** Clerk UI theme aligned with apps/web dark shadcn / neutral. */
export const clerkAppearance = {
  variables: {
    colorPrimary: "#e5e5e5",
    colorBackground: "#2a2a2a",
    colorDanger: "#e05d4c",
    colorSuccess: "#5eead4",
    colorWarning: "#fbbf24",
    colorText: "#fafafa",
    colorTextSecondary: "#a3a3a3",
    colorInputBackground: "#171717",
    colorInputText: "#fafafa",
    borderRadius: "0.625rem",
    fontFamily: '"Inter Variable", Inter, system-ui, sans-serif',
    fontSize: "0.82rem",
    spacingUnit: "0.7rem",
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
      gap: "0.75rem",
    },
    header: {
      display: "none",
    },
    footer: {
      display: "none",
    },
    headerTitle: {
      color: "#fafafa",
      fontFamily: '"Inter Variable", Inter, system-ui, sans-serif',
      fontSize: "1rem",
    },
    headerSubtitle: {
      color: "#a3a3a3",
      fontSize: "0.8rem",
    },
    socialButtonsBlockButton: {
      background: "#171717",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      color: "#fafafa",
      boxShadow: "none",
      height: "36px",
      minHeight: "36px",
      borderRadius: "0.625rem",
    },
    socialButtonsBlockButtonText: {
      color: "#fafafa",
      fontWeight: "500",
      fontSize: "0.82rem",
    },
    socialButtonsProviderIcon: {
      filter: "none",
      width: "16px",
      height: "16px",
    },
    socialButtonsBlockButtonArrow: {
      color: "#a3a3a3",
    },
    dividerLine: {
      background: "rgba(255, 255, 255, 0.1)",
    },
    dividerText: {
      color: "#737373",
      fontSize: "0.75rem",
    },
    formFieldLabel: {
      color: "#a3a3a3",
      fontWeight: "500",
      fontSize: "0.78rem",
    },
    formFieldInput: {
      background: "#171717",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      color: "#fafafa",
      caretColor: "#e5e5e5",
      height: "36px",
      fontSize: "0.82rem",
      borderRadius: "0.625rem",
    },
    formFieldInputShowPasswordButton: {
      color: "#a3a3a3",
    },
    formButtonPrimary: {
      background: "#e5e5e5",
      color: "#171717",
      fontWeight: "600",
      boxShadow: "none",
      height: "36px",
      minHeight: "36px",
      fontSize: "0.82rem",
      borderRadius: "0.625rem",
    },
    footerActionText: {
      color: "#a3a3a3",
    },
    footerActionLink: {
      color: "#e5e5e5",
    },
    identityPreviewText: {
      color: "#fafafa",
    },
    identityPreviewEditButton: {
      color: "#e5e5e5",
    },
    formFieldSuccessText: {
      color: "#5eead4",
    },
    formFieldErrorText: {
      color: "#e05d4c",
      fontSize: "0.75rem",
    },
    alertText: {
      color: "#fafafa",
      fontSize: "0.8rem",
    },
    otpCodeFieldInput: {
      background: "#171717",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      color: "#fafafa",
    },
    alternativeMethodsBlockButton: {
      color: "#fafafa",
      background: "#171717",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      height: "36px",
    },
    formResendCodeLink: {
      color: "#e5e5e5",
    },
  },
} as const;
