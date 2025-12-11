"use client";

import useAuth from "@/utils/useAuth";
import { useEffect } from "react";

export default function LogoutPage() {
  const { signOut } = useAuth();

  useEffect(() => {
    const handleSignOut = async () => {
      await signOut({
        callbackUrl: "/",
        redirect: true,
      });
    };
    handleSignOut();
  }, [signOut]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4 font-inter">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-[#EAECF0] text-center">
        <h1 className="text-2xl font-semibold text-[#101828]">
          Signing out...
        </h1>
      </div>
    </div>
  );
}
