import FullscreenLoading from "@/components/FullscreenLoading";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const PropertiesPage = dynamic(() => import("@/components/GetPropertiesPage"), {
  ssr: false,
});

export default function RentPage() {
  return (
    <Suspense fallback={<FullscreenLoading loading={true} />}>
      <PropertiesPage transaction_type="rent" />;
    </Suspense>
  );
}
