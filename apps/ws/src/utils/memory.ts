export type MemoryCell = {
  id: number;
  value: 0 | 1;
};

export function getMemoryPuzzle(gridSize: number): MemoryCell[] {
  const puzzle: MemoryCell[] = [];
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      puzzle.push({
        id: i * gridSize + j,
        value: Math.random() > 0.5 ? 1 : 0,
      });
    }
  }
  if (!puzzle.some((cell) => cell.value === 1)) {
    puzzle[0]!.value = 1;
  }
  return puzzle;
}

export function generateFlashAnzan(length: number): { sequence: number[]; sum: number } {
  const sequence = Array.from({ length }, () => Math.floor(Math.random() * 9) + 1);
  return {
    sequence,
    sum: sequence.reduce((total, n) => total + n, 0),
  };
}
