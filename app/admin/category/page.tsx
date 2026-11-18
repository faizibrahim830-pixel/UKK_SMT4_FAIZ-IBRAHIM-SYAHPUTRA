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

type Category = {
  id: number
  name: string
  createdAt: string
}

type Pagination = {
  page: number
  pageSize: number
  totalCategories: number
  totalPages: number
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let isActive = true

    async function loadCategories() {
      setIsLoading(true)
      setError("")
      try {
        const response = await fetch(`/api/categories?page=${page}&pageSize=10`)
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? "Gagal memuat kategori.")
        if (isActive) {
          setCategories(result.categories)
          setPagination(result.pagination)
        }
      } catch (loadError) {
        if (isActive) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat kategori.")
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void loadCategories()
    return () => {
      isActive = false
    }
  }, [page])

  async function deleteCategory(category: Category) {
    if (!window.confirm(`Hapus kategori ${category.name}?`)) return

    setDeletingCategoryId(category.id)
    setError("")
    try {
      const response = await fetch(`/api/categories/${category.id}`, { method: "DELETE" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Gagal menghapus kategori.")
      if (categories.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1)
      } else {
        setCategories((currentCategories) => currentCategories.filter(
          (currentCategory) => currentCategory.id !== category.id
        ))
        setPagination((currentPagination) => currentPagination
          ? {
              ...currentPagination,
              totalCategories: Math.max(0, currentPagination.totalCategories - 1),
              totalPages: Math.max(
                1,
                Math.ceil((currentPagination.totalCategories - 1) / currentPagination.pageSize)
              ),
            }
          : currentPagination)
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus kategori.")
    } finally {
      setDeletingCategoryId(null)
    }
  }

  return (
    <Card className="m-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Category Management</h1>
          <p className="text-sm text-muted-foreground">Kelola kategori di sini.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/category/form/add" />}>
          <Plus aria-hidden="true" />
          Tambah kategori
        </Button>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}

      <Table className="mt-5">
        <TableCaption>
          {pagination ? `${pagination.totalCategories} kategori` : "Daftar kategori"}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nama kategori</TableHead>
            <TableHead>Dibuat</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">Memuat kategori...</TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">Belum ada kategori.</TableCell>
            </TableRow>
          ) : categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>{new Date(category.createdAt).toLocaleDateString("id-ID")}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    nativeButton={false}
                    render={<Link href={`/admin/category/form/${category.id}`} />}
                    size="icon"
                    variant="outline"
                    aria-label={`Edit ${category.name}`}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    aria-label={`Hapus ${category.name}`}
                    disabled={deletingCategoryId === category.id}
                    onClick={() => void deleteCategory(category)}
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
