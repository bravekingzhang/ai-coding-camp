export type ColorT = 'RED' | 'YELLOW' | 'GREEN';
export type SourceT = 'CI' | 'LLM' | 'COACH' | 'PEER_TEST' | 'SYSTEM';
export type GradeEventLite = { source: SourceT; color: ColorT | null; createdAt: Date };
