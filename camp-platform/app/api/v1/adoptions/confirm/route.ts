import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/** SkillHub 侧回调采纳数据（source=SKILLHUB_API），仍需组长在平台内确认后才计入毕业条件 */
export async function POST(req: NextRequest) {
  if (req.headers.get('x-camp-token') !== process.env.CI_SHARED_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const b = (await req.json()) as { skillHubRef: string; adopterDept: string; evidence?: string };
  const asset = await prisma.assetContribution.findFirst({ where: { skillHubRef: b.skillHubRef } });
  if (!asset) return NextResponse.json({ error: 'asset not found' }, { status: 404 });
  await prisma.adoption.create({
    data: { assetId: asset.id, adopterDept: b.adopterDept, source: 'SKILLHUB_API', evidence: b.evidence },
  });
  return NextResponse.json({ ok: true });
}
