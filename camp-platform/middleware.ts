import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 仅做会话存在性检查；真正的 JWT 校验在服务端组件的 getSession() 中完成
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/change-password') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }
  const token = req.cookies.get('camp_session')?.value;
  if (!token) return NextResponse.redirect(new URL('/login', req.url));

  // 强制改密：解析 JWT payload 中的 mustChangePassword（不验签，验签在服务端做）
  // 若标记为 true，除改密页外一律拉回改密页，保证无法绕过
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    if (payload?.mustChangePassword === true) {
      return NextResponse.redirect(new URL('/change-password', req.url));
    }
  } catch {
    // payload 解析失败说明 token 不合法，让服务端 getSession 兜底处理
  }

  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static).*)'] };
