import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MockUp } from "@/app/_components/mockup";

const Hero = () => {
  return (
    <div
      className="h-full w-full flex justify-center items-center px-[5%]"
      id=""
    >
      <div className="flex-col px-[10%]">
        <p className="text-2xl font-bold flex my-6"> Record. Share. Done.</p>
        <p className="flex ">
          Fast screen recording for teams, demos,feedback, and async
          communication.
        </p>
        <div className="flex py-10 space-x-6">
          <Link href={"/dashboard"}>
            <Button size={"lg"} className="cursor-pointer">
              Start Recording
            </Button>
          </Link>
          <Link href={"/demo"}>
            <Button
              variant={"secondary"}
              size={"lg"}
              className="cursor-pointer"
            >
              Watch Demo
            </Button>
          </Link>
        </div>
      </div>
      <MockUp />
    </div>
  );
};

export { Hero };
