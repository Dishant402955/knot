import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Pricing = () => {
  return (
    <div
      className="h-full w-full flex justify-center px-[5%] py-24 mb-30"
      id="pricing"
    >
      <div className="flex-col">
        <div className="flex-col justify-center items-center space-y-4">
          <p className="text-4xl font-bold flex justify-center items-center">
            PRICING
          </p>
          <p className="text-2xl flex justify-center items-center">
            {" "}
            Flexibility is out first priority{" "}
          </p>
        </div>
        <div className="my-15 space-x-8 flex justify-center items-center">
          <Card className=" w-90 relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#111111] p-8 text-white shadow-2xl">
            <div>
              <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                Starter
              </div>

              <h3 className="text-3xl font-semibold tracking-tight">Free</h3>

              <p className="mt-3 text-sm leading-6 text-neutral-400">
                Perfect for quick & personal usage.
              </p>

              <div className="mt-8 flex items-end gap-1">
                <span className="text-5xl font-bold">$0</span>
                <span className="mb-1 text-neutral-500">/month</span>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="h-2 w-2 rounded-full bg-neutral-500" />
                  Limited Storage
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="h-2 w-2 rounded-full bg-neutral-500" />
                  Unlimited recordings
                </div>

                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="h-2 w-2 rounded-full bg-neutral-500" />
                  Instant playback
                </div>

                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="h-2 w-2 rounded-full bg-neutral-500" />
                  Shareable links
                </div>
              </div>
            </div>

            <Button className="mt-10 h-12 rounded-2xl bg-white text-black hover:bg-neutral-200">
              Start Free
            </Button>
          </Card>

          <Card className=" w-90 relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#151515] p-8 text-white shadow-[0_0_80px_rgba(255,255,255,0.06)]">
            <div>
              <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                Pro
              </div>

              <h3 className="text-3xl font-semibold tracking-tight">$12</h3>

              <p className="mt-3 text-sm leading-6 text-neutral-400">
                Built for creators, teams.
              </p>

              <div className="mt-8 flex items-end gap-1">
                <span className="text-5xl font-bold">$12</span>
                <span className="mb-1 text-neutral-500">/month</span>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="h-2 w-2 rounded-full bg-neutral-400" />
                  HD recordings
                </div>

                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="h-2 w-2 rounded-full bg-neutral-400" />
                  Unlimited storage
                </div>

                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="h-2 w-2 rounded-full bg-neutral-400" />
                  Team workspaces
                </div>

                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="h-2 w-2 rounded-full bg-neutral-400" />
                  Priority support
                </div>
              </div>
            </div>

            <Button className="mt-10 h-12 rounded-2xl bg-white text-black hover:bg-neutral-200">
              Upgrade to Pro
            </Button>
          </Card>

          <Card className=" w-90 relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-[#111111] p-8 text-white shadow-2xl">
            <div>
              <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                Enterprise
              </div>

              <h3 className="text-3xl font-semibold tracking-tight">Custom</h3>

              <p className="mt-3 text-sm leading-6 text-neutral-400">
                Advanced security and collaboration.
              </p>

              <div className="mt-8">
                <span className="text-5xl font-bold">Custom</span>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="h-2 w-2 rounded-full bg-neutral-500" />
                  SSO & advanced auth
                </div>

                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="h-2 w-2 rounded-full bg-neutral-500" />
                  Admin analytics
                </div>

                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="h-2 w-2 rounded-full bg-neutral-500" />
                  Unlimited team members
                </div>

                <div className="flex items-center gap-3 text-sm text-neutral-300">
                  <div className="h-2 w-2 rounded-full bg-neutral-500" />
                  Dedicated support
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="mt-10 h-12 rounded-2xl border-white/10 bg-transparent text-white hover:bg-white hover:text-black"
            >
              Contact Sales
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export { Pricing };
