"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export const BackButton = () => {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={()=> router.back}
      aria-label="戻る"
      className="inline-flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white"
    >
      <ChevronLeft size={16} strokeWidth={2} />
    </button>
  );
};