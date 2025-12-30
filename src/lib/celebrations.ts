import confetti from "canvas-confetti";

// Standard celebration for unlocking achievements
export function celebrateAchievement() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0"],
  });
}

// Special golden celebration for level up
export function celebrateLevelUp() {
  // First burst
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.5 },
    colors: ["#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A"],
  });

  // Second delayed burst with stars
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 120,
      origin: { y: 0.4 },
      colors: ["#F59E0B", "#FBBF24"],
      shapes: ["star"],
      scalar: 1.2,
    });
  }, 200);
}

// Colorful celebration for completing challenges
export function celebrateChallenge() {
  const colors = ["#EC4899", "#8B5CF6", "#3B82F6", "#10B981", "#F59E0B"];
  
  confetti({
    particleCount: 80,
    spread: 80,
    origin: { y: 0.6 },
    colors,
  });
}

// Big celebration for completing a savings goal
export function celebrateGoalCompleted() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    confetti({
      particleCount,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: randomInRange(0.1, 0.9),
        y: Math.random() - 0.2,
      },
      colors: ["#10B981", "#34D399", "#F59E0B", "#FBBF24"],
    });
  }, 250);
}

// Side cannons celebration for special achievements
export function celebrateSideCannons() {
  const end = Date.now() + 500;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#EC4899", "#8B5CF6", "#3B82F6"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#EC4899", "#8B5CF6", "#3B82F6"],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
