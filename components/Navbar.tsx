"use client";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/signin");
  };

  if (!user) {
    return null;
  }

  const displayName = user.email?.split("@")[0] || "User";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-emerald-900 to-slate-900 border-b border-white/10 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-full shadow-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              DearMe
            </h1>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* User Avatar */}
            <div className="flex items-center space-x-2 h-9 sm:h-10 px-3 sm:px-4 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/15 transition-colors">
              <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className="hidden sm:inline text-sm font-medium text-white/90">
                {displayName}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center space-x-1.5 sm:space-x-2 h-9 sm:h-10 px-3 sm:px-4 
              bg-white/10 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-teal-500 
              backdrop-blur-sm border border-white/20 hover:border-emerald-400/50 
              text-white text-sm font-medium rounded-full shadow-lg hover:shadow-xl 
              transform hover:scale-105 transition-all duration-200 
              focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
