import React from "react";

import Wizard from "../wizard";
import Image from "next/image";
import SuccessIcon from "../../../../public/SuccessIcon.svg";
interface SuccessProps {
  children?: React.ReactNode; // Allows any valid React children (elements, strings, etc.)
}
const OnBoardingSuccess: React.FC<SuccessProps> = ({ children }) => {
  return (
    <>
      <Wizard>
        <div className="mt-6 flex flex-col gap-10 justify-center">
          <div className="flex justify-center">
            <Image src={SuccessIcon} alt="Success icon" />
          </div>
          <h2 className="lg:text-[60px] text-center sm:text-heading-40 text-4xl font-semibold text-g-gray-1000">
            {children}
          </h2>
        </div>
      </Wizard>
    </>
  );
};

export default OnBoardingSuccess;
