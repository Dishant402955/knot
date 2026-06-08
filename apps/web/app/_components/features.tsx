import { Card, CardContent, CardFooter } from "@/components/ui/card";

const Features = () => {
  return (
    <div
      className="h-full w-full flex justify-center px-[5%] py-24"
      id="features"
    >
      <div className="flex-col">
        <div className="flex-col justify-center items-center space-y-4">
          <p className="text-4xl font-bold flex justify-center items-center">
            FEATURES
          </p>
          <p className="text-2xl flex justify-center items-center">
            Built for async work{" "}
          </p>
        </div>
        <div className="flex justify-center items-center px-2 my-10 space-x-8">
          <Card className="w-100">
            <CardContent>
              <Mock1 />
            </CardContent>

            <CardFooter>Record your screen instantly</CardFooter>
          </Card>

          <Card className="w-100">
            <CardContent>
              <Mock2 />
            </CardContent>

            <CardFooter>
              Watch your recording immediately after stopping.
            </CardFooter>
          </Card>

          <Card className="w-100">
            <CardContent>
              <Mock3 />
            </CardContent>

            <CardFooter>Share a single link with anyone instantly.</CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export { Features };

const Mock1 = () => {
  return (
    <svg
      width="350"
      height="240"
      viewBox="0 0 350 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="350" height="240" rx="28" fill="#0F0F10" />

      <rect
        x="28"
        y="28"
        width="294"
        height="184"
        rx="18"
        fill="#141415"
        stroke="#262626"
      />

      <rect x="28" y="28" width="294" height="40" rx="18" fill="#18181B" />

      <circle cx="52" cy="48" r="4" fill="#525252" />
      <circle cx="68" cy="48" r="4" fill="#525252" />
      <circle cx="84" cy="48" r="4" fill="#525252" />

      <circle cx="255" cy="48" r="5" fill="#737373" />
      <text
        x="268"
        y="53"
        fill="#A3A3A3"
        fontSize="11"
        fontFamily="Inter, sans-serif"
      >
        REC
      </text>

      <rect x="42" y="84" width="54" height="100" rx="12" fill="#1B1B1D" />

      <rect x="54" y="98" width="30" height="6" rx="3" fill="#2E2E32" />
      <rect x="54" y="116" width="22" height="6" rx="3" fill="#2E2E32" />
      <rect x="54" y="134" width="28" height="6" rx="3" fill="#2E2E32" />

      <rect x="118" y="86" width="170" height="12" rx="6" fill="#2A2A2D" />

      <rect x="118" y="112" width="142" height="8" rx="4" fill="#242427" />

      <rect x="118" y="128" width="120" height="8" rx="4" fill="#242427" />

      <rect
        x="118"
        y="152"
        width="154"
        height="40"
        rx="10"
        fill="#1A1A1C"
        stroke="#2A2A2D"
      />
    </svg>
  );
};

const Mock2 = () => {
  return (
    <svg
      width="350"
      height="240"
      viewBox="0 0 350 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="350" height="240" rx="28" fill="#0F0F10" />

      <rect
        x="32"
        y="36"
        width="286"
        height="168"
        rx="22"
        fill="#141415"
        stroke="#262626"
      />

      <rect x="52" y="56" width="246" height="92" rx="16" fill="#1B1B1D" />

      <circle cx="175" cy="102" r="22" fill="#232326" />

      <path d="M168 91L186 102L168 113V91Z" fill="#A3A3A3" />

      <rect x="58" y="168" width="220" height="6" rx="3" fill="#232326" />

      <rect x="58" y="168" width="142" height="6" rx="3" fill="#6B6B6B" />

      <text
        x="245"
        y="192"
        fill="#8A8A8A"
        fontSize="11"
        fontFamily="Inter, sans-serif"
      >
        01:28
      </text>

      <rect x="58" y="186" width="82" height="22" rx="11" fill="#1D1D20" />

      <text
        x="74"
        y="201"
        fill="#B0B0B0"
        fontSize="10"
        fontFamily="Inter, sans-serif"
      >
        Ready Instantly
      </text>
    </svg>
  );
};

const Mock3 = () => {
  return (
    <svg
      width="350"
      height="240"
      viewBox="0 0 350 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="350" height="240" rx="28" fill="#0F0F10" />

      <rect
        x="34"
        y="40"
        width="282"
        height="160"
        rx="22"
        fill="#141415"
        stroke="#262626"
      />

      <rect x="56" y="66" width="238" height="42" rx="14" fill="#1B1B1D" />

      <circle cx="76" cy="87" r="6" fill="#6B6B6B" />

      <text
        x="92"
        y="92"
        fill="#B0B0B0"
        fontSize="11"
        fontFamily="Inter, sans-serif"
      >
        app.io/r/8x2kLmP
      </text>

      <circle cx="175" cy="150" r="38" stroke="#4A4A4A" strokeWidth="2" />

      <path d="M137 150H213" stroke="#4A4A4A" strokeWidth="2" />

      <path
        d="M175 112C188 124 188 176 175 188"
        stroke="#4A4A4A"
        strokeWidth="2"
      />

      <path
        d="M175 112C162 124 162 176 175 188"
        stroke="#4A4A4A"
        strokeWidth="2"
      />

      <path
        d="M145 132C160 138 190 138 205 132"
        stroke="#4A4A4A"
        strokeWidth="2"
      />

      <path
        d="M145 168C160 162 190 162 205 168"
        stroke="#4A4A4A"
        strokeWidth="2"
      />

      <circle cx="96" cy="150" r="5" fill="#6B6B6B" />
      <circle cx="254" cy="150" r="5" fill="#6B6B6B" />

      <line
        x1="101"
        y1="150"
        x2="137"
        y2="150"
        stroke="#3A3A3A"
        strokeWidth="2"
      />

      <line
        x1="213"
        y1="150"
        x2="249"
        y2="150"
        stroke="#3A3A3A"
        strokeWidth="2"
      />
    </svg>
  );
};
