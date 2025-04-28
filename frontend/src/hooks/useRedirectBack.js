import { useRouter, useSearchParams } from "next/navigation";

export default function useRedirectBack(defaultPath = "/") {
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnURL = searchParams.get("returnURL");

  return () => {
    router.push(returnURL || defaultPath);
  };
}
