'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type User = {
  id: number
  fullname: string
  email: string
  role: string
  createdAt: string
}

type Pagination = {
  page: number
  pageSize: number
  totalUsers: number
  totalPages: number
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let isActive = true

    async function loadUsers() {
      setIsLoading(true)
      setError("")
      try {
        const response = await fetch(`/api/users?page=${page}&pageSize=10`)
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? "Gagal memuat user.")
        if (isActive) {
          setUsers(result.users)
          setPagination(result.pagination)
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat user.")
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadUsers()
    return () => {
      isActive = false
    }
  }, [page])

  async function deleteUser(user: User) {
    if (!window.confirm(`Hapus user ${user.fullname}?`)) return

    setDeletingUserId(user.id)
    setError("")
    try {
      const response = await fetch(`/api/users/${user.id}`, { method: "DELETE" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Gagal menghapus user.")
      if (users.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1)
      } else {
        setUsers((currentUsers) => currentUsers.filter((currentUser) => currentUser.id !== user.id))
        setPagination((currentPagination) => currentPagination
          ? {
              ...currentPagination,
              totalUsers: Math.max(0, currentPagination.totalUsers - 1),
              totalPages: Math.max(1, Math.ceil((currentPagination.totalUsers - 1) / currentPagination.pageSize)),
            }
          : currentPagination)
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus user.")
    } finally {
      setDeletingUserId(null)
    }
  }

  return (
    <Card className="m-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">Kelola akun dan akses pengguna.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/user-management/form/add" />}>
            <Plus aria-hidden="true" />
            Tambah user
        </Button>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}

      <Table className="mt-5">
        <TableCaption>
          {pagination ? `${pagination.totalUsers} user` : "Daftar user"}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nama lengkap</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Dibuat</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Memuat user...</TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Belum ada user.</TableCell>
            </TableRow>
          ) : users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.fullname}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell className="capitalize">{user.role}</TableCell>
              <TableCell>{new Date(user.createdAt).toLocaleDateString("id-ID")}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    nativeButton={false}
                    render={<Link href={`/admin/user-management/form/${user.id}`} />}
                    size="icon"
                    variant="outline"
                    aria-label={`Edit ${user.fullname}`}
                  >
                      <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    aria-label={`Hapus ${user.fullname}`}
                    disabled={deletingUserId === user.id}
                    onClick={() => void deleteUser(user)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Halaman {pagination?.page ?? page} dari {pagination?.totalPages ?? 1}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          >
            Sebelumnya
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!pagination || page >= pagination.totalPages || isLoading}
            onClick={() => setPage((currentPage) => currentPage + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </Card>
  )
}
