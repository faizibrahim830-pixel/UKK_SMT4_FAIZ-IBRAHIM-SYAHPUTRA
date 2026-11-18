
import { NextResponse } from "next/server"
import { getAuthenticatedUser, setAuthCookie } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createUserJwt, hashUserPassword } from "@/lib/user-security"

const userFields = {
  id: true,
  fullname: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const

type RouteContext = { params: Promise<{ id: string }> }

function isDuplicateEmail(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002"
}

function isMissingUser(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025"
}

async function getUserId(context: RouteContext) {
  const { id } = await context.params
  const userId = Number(id)
  return Number.isSafeInteger(userId) && userId > 0 ? userId : null
}

async function getAuthorizationError() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  return null
}

export async function GET(_request: Request, context: RouteContext) {
  const authorizationError = await getAuthorizationError()
  if (authorizationError) return authorizationError

  const userId = await getUserId(context)
  if (!userId) return NextResponse.json({ error: "ID user tidak valid." }, { status: 400 })

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userFields,
    })

    if (!user) return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 })

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Failed to fetch user:", error)
    return NextResponse.json({ error: "Gagal memuat data user." }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authenticatedUser = await getAuthenticatedUser()

  if (!authenticatedUser) {
    return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  }

  const userId = await getUserId(context)
  if (!userId) return NextResponse.json({ error: "ID user tidak valid." }, { status: 400 })

  let body: Record<string, unknown>

  try {
    const parsedBody: unknown = await request.json()

    if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
      return NextResponse.json({ error: "Format request tidak valid." }, { status: 400 })
    }

    body = parsedBody as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Format request tidak valid." }, { status: 400 })
  }

  const fullname = typeof body.fullname === "string" ? body.fullname.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  const role = typeof body.role === "string" ? body.role : ""
  const password = typeof body.password === "string" ? body.password : ""

  if (!fullname || fullname.length > 191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) {
    return NextResponse.json({ error: "Nama atau email tidak valid." }, { status: 400 })
  }

  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Role tidak valid." }, { status: 400 })
  }

  if (password && password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.update({
        where: { id: userId },
        data: {
          fullname,
          email,
          role,
          ...(password ? { password: await hashUserPassword(password) } : {}),
        },
        select: userFields,
      })

      if (userId !== authenticatedUser.id) {
        return { user, token: null }
      }

      const token = createUserJwt(user)

      return { user, token }
    })

    const response = NextResponse.json({ user: result.user })

    if (result.token) {
      setAuthCookie(response, result.token)
    }

    return response
  } catch (error) {
    if (isDuplicateEmail(error)) {
      return NextResponse.json({ error: "Email sudah digunakan." }, { status: 409 })
    }

    if (isMissingUser(error)) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 })
    }

    console.error("Failed to update user:", error)

    return NextResponse.json(
      { error: "Gagal memperbarui user. Periksa koneksi database." },
      { status: 500 }
    )
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authorizationError = await getAuthorizationError()
  if (authorizationError) return authorizationError

  const userId = await getUserId(context)
  if (!userId) return NextResponse.json({ error: "ID user tidak valid." }, { status: 400 })

  try {
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (isMissingUser(error)) {
      return NextResponse.json({ error: "User tidak ditemukan." }, { status: 404 })
    }

    console.error("Failed to delete user:", error)

    return NextResponse.json({ error: "Gagal menghapus user." }, { status: 500 })
  }
}
