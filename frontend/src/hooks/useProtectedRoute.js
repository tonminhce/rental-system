"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export function useProtectedRoute() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(`/login?returnURL=${pathname}`);
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, router, pathname]);

  return { isLoading };
} 