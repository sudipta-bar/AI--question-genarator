const difficultyConfig = {
  Easy: { bg: '#DCFCE7', color: '#166534', label: 'Easy' },
  Moderate: { bg: '#FEF9C3', color: '#854D0E', label: 'Moderate' },
  Challenging: { bg: '#FEE2E2', color: '#991B1B', label: 'Challenging' },
  easy: { bg: '#DCFCE7', color: '#166534', label: 'Easy' },
  moderate: { bg: '#FEF9C3', color: '#854D0E', label: 'Moderate' },
  challenging: { bg: '#FEE2E2', color: '#991B1B', label: 'Challenging' },
} as const;

type Difficulty = keyof typeof difficultyConfig;

function resolveDifficulty(difficulty: string | undefined) {
  return difficulty && difficulty in difficultyConfig ? difficultyConfig[difficulty as Difficulty] : difficultyConfig.Moderate;
}

export function DifficultyBadge({ difficulty }: { difficulty?: string }) {
  const badge = resolveDifficulty(difficulty);
  return (
    <span className="pill difficulty-badge px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: badge.bg, color: badge.color }}>
      {badge.label}
    </span>
  );
}
