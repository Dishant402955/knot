import { UserProfile } from "@clerk/nextjs";

const SettingsPage = () => {
  return (
    <div className="px-15 pb-15 pt-10 space-y-6">
      <p className="font-bold text-2xl">Settings</p>

      <UserProfile routing="path" path="/dashboard/settings" />
    </div>
  );
};

export default SettingsPage;
