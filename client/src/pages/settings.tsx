import MainLayout from "@/components/layout/MainLayout";
import ConstructionAnimation from "@/components/under-construction/ConstructionAnimation";

export default function Settings() {
  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <ConstructionAnimation 
          title="System Settings"
          message="This section will allow you to configure the application and user preferences. You'll be able to customize notifications, manage user access, and connect to external services." 
        />
      </div>
    </MainLayout>
  );
}