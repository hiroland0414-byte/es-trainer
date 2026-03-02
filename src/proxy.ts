import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyHubToken } from "@/lib/hubLink";

const APP_COOKIE = "kc_app_auth";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

function isPublicAssetPath(pathname: string) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  // /bg.jpeg /logo.png など拡張子が付く静的ファイル
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 静的アセットは通す（画像まで gate しない）
  if (isPublicAssetPath(pathname)) return NextResponse.next();

  const lpUrl = process.env.LP_URL ?? "";
  const secret = process.env.HUB_LINK_SECRET ?? "";
  const appId = process.env.APP_ID ?? "";

  if (!lpUrl || !secret || !appId) {
    return new NextResponse("Missing env (LP_URL / HUB_LINK_SECRET / APP_ID).", { status: 500 });
  }

  // すでに入場済みならOK（強制ログアウトなし）
  if (req.cookies.get(APP_COOKIE)?.value === "1") return NextResponse.next();

  // LPから来た “通行証” を検証
  const token = req.nextUrl.searchParams.get("kch") ?? "";
  const ok = token ? verifyHubToken(token, secret, appId).ok : false;

  if (!ok) {
const to = new URL(lpUrl);
to.searchParams.set("from", appId); // appId=es-trainer
return NextResponse.redirect(to, 307);
  }

  // OKならアプリ側Cookie発行
  const res = NextResponse.next();
  res.cookies.set(APP_COOKIE, "1", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
  });
  return res;
}

export const config = { matcher: ["/:path*"] };