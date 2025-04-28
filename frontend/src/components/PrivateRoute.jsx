"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function PrivateRoute(Component) {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

    useEffect(() => {
      if (!isAuthenticated) {
        router.replace(`/login?returnURL=${pathname}`);
      }
    }, [isAuthenticated, router, pathname]);

    return <Component {...props} />;
  };
}
