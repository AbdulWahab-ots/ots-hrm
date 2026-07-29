"use client";

import Image from "next/image";
import React from "react";
import { useRouter } from "next/navigation";
import initializing from "../../../../public/initiallizing.svg";
import animoji6 from "../../../../public/animoji-6.svg";
import animoji7 from "../../../../public/animoji-7.svg";
import Ellipse from "../../../../public/Ellipse.svg";

const InitializingPage = () => {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/admin/onboarding/department");
  };

  return (
    <div className="relative flex min-h-screen justify-center items-center">
      <div className="absolute top-0">
        <Image src={initializing} alt="initializing image" />
      </div>
      <div className="flex mt-20 flex-col justify-center">
        <h1 className="lg:text-[60px] text-center sm:text-heading-40 text-3xl font-semibold text-g-gray-1000">
          Your just few clicks away to <br /> manage you employees
        </h1>
        <p className="pt-6 text-g-gray-900 text-center text-[20px] font-medium">
          Let’s create pre repositories for seamless experience
        </p>
        <div className="flex justify-center pt-14">
          <button
            className="bg-g-blue-700 text-white cursor-pointer rounded-[var(--g-radius-full)] py-6 px-8 transition-transform duration-200 ease-in-out hover:scale-105 hover:bg-g-blue-800 hover:shadow-lg active:scale-95 focus-ring-geist"
            onClick={handleGetStarted}
          >
            Get Started
          </button>
        </div>
      </div>
      <div className="absolute lg:block hidden right-10 bottom-10">
        <Image src={animoji6} alt="animoji6 image" />
      </div>
      <div className="absolute lg:block hidden -left-36 bottom-56">
        <Image src={Ellipse} alt="Ellipse image" />
      </div>
      <div className="absolute left-64 bottom-3">
        <Image src={animoji7} alt="animoji image" />
      </div>
    </div>
  );
};

export default InitializingPage;
