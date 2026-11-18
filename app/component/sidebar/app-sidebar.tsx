import { UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar className="border-r-0 [&>div]:bg-blue-900 [&>div]:text-white">
      <div className="flex h-full w-full flex-col bg-blue-900 text-white">
        <SidebarHeader className="bg-blue-900 p-4">
          <div className="flex items-center justify-center px-3 py-2">
            <Image
              src="/img/smk_mvp_ars_logo_white.png"
              alt="SMK MVP ARS Internasional"
              width={200}
              height={200}
              className="h-auto max-h-12 w-auto object-contain"
              priority
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-blue-900">
          <SidebarGroup>
            <SidebarGroupLabel className="mb-2 px-2 text-xs font-semibold text-white/80">
              Menu Utama
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/admin/user-management" />}
                    className="text-white hover:bg-blue-800 hover:text-white active:bg-blue-950"
                  >
                    <UsersRound className="mr-2 size-4" />
                    <span>User Management</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="bg-blue-950" />
      </div>
    </Sidebar>
  );
}
