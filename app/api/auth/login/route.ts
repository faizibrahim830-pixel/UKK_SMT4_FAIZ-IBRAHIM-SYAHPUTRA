import { NextResponse } from "next/server"
import { setAuthCookie } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createUserJwt, verifyUserPassword } from "@/lib/user-security"

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    const parsedBody: unknown = await request.json()
    if (!parsedBody || typeof parsedBody !== "object") {
      return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 })
    }
    body = parsedBody as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Format request tidak valid." }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const password = typeof body.password === "string" ? body.password : ""
  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 })
  }
  if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32) {
    return NextResponse.json({ error: "JWT_SECRET harus berisi minimal 32 byte." }, { status: 500 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        password: true,
      },
    })

    if (!user || !(await verifyUserPassword(password, user.password))) {
      return NextResponse.json({ error: "Email atau password salah." }, { status: 401 })
    }

    const token = createUserJwt(user)
    const response = NextResponse.json({
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
    })
    setAuthCookie(response, token)
    return response
  } catch (error) {
    console.error("Login failed:", error)
    return NextResponse.json({ error: "Login gagal. Periksa koneksi database." }, { status: 500 })
  }
}