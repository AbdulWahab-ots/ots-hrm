"use client";
import Link from "next/link";
import Button from "../common/Button";
import Image from "next/image";
import { Check } from "lucide-react";
import Sucess from "../../public/reset-sucess.svg";
import Sucess2 from "../../public/reset-sucess2.svg";
export default function PasswordSuccess() {
  return (
    <>
      <div className="flex relative  justify-start pr-10 pt-10">
        <Image src="/logo.png" alt="logo" width={271} height={65} className="h-20 w-auto mr-auto" />
      </div>
      <Image
        className="absolute -top-14 xl:block hidden"
        src={Sucess}
        alt="top image"
      />
      <Image
        className="absolute top-[40%] -right-10 xl:block hidden "
        src={Sucess2}
        alt="top image"
      />
      <div className="flex-grow flex flex-col justify-center items-center mx-auto w-full max-w-md space-y-8">
        <div className="relative inline-block">
          <Image
            src="/success.svg"
            alt="success"
            width={95}
            height={95}
            className=""
          />
          <Check
            className="w-10 h-10 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            strokeWidth={3}
          />
        </div>
        <div className="text-center flex flex-col gap-4 items-center">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-semibold ">
            Success
          </h1>

          <p className="text-g-gray-900 text-sm md:text-base">
            Congratulations! Your password has <br></br>
            been changed. Click continue to login
          </p>
        </div>
        <Link href="/sign-in" className="w-full">
          <Button type="button" label="Login" variant="filled" />
        </Link>
      </div>
    </>
  );
}
