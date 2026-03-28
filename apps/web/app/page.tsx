import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ModeToggle } from "@/components/mode-toggle";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            {/* Simple SVG logo */}
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              className="text-primary"
            >
              <path
                d="M12 2C7 2 4 5 4 10C4 15 7 18 12 22C17 18 20 15 20 10C20 5 17 2 12 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>

            <span className="font-semibold text-lg">Knot</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ModeToggle />

            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-20 space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Record and share videos instantly
        </h1>

        <p className="text-muted-foreground max-w-xl">
          Knot lets you capture your screen and share it in seconds. No setup,
          no friction, just clean recordings.
        </p>

        <div className="flex gap-4">
          <Link href="/dashboard">
            <Button size="lg">Start Recording</Button>
          </Link>

          <Button size="lg" variant="outline" disabled>
            Download App (soon)
          </Button>
        </div>
      </section>

      {/* Preview */}
      <section className="px-6">
        <div className="max-w-5xl mx-auto">
          <Card className="overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <img
                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c"
                alt="App preview"
                className="w-full h-auto object-cover"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Desktop CTA Section */}
      <section className="text-center px-6 py-20 space-y-6">
        <h2 className="text-3xl font-semibold">Built for desktop workflows</h2>

        <p className="text-muted-foreground">
          Record meetings, walkthroughs, and bugs with zero friction.
        </p>

        <Button variant="secondary" disabled>
          Desktop App Coming Soon
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Knot</span>

          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
