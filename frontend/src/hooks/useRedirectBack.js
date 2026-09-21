import { useRouter, useSearchParams } from "next/navigation";

export default function useRedirectBack(defaultPath = "/") {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedURL = searchParams.get("returnURL") || searchParams.get("redirect");
  const returnURL =
    requestedURL?.startsWith("/") && !requestedURL.startsWith("//") && !requestedURL.includes("\\")
      ? requestedURL
      : null;

  return () => {
    router.push(returnURL || defaultPath);
  };
}
