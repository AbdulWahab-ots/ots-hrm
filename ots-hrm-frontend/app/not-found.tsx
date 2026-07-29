import Image from "next/image";
import Link from "next/link";

export default function NotFoundPage() {
  return (
      <main className="min-h-screen p-6 flex items-center justify-center flex-col gap-4 align-middle w-full">
        <img src="/404-image.jpg" alt="404 image" className="max-w-[500px]" />
        
        <h1 className="text-2xl uppercase text-center sm:text-2.5xl md:text-5xl lg:text-7xl font-bold text-gray-800 mb-4">
          Page not found
        </h1>
        {/* <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left lg:pr-8 xl:pr-16 lg:transform lg:-translate-x-28">
          <div className="mb-5 sm:mb-6 md:mb-8">
            <Link href="/">
              <Image
                src="https://smarthr.co.in/demo/react/template/assets/img/logo.svg"
                alt="Company Logo"
                width={30}
                height={9}
                className="h-auto w-auto"
                unoptimized
              />
            </Link>
          </div>
          
          <h1 className="text-2xl sm:text-2.5xl md:text-3xl lg:text-[26px] font-bold text-gray-800 mb-3 sm:mb-3.5 md:mb-4">
            Oops, something went wrong
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-[16px] text-gray-600 mb-6 sm:mb-7 md:mb-8">
            Error 404 Page not found sorry the page you{" "}
            <br className="hidden sm:inline lg:hidden xl:inline" />
            looking for doesn't exist or has been moved
          </p>
          
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 text-white font-medium rounded-md hover:bg-[#f26522]/90 transition-colors"
            style={{ backgroundColor: "#f26522" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end px-4 sm:px-0">
          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-3xl">
            <img
              src="https://smarthr.co.in/demo/react/template/assets/img/bg/error-404.svg"
              alt="404 Error Illustration"
              className="w-full h-auto"
            />
          </div>
        </div> */}
      </main>
  );
}