// animations.ts
export const animations = {
  // 🔹 Fade
  fadeIn: {
    from: { opacity: 0 },
    animate: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    animate: { opacity: 0 },
  },
  

  // 🔹 Slide
  slideUp: {
    from: { translateY: 50, opacity: 0 },
    animate: { translateY: 0, opacity: 1 },
  },
  slideDown: {
    from: { translateY: -50, opacity: 0 },
    animate: { translateY: 0, opacity: 1 },
  },
  slideLeft: {
    from: { translateX: 100, opacity: 0 },
    animate: { translateX: 0, opacity: 1 },
  },
  slideRight: {
    from: { translateX: -100, opacity: 0 },
    animate: { translateX: 0, opacity: 1 },
  },

  // 🔹 Zoom
  zoomIn: {
    from: { scale: 0.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
  },
  zoomOut: {
    from: { scale: 1.5, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
  },

  // 🔹 Bounce
  bounceIn: {
    from: { scale: 0.3, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { type: 'spring', damping: 10 },
  },

  // 🔹 Shake
  shake: {
    from: { translateX: 0 },
    animate: { translateX: [0, -10, 10, -10, 10, 0] },
    transition: { type: 'timing', duration: 600 },
  },
};
