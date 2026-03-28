interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <main className="h-full w-full flex justify-center items-center">
      {children}
    </main>
  );
};

export default DashboardLayout;
