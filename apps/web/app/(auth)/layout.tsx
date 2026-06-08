import { Logo } from "@/components/logo";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="h-screen w-full flex justify-center items-center">
      <Logo classname="fixed top-4 left-6" />
      {children}
    </main>
  );
};

export default AuthLayout;
