/** Easing y duraciones del sistema de motion Nexium (Framer Motion). */

export const EASE_NEX = [0.16, 1, 0.3, 1] as const;

export const DURATION_IN = 0.7;
export const DURATION_HOVER = 0.4;
export const DURATION_PAGE = 0.3;

export const transitionNex = {
  duration: DURATION_IN,
  ease: EASE_NEX,
} as const;

export const transitionPage = {
  duration: DURATION_PAGE,
  ease: EASE_NEX,
} as const;

/** Spring cursor desktop */
export const CURSOR_SPRING = { stiffness: 150, damping: 20, mass: 0.4 };
