import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyUserJwt } from "@/lib/user-security"

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  })
}

export async function getAuthenticatedUser() {
  const token = (await cookies()).get("auth_token")?.value
  if (!token) return null

  const payload = verifyUserJwt(token)
  if (!payload) return null

  const userId = Number(payload.sub)
  if (!Number.isSafeInteger(userId) || userId < 1) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, fullname: true, email: true, role: true },
  })
  if (!user) return null

  return {
    id: user.id,
    fullname: user.fullname,
    email: user.email,
    role: user.role,
  }
}
