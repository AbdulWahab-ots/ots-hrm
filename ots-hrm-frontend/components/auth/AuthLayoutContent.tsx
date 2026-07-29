import Image from "next/image";
import React from "react";

type LeftSideContentProps = {
  title: string;
  description: string;
};

function AuthLayoutContent({ title, description }: LeftSideContentProps) {
  return (
    <div className=" relative hidden lg:flex w-full bg-primary-dark-gray flex-col items-center justify-center overflow-hidden rounded-[var(--g-radius-lg)] col-span-1 md:col-span-2 lg:col-span-2">
      {/* top left */}
      <div className="absolute top-36 left-16 flex items-center justify-center overflow-hidden animate-bounce">
        <Image src="/animoji-3.svg" alt="" width={140} height={140} />
      </div>

      {/* top center */}
      <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 flex items-center justify-center overflow-hidden animate-slideInLeft">
        <Image src="/animoji-1.svg" alt="" width={250} height={250} />
      </div>

      {/* top right */}
      <div className="absolute top-16 right-16 flex items-center justify-center overflow-hidden animate-zoomOut">
        <Image src="/animoji-2.svg" alt="" width={150} height={150} />
      </div>

      {/* bottom right */}
      <div className="absolute bottom-16 -right-7 flex items-center justify-center overflow-hidden animate-slideInRight">
        <Image src="/animoji-4.svg" alt="" width={160} height={160} />
      </div>

      {/* bottom left */}
      <div className="absolute -bottom-2 -left-2 flex items-center justify-center overflow-hidden animate-scaleUp">
        <Image src="/animoji-5.svg" alt="" width={350} height={350} />
      </div>

      {/* contetnt */}
      <div className="text-center z-10 max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
          {title}
        </h1>
      </div>

      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center z-10">
        <p className="text-gray-300 text-lg font-medium max-w-md">
          {description}
        </p>
      </div>
    </div>
  );
}

export default AuthLayoutContent;
