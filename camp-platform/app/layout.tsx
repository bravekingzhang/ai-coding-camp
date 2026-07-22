import './globals.css';
import Link from 'next/link';
import { getSession, getActiveEnrollment } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logout } from './logout/actions';

export const metadata = { title: 'AI Coding Camp' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isCoach = session?.roles.some((r) => ['COACH', 'REVIEW_BOARD', 'CAMP_ADMIN', 'PLATFORM_ADMIN'].includes(r));
  const isAdmin = session?.roles.some((r) => ['CAMP_ADMIN', 'PLATFORM_ADMIN'].includes(r));

  // 待评审数（仅对有 enrollment 的用户查询）
  let pendingReviews = 0;
  if (session) {
    const enr = await getActiveEnrollment(session.userId);
    if (enr) {
      pendingReviews = await prisma.reviewAssignment.count({ where: { reviewerId: enr.id, status: 'PENDING' } });
    }
  }

  return (
    <html lang="zh-CN">
      <body>
        <nav className="bg-slate-900 text-slate-100 px-6 py-3 flex items-center gap-6 text-sm">
          <Link href="/" className="font-bold text-base">⛺ AI Coding Camp</Link>
          {session && (
            <>
              <Link href="/" className="hover:text-white">关卡地图</Link>
              <Link href="/onboarding" className="hover:text-white">新手引导</Link>
              <Link href="/reviews" className="hover:text-white">
                我的评审{pendingReviews > 0 && <span className="ml-1 bg-amber-400 text-slate-900 rounded-full px-1.5 text-xs font-bold">{pendingReviews}</span>}
              </Link>
              <Link href="/assets" className="hover:text-white">我的资产</Link>
              <Link href="/cohort" className="hover:text-white">全营看板</Link>
              {isCoach && <Link href="/coach" className="text-amber-300 hover:text-amber-200">教练台</Link>}
              {isAdmin && <Link href="/admin" className="text-amber-300 hover:text-amber-200">管理</Link>}
              <span className="ml-auto text-slate-400">{session.name}（{session.empId}）</span>
              <form action={logout}><button className="text-slate-400 hover:text-white border border-slate-700 rounded px-2 py-0.5">退出</button></form>
            </>
          )}
        </nav>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
