import { UserButton } from "@clerk/nextjs";

const Home = () => {
  return (
    <div className="h-full w-full flex justify-center items-center text-4xl">
      <UserButton userProfileMode="navigation" userProfileUrl="/user" />
    </div>
  );
};

export default Home;
