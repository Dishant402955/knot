import { Logo } from "@/components/logo"

const Footer = () => {
    return <div className="w-full h-fit bg-neutral-900 flex-col px-10 py-4 space-y-2"> 
    
    <Logo/>
    <p className="px-2">Screen recording for fast async communication.</p>

    <div className="flex items-center my-16 space-x-22 px-2 ">
        <div className="flex-col">
            <p className="mb-4">Product</p>
            <p>Features</p>
            <p>Desktop App</p>
            <p>Pricing</p>
        </div>
        <div className="flex-col">
            <p className="mb-4">Resources</p>
            <p>Docs</p>
            <p>Changelog</p>
            <p>Support</p>
        </div>
        <div className="flex-col">
            <p className="mb-4">Socials</p>
            <p>Twitter</p>
            <p>GitHub</p>
            <p>LinkedIn</p>
        </div>
    </div>
    
    <p>© 2026 Dishant </p>
    <p>Built for async teams  </p>
    </div>
}

export {Footer}