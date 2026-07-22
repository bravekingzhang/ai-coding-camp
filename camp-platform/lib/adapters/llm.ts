export type RubricResult = { score: number; preColor: 'RED' | 'YELLOW' | 'GREEN'; items: { name: string; got: number; max: number }[] };

export interface LlmGateway {
  evaluate(rubricPath: string, artifact: { mrUrl?: string; text?: string }): Promise<RubricResult>;
}

/** Mock：无网关时可完整走通全流程（开发/演示用） */
class MockLlm implements LlmGateway {
  async evaluate(rubricPath: string): Promise<RubricResult> {
    const score = 7 + Math.random() * 2.5;
    return {
      score: Math.round(score * 10) / 10,
      preColor: score >= 9 ? 'GREEN' : score >= 7 ? 'YELLOW' : 'RED',
      items: [{ name: `mock:${rubricPath}`, got: score, max: 10 }],
    };
  }
}

class HttpGateway implements LlmGateway {
  async evaluate(rubricPath: string, artifact: { mrUrl?: string; text?: string }): Promise<RubricResult> {
    const res = await fetch(`${process.env.LLM_GATEWAY_URL}/rubric-eval`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rubricPath, artifact }),
    });
    if (!res.ok) throw new Error(`LLM gateway ${res.status}`);
    return (await res.json()) as RubricResult;
  }
}

export const llm: LlmGateway = process.env.LLM_MODE === 'gateway' ? new HttpGateway() : new MockLlm();
