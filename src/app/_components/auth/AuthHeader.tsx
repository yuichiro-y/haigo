import Image from "next/image";
import { BackButton } from "../Button/BackButton";

export const AuthHeader = () => {
  return (
    <header className="relative mx-auto flex w-full max-w-500 items-center px-4 py-5">
      <BackButton />
      <Image
        src="/images/haigo-logo-auth.svg"
        alt="HAIGO"  
        width={113}
        height={37}
        priority
        className="absolute left-1/2 -translate-x-1/2"
      />
    </header>
  );
};