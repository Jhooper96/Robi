import { useState } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import Header from "./Header";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col fixed inset-y-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-white z-50">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Mobile top navigation */}
      <MobileNav onMenuClick={() => setSidebarOpen(true)} />

      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Desktop header with Robi avatar */}
        <Header />
        <main className="flex-1 pt-4 md:pt-8 pb-10 px-4 md:px-8 overflow-auto mt-16 md:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
