import { NextRequest, NextResponse } from 'next/server';
import { syncCurriculum } from '@/lib/curriculum-sync';

/** landing-zone 仓库 main 分支更新时由 CI/webhook 调用 */
export async function POST(req: NextRequest) {
  if (req.headers.get('x-camp-token') !== process.env.CI_SHARED_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const { commit } = (await req.json().catch(() => ({}))) as { commit?: string };
  const r = await syncCurriculum(commit || 'webhook');
  return NextResponse.json({ ok: true, ...r });
}
