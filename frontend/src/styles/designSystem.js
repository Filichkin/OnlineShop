/**
 * Unified Design System for OnlineShop
 *
 * This file contains all design tokens and utility classes
 * for consistent styling across the application.
 *
 * USAGE:
 * import { typography, colors, spacing, effects, buttonVariants, inputStyles, cardStyles } from '../styles/designSystem';
 *
 * className={`${typography.fontFamily} ${typography.fontSize.md} ${typography.fontWeight.medium}`}
 */

// =============================================================================
// TYPOGRAPHY SYSTEM
// =============================================================================

export const typography = {
  // Font family - Roboto for all text
  fontFamily: 'font-roboto',

  // Font sizes - using text-[Xpx] format for precise control
  fontSize: {
    xs: 'text-[12px]',      // Extra small labels, captions
    sm: 'text-[14px]',      // Small text, hints
    base: 'text-[16px]',    // Base text, buttons
    md: 'text-[18px]',      // Medium text, body
    lg: 'text-[20px]',      // Large text, H3
    xl: 'text-[22px]',      // Extra large, H3 variant
    '2xl': 'text-[24px]',   // H2
    '3xl': 'text-[28px]',   // H2 variant
    '4xl': 'text-[32px]',   // H1
    '5xl': 'text-[36px]',   // H1 large variant
  },

  // Font weights - using font-[XXX] format
  fontWeight: {
    light: 'font-[300]',      // Light text
    normal: 'font-[400]',     // Normal text (hints, labels)
    medium: 'font-[450]',     // Base weight for body text
    semibold: 'font-[500]',   // Semi-bold (buttons, headings)
    bold: 'font-[550]',       // Bold variant
    extrabold: 'font-[600]',  // Extra bold (H1, H2)
    black: 'font-[700]',      // Black (emphasis)
  },

  // Text colors - semantic hierarchy
  textColor: {
    primary: 'text-gray-900',     // Primary text
    secondary: 'text-gray-700',   // Secondary text
    tertiary: 'text-gray-500',    // Tertiary text, hints
    disabled: 'text-gray-400',    // Disabled state
    white: 'text-white',          // White text
    error: 'text-red-600',        // Error messages
    success: 'text-green-600',    // Success messages
    warning: 'text-yellow-600',   // Warning messages
    link: 'text-blue-600',        // Links
  },

  // Line height
  lineHeight: {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  },
};

// =============================================================================
// COLOR SYSTEM
// =============================================================================

export const colors = {
  // Primary palette - Gray scale for main UI elements
  primary: {
    DEFAULT: 'bg-gray-800',
    hover: 'hover:bg-gray-900',
    active: 'active:bg-gray-950',
    text: 'text-white',
    light: 'bg-gray-700',
    lighter: 'bg-gray-600',
  },

  // Secondary palette - White/Light backgrounds
  secondary: {
    DEFAULT: 'bg-white',
    hover: 'hover:bg-gray-50',
    active: 'active:bg-gray-100',
    text: 'text-gray-900',
    border: 'border-gray-300',
  },

  // Neutral palette - Backgrounds and borders
  neutral: {
    bg: {
      lightest: 'bg-white',
      light: 'bg-gray-50',
      DEFAULT: 'bg-gray-100',
      dark: 'bg-gray-200',
      darker: 'bg-gray-300',
    },
    border: {
      light: 'border-gray-200',
      DEFAULT: 'border-gray-300',
      dark: 'border-gray-400',
    },
    text: {
      light: 'text-gray-500',
      DEFAULT: 'text-gray-600',
      dark: 'text-gray-700',
      darkest: 'text-gray-900',
    },
  },

  // State colors - Error, Success, Warning, Info
  states: {
    error: {
      bg: 'bg-red-600',
      hover: 'hover:bg-red-700',
      text: 'text-white',
      border: 'border-red-500',
      light: 'bg-red-50',
      lightText: 'text-red-600',
    },
    success: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-700',
      text: 'text-white',
      border: 'border-green-500',
      light: 'bg-green-50',
      lightText: 'text-green-600',
    },
    warning: {
      bg: 'bg-yellow-500',
      hover: 'hover:bg-yellow-600',
      text: 'text-white',
      border: 'border-yellow-500',
      light: 'bg-yellow-50',
      lightText: 'text-yellow-600',
    },
    info: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      text: 'text-white',
      border: 'border-blue-500',
      light: 'bg-blue-50',
      lightText: 'text-blue-600',
    },
  },
};

// =============================================================================
// SPACING SYSTEM
// =============================================================================

export const spacing = {
  // Input field spacing
  input: {
    padding: 'px-4 py-2.5',
    paddingSm: 'px-3 py-2',
    height: 'h-11',
    heightSm: 'h-9',
  },

  // Button spacing by size
  button: {
    xs: 'px-2 py-1 h-7',
    sm: 'px-3 py-1.5 h-8',
    md: 'px-4 py-2 h-10',
    lg: 'px-6 py-3 h-12',
    xl: 'px-8 py-4 h-14',
  },

  // Card/Container spacing
  card: {
    padding: 'p-4 sm:p-6',
    paddingSm: 'p-3',
    paddingLg: 'p-6 sm:p-8',
    gap: 'space-y-4',
    gapSm: 'space-y-2',
    gapLg: 'space-y-6',
  },

  // Section spacing
  section: {
    padding: 'py-10',
    paddingLg: 'py-16',
    margin: 'mb-8',
    marginSm: 'mb-4',
    marginLg: 'mb-12',
  },
};

// =============================================================================
// EFFECTS SYSTEM (Shadows, Borders, Transitions)
// =============================================================================

export const effects = {
  // Shadow variants
  shadow: {
    none: 'shadow-none',
    sm: 'shadow-sm',
    DEFAULT: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  },

  // Border radius
  rounded: {
    none: 'rounded-none',
    sm: 'rounded',
    DEFAULT: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  },

  // Transitions
  transition: {
    none: 'transition-none',
    DEFAULT: 'transition-all duration-200',
    fast: 'transition-all duration-100',
    slow: 'transition-all duration-300',
    colors: 'transition-colors duration-200',
    transform: 'transition-transform duration-200',
    shadow: 'transition-shadow duration-300',
  },

  // Focus ring styles
  focus: {
    DEFAULT: 'focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2',
    blue: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    red: 'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
    gray: 'focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2',
  },
};

// =============================================================================
// BUTTON VARIANTS
// =============================================================================

export const buttonVariants = {
  // Primary button - Dark background
  primary: `
    ${colors.primary.DEFAULT} ${colors.primary.hover} ${colors.primary.text}
    ${effects.rounded.DEFAULT} ${effects.transition.DEFAULT}
    ${typography.fontSize.base} ${typography.fontWeight.semibold}
    ${spacing.button.md}
    ${effects.focus.DEFAULT}
    disabled:opacity-50 disabled:cursor-not-allowed
    hover:shadow-lg
  `,

  // Primary small
  primarySm: `
    ${colors.primary.DEFAULT} ${colors.primary.hover} ${colors.primary.text}
    ${effects.rounded.DEFAULT} ${effects.transition.DEFAULT}
    ${typography.fontSize.sm} ${typography.fontWeight.medium}
    ${spacing.button.sm}
    ${effects.focus.DEFAULT}
    disabled:opacity-50 disabled:cursor-not-allowed
  `,

  // Primary large
  primaryLg: `
    ${colors.primary.DEFAULT} ${colors.primary.hover} ${colors.primary.text}
    ${effects.rounded.DEFAULT} ${effects.transition.DEFAULT}
    ${typography.fontSize.base} ${typography.fontWeight.semibold}
    ${spacing.button.lg}
    ${effects.focus.DEFAULT}
    disabled:opacity-50 disabled:cursor-not-allowed
    hover:shadow-lg
  `,

  // Secondary button - White background with border
  secondary: `
    ${colors.secondary.DEFAULT} ${colors.secondary.hover} ${colors.secondary.text}
    ${colors.secondary.border} border
    ${effects.rounded.DEFAULT} ${effects.transition.DEFAULT}
    ${typography.fontSize.base} ${typography.fontWeight.medium}
    ${spacing.button.md}
    focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `,

  // Danger button - Red background
  danger: `
    ${colors.states.error.bg} ${colors.states.error.hover} ${colors.states.error.text}
    ${effects.rounded.DEFAULT} ${effects.transition.DEFAULT}
    ${typography.fontSize.base} ${typography.fontWeight.medium}
    ${spacing.button.md}
    focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `,

  // Ghost button - Transparent with hover
  ghost: `
    bg-transparent ${colors.secondary.hover}
    ${typography.textColor.secondary} hover:text-gray-900
    ${effects.rounded.DEFAULT} ${effects.transition.colors}
    ${typography.fontSize.base} ${typography.fontWeight.medium}
    ${spacing.button.md}
    focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `,

  // Link button - Text only with underline on hover
  link: `
    bg-transparent
    ${typography.textColor.link} hover:text-blue-800
    ${effects.transition.colors}
    ${typography.fontSize.base} ${typography.fontWeight.medium}
    hover:underline
    focus:outline-none focus:underline
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
};

// =============================================================================
// INPUT STYLES
// =============================================================================

export const inputStyles = {
  // Base input style
  base: `
    ${spacing.input.padding} ${spacing.input.height}
    ${colors.neutral.border.DEFAULT} border
    ${effects.rounded.DEFAULT} ${effects.transition.DEFAULT}
    ${typography.fontSize.base} ${typography.fontWeight.normal}
    ${typography.fontFamily}
    focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `,

  // Small input
  small: `
    ${spacing.input.paddingSm} ${spacing.input.heightSm}
    ${colors.neutral.border.DEFAULT} border
    ${effects.rounded.DEFAULT} ${effects.transition.DEFAULT}
    ${typography.fontSize.sm} ${typography.fontWeight.normal}
    ${typography.fontFamily}
    focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `,

  // Input with error state
  error: `
    ${spacing.input.padding} ${spacing.input.height}
    border-red-500 border
    ${effects.rounded.DEFAULT} ${effects.transition.DEFAULT}
    ${typography.fontSize.base} ${typography.fontWeight.normal}
    ${typography.fontFamily}
    focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `,

  // Textarea
  textarea: `
    ${spacing.input.padding}
    ${colors.neutral.border.DEFAULT} border
    ${effects.rounded.DEFAULT} ${effects.transition.DEFAULT}
    ${typography.fontSize.base} ${typography.fontWeight.normal}
    ${typography.fontFamily}
    focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    resize-vertical
  `,

  // Select dropdown
  select: `
    ${spacing.input.padding} ${spacing.input.height}
    ${colors.neutral.border.DEFAULT} border
    ${effects.rounded.DEFAULT} ${effects.transition.DEFAULT}
    ${typography.fontSize.base} ${typography.fontWeight.normal}
    ${typography.fontFamily}
    bg-white cursor-pointer
    focus:outline-none focus:ring-2 focus:ring-gray-600 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `,
};

// =============================================================================
// CARD STYLES
// =============================================================================

export const cardStyles = {
  // Base card style
  base: `
    ${colors.secondary.DEFAULT}
    ${colors.neutral.border.light} border
    ${effects.rounded.lg}
    ${effects.shadow.DEFAULT}
    ${spacing.card.padding}
  `,

  // Card with hover effect
  hover: `
    ${colors.secondary.DEFAULT}
    ${colors.neutral.border.light} border
    ${effects.rounded.lg}
    ${effects.shadow.sm} hover:shadow-xl
    ${effects.transition.shadow}
    ${spacing.card.padding}
  `,

  // Compact card
  compact: `
    ${colors.secondary.DEFAULT}
    ${colors.neutral.border.light} border
    ${effects.rounded.DEFAULT}
    ${effects.shadow.sm}
    ${spacing.card.paddingSm}
  `,

  // Large card
  large: `
    ${colors.secondary.DEFAULT}
    ${colors.neutral.border.light} border
    ${effects.rounded.xl}
    ${effects.shadow.lg}
    ${spacing.card.paddingLg}
  `,
};

// =============================================================================
// MODAL STYLES
// =============================================================================

export const modalStyles = {
  // Modal backdrop
  backdrop: `
    fixed inset-0 z-50
    flex items-center justify-center
    bg-black bg-opacity-50
    p-4
  `,

  // Modal container
  container: `
    relative w-full max-w-md
    ${colors.secondary.DEFAULT}
    ${effects.rounded.lg}
    ${effects.shadow.xl}
    max-h-[90vh] overflow-y-auto
  `,

  // Modal header
  header: `
    ${typography.fontSize['2xl']} ${typography.fontWeight.extrabold}
    ${typography.textColor.primary}
    mb-6
  `,

  // Modal close button
  closeButton: `
    absolute top-4 right-4
    text-gray-400 hover:text-gray-600
    ${effects.transition.colors}
    focus:outline-none focus:ring-2 focus:ring-blue-500 rounded
  `,
};

// =============================================================================
// LABEL STYLES
// =============================================================================

export const labelStyles = {
  // Default label
  base: `
    block mb-2
    ${typography.fontSize.sm} ${typography.fontWeight.medium}
    ${typography.textColor.dark}
  `,

  // Required field indicator
  required: 'text-red-500',

  // Helper text
  helper: `
    mt-1
    ${typography.fontSize.xs}
    ${typography.textColor.tertiary}
  `,

  // Error message
  error: `
    mt-1
    ${typography.fontSize.sm}
    ${typography.textColor.error}
  `,
};

// =============================================================================
// BADGE STYLES
// =============================================================================

export const badgeStyles = {
  // Default badge
  base: `
    inline-flex items-center justify-center
    min-w-[1.125rem] h-[1.125rem]
    ${typography.fontSize.xs} ${typography.fontWeight.medium}
    ${colors.primary.text}
    ${colors.primary.DEFAULT}
    ${effects.rounded.full}
  `,

  // Small badge
  sm: `
    inline-flex items-center justify-center
    min-w-[1rem] h-[1rem]
    text-[10px] ${typography.fontWeight.medium}
    ${colors.primary.text}
    ${colors.primary.DEFAULT}
    ${effects.rounded.full}
  `,
};

// =============================================================================
// UTILITY CLASSES
// =============================================================================

export const utils = {
  // Container max-width
  container: 'max-w-7xl mx-auto px-6',

  // Flex center
  flexCenter: 'flex items-center justify-center',

  // Flex between
  flexBetween: 'flex items-center justify-between',

  // Grid auto-fit
  gridAutoFit: 'grid gap-4',

  // Screen reader only
  srOnly: 'sr-only',

  // Truncate text
  truncate: 'truncate',

  // Line clamp (2 lines)
  lineClamp2: `
    overflow-hidden
    text-ellipsis
    line-clamp-2
  `,

  // Line clamp (3 lines)
  lineClamp3: `
    overflow-hidden
    text-ellipsis
    line-clamp-3
  `,
};

// =============================================================================
// EXPORT ALL
// =============================================================================

export default {
  typography,
  colors,
  spacing,
  effects,
  buttonVariants,
  inputStyles,
  cardStyles,
  modalStyles,
  labelStyles,
  badgeStyles,
  utils,
};
