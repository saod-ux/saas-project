"use client";
import { useFirebaseAuth } from "@/contexts/FirebaseAuthContext";
import { useRouter } from "next/navigation";

export default function AdminUserMenu() {
  const router = useRouter();
  const { user, signOutUser } = useFirebaseAuth();

  const handleLogout = async () => {
    try {
      await signOutUser();
      router.push("/sign-in");
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: redirect manually
      router.push("/sign-in");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">
        {user?.displayName || user?.email || "User"}
      </span>
      <button 
        onClick={handleLogout}
        className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300"
      >
        Logout
      </button>
    </div>
  );
}
