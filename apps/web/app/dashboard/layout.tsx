import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/app/dashboard/_components/app-sidebar"


const DashboardLayout = ({children} : {children: React.ReactNode}) => {
    return     <SidebarProvider>
      <AppSidebar />
      <main className="h-full w-full">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
}

export default DashboardLayout