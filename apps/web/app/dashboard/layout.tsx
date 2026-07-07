import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/dashboard/_components/app-sidebar";
import { UserButton } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex min-h-svh w-full flex-col">
          <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
            <SidebarTrigger className="cursor-pointer" />

            <UserButton />
          </header>

          <div className="flex-1">{children}</div>

          <Toaster />
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
};

export default DashboardLayout;
