import confetti from 'canvas-confetti';

export const triggerConfetti = (options = {}) => {
  const count = options.count || 60;
  const defaults = {
    origin: { y: 0.7 },
    zIndex: 9999,
  };

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors: ['#6366f1', '#a855f7', '#ec4899'],
  });
  fire(0.2, {
    spread: 60,
    colors: ['#38bdf8', '#34d399', '#f59e0b'],
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    colors: ['#6366f1', '#8b5cf6'],
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
};

export default triggerConfetti;
