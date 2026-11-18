
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { AppSidebar } from "@/app/component/sidebar/app-sidebar";
import { LogoutMenuItem } from "@/app/admin/logout-menu-item";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAuthenticatedUser } from "@/lib/auth";

export const instant = false;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const user = await getAuthenticatedUser();

  if (!user) redirect("/");

  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="w-full flex-1 overflow-x-hidden">
        <SidebarInset />

        <header className="flex items-center justify-between p-4">
          <SidebarTrigger />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <Avatar>
                    <AvatarImage
                      src="/img/foto1.jpeg"
                      alt={user.fullname}
                    />
                    <AvatarFallback>
                      {user.fullname.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              }
            />

            <DropdownMenuContent className="w-32">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  {user.fullname}
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />
              <LogoutMenuItem />
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {children}
      </main>
    </SidebarProvider>
  );
}
  