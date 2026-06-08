import { Hero } from "@/app/_components/hero";
import { Navbar } from "@/app/_components/navbar";
import { Features } from "@/app/_components/features";
import { UseCases } from "@/app/_components/use-cases";
import { Footer } from "@/app/_components/footer";
import { Pricing } from "@/app/_components/pricing";

const Home = () => {
  return (
    <div className="h-screen w-full flex-col justify-center items-center relative">
      <Navbar />
      <Hero />
      <Features />
      <UseCases />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Home;
