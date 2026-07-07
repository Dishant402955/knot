import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/dashboard/_components/app-sidebar";
import { UserButton } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="h-full w-full">
        <SidebarTrigger />
        <div className="fixed top-3 right-6">
          <UserButton />
        </div>
        {children}
      </main>
      <Toaster />
    </SidebarProvider>
  );
};

export default DashboardLayout;
