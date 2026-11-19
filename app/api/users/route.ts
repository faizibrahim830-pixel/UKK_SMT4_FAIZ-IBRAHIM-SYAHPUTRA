import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { hashUserPassword } from "@/lib/user-security"

const userFields = {
  id: true,
  fullname: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const

function isDuplicateEmail(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002"
}

function getAccountCodePrefix(role: string) {
  const normalizedRole = role.toLowerCase()
  if (normalizedRole === "admin") return "ADM"
  if (normalizedRole === "user") return "USR"
  return normalizedRole.toUpperCase().slice(0, 3)
}

async function getAuthorizationError() {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: "Silakan login untuk melanjutkan." }, { status: 401 })
  return null
}

export async function GET(request: Request) {
  const authorizationError = await getAuthorizationError()
  if (authorizationError) return authorizationError

  const searchParams = new URL(request.url).searchParams
  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10)
  const requestedPageSize = Number.parseInt(searchParams.get("pageSize") ?? "10", 10)
  const pageSize = Number.isFinite(requestedPageSize)
    ? Math.min(100, Math.max(1, requestedPageSize))
    : 10

  try {
    const totalUsers = await prisma.user.count()
    const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize))
    const page = Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, totalPages)
      : 1
    const [users, orderedUsers] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: userFields,
      }),
      prisma.user.findMany({
        orderBy: { id: "asc" },
        select: { id: true, role: true },
      }),
    ])
    const roleNumbers = new Map<string, number>([["admin", 0], ["staff", 0]])
    const accountCodes = new Map<number, string>()

    for (const orderedUser of orderedUsers) {
      const normalizedRole = orderedUser.role.toLowerCase()
      const roleNumber = (roleNumbers.get(normalizedRole) ?? 0) + 1
      roleNumbers.set(normalizedRole, roleNumber)
      accountCodes.set(
        orderedUser.id,
        `${getAccountCodePrefix(normalizedRole)}${String(roleNumber).padStart(7, "0")}`
      )
    }

    const numberedUsers = users.map((user) => {
      const accountCode = accountCodes.get(user.id)
      if (accountCode === undefined) throw new Error(`Missing account code for user ${user.id}.`)
      return { ...user, accountCode }
    })
    const nextAccountCodes: Record<string, string> = {}
    for (const [role, roleNumber] of roleNumbers) {
      nextAccountCodes[role] = `${getAccountCodePrefix(role)}${String(roleNumber + 1).padStart(7, "0")}`
    }

    return NextResponse.json({
      users: numberedUsers,
      nextAccountCodes,
      pagination: { page, pageSize, totalUsers, totalPages },
    })
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json({ error: "Gagal memuat data user." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authorizationError = await getAuthorizationError()
  if (authorizationError) return authorizationError

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
  const password = typeof body.password === "string" ? body.password : ""
  const role = typeof body.role === "string" ? body.role : "staff"

  if (!fullname || fullname.length > 191 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 191) {
    return NextResponse.json({ error: "Nama atau email tidak valid." }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password minimal 8 karakter." }, { status: 400 })
  }
  if (role !== "admin" && role !== "staff") {
    return NextResponse.json({ error: "Role tidak valid." }, { status: 400 })
  }

  try {
    const user = await prisma.user.create({
      data: { fullname, email, password: await hashUserPassword(password), role },
      select: userFields,
    })
    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (isDuplicateEmail(error)) {
      return NextResponse.json({ error: "Email sudah digunakan." }, { status: 409 })
    }
    console.error("Failed to create user:", error)
    return NextResponse.json({ error: "Gagal membuat user. Periksa koneksi database." }, { status: 500 })
  }
}
