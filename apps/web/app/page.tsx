import { Hero } from "@/app/_components/hero";
import { Navbar } from "@/app/_components/navbar";

const  Home = () => {
  return (
   <div className="h-screen w-full flex justify-center items-center relative">
    <Navbar/>
    <Hero/>
   </div>
  );
}

export default Home;