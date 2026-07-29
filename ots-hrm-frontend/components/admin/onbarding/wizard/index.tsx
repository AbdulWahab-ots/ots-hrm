import Image from "next/image";
import React from "react";
import Group from "../../../../public/Group 5.png";
import animoji6 from "../../../../public/animoji-6.svg";
import Ellipse from "../../../../public/Ellipse.svg";
import SuccessImage from "../../../../public/SuccessImage.svg";
import StepsHeader from "../StepsHeader";
import { OnboardingStepKey } from "../steps";
// Define props interface for the Wizard component
interface WizardProps {
  children: React.ReactNode; // Allows any valid React children (elements, strings, etc.)
  currentStepKey?: OnboardingStepKey; // When provided, renders the steps header above children
}

const Wizard: React.FC<WizardProps> = ({ children, currentStepKey }) => {
  return (
    <div className="relative flex min-h-screen justify-center items-center">
      <div className="absolute top-0">
        <Image src={Group} alt="initializing image" />
      </div>
      <div className="z-10 flex flex-col items-center">
        {currentStepKey && <StepsHeader currentStepKey={currentStepKey} />}
        {children}
      </div>
      <div className="absolute lg:block hidden right-0 bottom-0">
        <Image src={SuccessImage} alt="SuccessImage" />
      </div>
      <div className="absolute lg:block hidden -left-36 bottom-3">
        <Image src={Ellipse} alt="Ellipse image" />
      </div>
    </div>
  );
};

export default Wizard;
