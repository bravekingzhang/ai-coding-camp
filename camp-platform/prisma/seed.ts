import { PrismaClient, Role, Cert } from '@prisma/client';
import { syncCurriculum } from '../lib/curriculum-sync';
import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();

const DEMO_PASS = 'Camp@2026';

async function main() {
  // 1) 一期 + 小组
  const cohort = await prisma.cohort.upsert({
    where: { id: 'cohort-1' },
    create: { id: 'cohort-1', name: '第 1 期', startsAt: new Date(), status: 'RUNNING' },
    update: { status: 'RUNNING' },
  });
  const groupNames = ['小组1', '小组2', '小组3', '小组4', '小组5', '小组6', '南京1', '上海1'];
  const groups = [];
  for (const name of groupNames) {
    groups.push(await prisma.group.upsert({
      where: { id: `g-${name}` },
      create: { id: `g-${name}`, cohortId: cohort.id, name },
      update: {},
    }));
  }

  // 2) 演示用户：营长 00001 / 教练 90001 / 学员 10001~10008
  // 全部设初始密码 Camp@2026（hash），mustChangePassword=false（演示免打扰）
  // 营长/教练不编入小组（管理/教练身份默认不入组，避免混入学员列表与风险名单）
  const mkUser = async (empId: string, name: string, dept: string, roles: Role[]) => {
    const u = await prisma.user.upsert({
      where: { empId },
      create: { empId, name, dept, passwordHash: hashPassword(DEMO_PASS), mustChangePassword: false },
      update: { passwordHash: hashPassword(DEMO_PASS), mustChangePassword: false },
    });
    for (const role of roles) {
      await prisma.userRole.upsert({ where: { userId_role: { userId: u.id, role } }, create: { userId: u.id, role }, update: {} });
    }
    return u;
  };
  await mkUser('00001', '营长·示例', '训练营运营组', [Role.CAMP_ADMIN, Role.PLATFORM_ADMIN, Role.COACH]);
  await mkUser('90001', '教练·先锋', 'A中心研发一部', [Role.COACH, Role.REVIEW_BOARD]);
  const learners = [] as { id: string }[];
  for (let i = 0; i < 8; i++) {
    learners.push(await mkUser(`1000${i + 1}`, `学员${i + 1}`, i % 2 ? 'B中心研发二部' : 'A中心研发一部', [Role.LEARNER]));
  }

  // 3) Enrollment（仅学员入营；营长/教练不入组）
  const enroll = async (userId: string, groupId: string) =>
    prisma.enrollment.upsert({
      where: { userId_cohortId: { userId, cohortId: cohort.id } },
      create: { userId, cohortId: cohort.id, groupId },
      update: {},
    });
  for (let i = 0; i < learners.length; i++) await enroll(learners[i].id, groups[i % groups.length].id);

  // 4) 认证规则（声明式，随时可在 DB 调整而不发版）
  const rules: [Cert, object][] = [
    [Cert.C1, { labs: 'all_yellow' }],
    [Cert.C2, { labs: 'all_yellow', project: { code: 'P1', min: 'YELLOW' }, reviews_given: { gte: 2 } }],
    [Cert.C3, { labs: 'all_yellow', project: { code: 'P2', min: 'YELLOW' }, adoptions: { gte: 1 } }],
    [Cert.C4, { project: { code: 'P3', min: 'YELLOW' } }],
  ];
  for (const [certLevel, conditions] of rules) {
    await prisma.certRule.upsert({ where: { certLevel }, create: { certLevel, conditions }, update: { conditions } });
  }

  // 5) 部门工具登记表（示例行，对应框架 3.1）
  await prisma.toolRegistry.upsert({
    where: { dept: 'A中心研发一部' },
    create: { dept: 'A中心研发一部', defaultTool: 'Claude Code', quirks: '无' }, update: {},
  });
  await prisma.toolRegistry.upsert({
    where: { dept: 'B中心研发二部' },
    create: { dept: 'B中心研发二部', defaultTool: 'Qoder', quirks: './qoder/rules/ 与 AGENTS.md 需双生效' }, update: {},
  });

  // 6) 从 landing-zone-camp/curriculum.yaml 导入关卡
  const r = await syncCurriculum('seed');
  console.log(`seed done: cohort=${cohort.name}, labs=${r.total}`);
}

main().finally(() => prisma.$disconnect());
