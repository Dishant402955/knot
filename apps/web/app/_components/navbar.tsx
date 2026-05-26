import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const Navbar = () => {
    return     <nav className="fixed top-4 left-[10%] w-[80%] h-16 bg-neutral-800/90 px-15 flex items-center justify-between rounded-lg">

    <Logo/>

    <div className="flex h-full w-fit px-5 justify-center items-center gap-x-7">
      <Link href={"/#"} className="hover:bg-neutral-700 px-3 py-1 rounded-sm">Home</Link>
      <Link href={"/#features"} className="hover:bg-neutral-700 px-3 py-1 rounded-sm">Features</Link>
      <Link href={"/#use-cases"} className="hover:bg-neutral-700 px-3 py-1 rounded-sm"> Use cases</Link>
      <Link href={"/#pricing"} className="hover:bg-neutral-700 px-3 py-1 rounded-sm">Pricing</Link>
    </div>

    <Link href={"/login"} ><Button className="cursor-pointer" size={"lg"}>Login</Button></Link>

    </nav>

}

export {Navbar}