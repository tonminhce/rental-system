"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { useSelector } from "react-redux";
import LoginRedirectPopup from "./LoginRedirectPopup";

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const [showPopup, setShowPopup] = useState(false);

  useLayoutEffect(() => {
    if (!isAuthenticated) {
      setShowPopup(true);
    }
  }, [isAuthenticated, router, pathname]);

  const handleClosePopup = () => {
    setShowPopup(false);
    router.replace(`/login?returnURL=${pathname}`);
  };

  return (
    <>
      <LoginRedirectPopup
        open={showPopup}
        onClose={handleClosePopup}
        message="You need to login to access the landlord portal. You will be redirected to the login page."
      />
      {!showPopup && children}
    </>
  );
}
