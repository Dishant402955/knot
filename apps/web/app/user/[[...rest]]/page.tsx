import { UserProfile } from "@clerk/nextjs";

const UserPage = () => {
  return (
    <div className="h-full w-full flex justify-center items-center">
      <UserProfile />
    </div>
  );
};

export default UserPage;
