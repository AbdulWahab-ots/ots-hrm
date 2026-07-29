import React from 'react'
import Image from 'next/image'
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

function ExportButton() {
  return (
    <div className="flex items-center">
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex items-center justify-center rounded-[var(--g-radius-sm)] border border-g-gray-alpha-400 bg-g-background-100 p-4 px-4.5 hover:bg-g-gray-alpha-100 focus-ring-geist">
            <Image 
              src="/Vector (3).svg" 
              alt="Export" 
              width={14} 
              height={14}
            />
          </Menu.Button>
        </div>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-44 origin-top-right rounded-[var(--g-radius-md)] bg-g-background-100 shadow-geist-menu ring-1 ring-gray-200 focus:outline-none">
            <div className="">
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${active ? "bg-g-gray-alpha-100 rounded-[var(--g-radius-sm)]" : "text-g-gray-900"
                      } flex items-center w-full px-4 py-2.5 text-copy-14 text-g-gray-900 focus-ring-geist`}
                  >
                    Export as PDF
                  </button>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`${active ? "bg-g-gray-alpha-100 rounded-[var(--g-radius-sm)]" : "text-g-gray-900"
                      } flex items-center w-full px-4 py-2.5 text-copy-14 text-g-gray-900 focus-ring-geist`}
                  >
                    Export as Excel
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}

export default ExportButton