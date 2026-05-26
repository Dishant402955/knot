import { Hero } from "@/app/_components/hero";
import { Navbar } from "@/app/_components/navbar";
import { Features } from "@/app/_components/features";

const  Home = () => {
  return (
   <div className="h-screen w-full flex-col justify-center items-center relative">
    <Navbar/>
    <Hero/>
    <Features/>
   </div>
  );
}

export default Home;