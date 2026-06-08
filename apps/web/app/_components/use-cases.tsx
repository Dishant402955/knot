import { Card, CardContent, CardFooter } from "@/components/ui/card";

const UseCases = () => {
  return (
    <div
      className="h-full w-full flex justify-center px-[5%] py-24"
      id="use-cases"
    >
      <div className="flex-col">
        <div className="flex-col justify-center items-center space-y-4">
          <p className="text-4xl font-bold flex justify-center items-center">
            USE CASES
          </p>
          <p className="text-2xl flex justify-center items-center">
            {" "}
            Made for modern async teams{" "}
          </p>
        </div>
        <div className="my-15 space-x-8 flex justify-center items-center">
          <Card className="w-80">
            <CardContent>
              <Mock1 />
            </CardContent>

            <CardFooter>
              Share quick progress updates without meetings.
            </CardFooter>
          </Card>

          <Card className="w-80">
            <CardContent>
              <Mock2 />
            </CardContent>

            <CardFooter>
              Walk through features and explain workflows fast.
            </CardFooter>
          </Card>

          <Card className="w-80">
            <CardContent>
              <Mock3 />
            </CardContent>

            <CardFooter>
              Record issues visually instead of writing essays.
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export { UseCases };

const Mock1 = () => {
  return (
    <svg
      width="350"
      height="220"
      viewBox="0 0 350 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="350" height="220" rx="28" fill="#0F0F10" />

      <rect
        x="36"
        y="34"
        width="278"
        height="152"
        rx="22"
        fill="#141415"
        stroke="#262626"
      />

      <circle cx="104" cy="98" r="24" fill="#232326" />
      <circle cx="175" cy="82" r="28" fill="#2A2A2D" />
      <circle cx="246" cy="98" r="24" fill="#232326" />

      <circle cx="104" cy="90" r="9" fill="#666" />
      <circle cx="175" cy="72" r="11" fill="#7A7A7A" />
      <circle cx="246" cy="90" r="9" fill="#666" />

      <path d="M90 112C94 102 114 102 118 112" fill="#666" />
      <path d="M157 98C164 84 186 84 193 98" fill="#7A7A7A" />
      <path d="M232 112C236 102 256 102 260 112" fill="#666" />

      <rect x="82" y="138" width="186" height="14" rx="7" fill="#232326" />

      <rect x="118" y="160" width="114" height="10" rx="5" fill="#1D1D20" />
    </svg>
  );
};

const Mock2 = () => {
  return (
    <svg
      width="350"
      height="220"
      viewBox="0 0 350 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="350" height="220" rx="28" fill="#0F0F10" />

      <rect
        x="30"
        y="30"
        width="290"
        height="160"
        rx="22"
        fill="#141415"
        stroke="#262626"
      />

      <rect x="30" y="30" width="290" height="42" rx="22" fill="#18181B" />

      <circle cx="54" cy="51" r="4" fill="#555" />
      <circle cx="70" cy="51" r="4" fill="#555" />
      <circle cx="86" cy="51" r="4" fill="#555" />

      <rect x="58" y="92" width="150" height="12" rx="6" fill="#2A2A2D" />

      <rect x="58" y="116" width="110" height="8" rx="4" fill="#232326" />

      <rect x="58" y="132" width="130" height="8" rx="4" fill="#232326" />

      <rect x="222" y="92" width="62" height="62" rx="18" fill="#1E1E21" />

      <circle cx="253" cy="123" r="18" fill="#2A2A2D" />

      <path d="M248 115L261 123L248 131V115Z" fill="#A3A3A3" />
    </svg>
  );
};

const Mock3 = () => {
  return (
    <svg
      width="350"
      height="220"
      viewBox="0 0 350 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="350" height="220" rx="28" fill="#0F0F10" />

      <rect
        x="38"
        y="32"
        width="274"
        height="156"
        rx="22"
        fill="#141415"
        stroke="#262626"
      />

      <rect x="62" y="58" width="226" height="42" rx="14" fill="#1C1C1F" />

      <circle cx="84" cy="79" r="7" fill="#6F6F6F" />

      <rect x="100" y="72" width="122" height="8" rx="4" fill="#3A3A3A" />

      <rect x="100" y="86" width="82" height="6" rx="3" fill="#2A2A2D" />

      <rect x="62" y="118" width="226" height="46" rx="14" fill="#1A1A1C" />

      <path
        d="M206 128L220 150L226 142L236 154"
        stroke="#777"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="90" cy="140" r="5" fill="#4A4A4A" />
      <rect x="104" y="136" width="72" height="8" rx="4" fill="#2A2A2D" />
    </svg>
  );
};
