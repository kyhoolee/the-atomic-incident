export type DifficultyLevel = 'rookie' | 'professional' | 'legend';
export type GameMode = 'contract' | 'endless';

export interface MenuSelection {
  stageId: string;
  difficulty: DifficultyLevel;
  mode: GameMode;
  agentId: string;
}
