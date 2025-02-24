"use client";
import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <nav className="bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="w-full flex flex-wrap items-center justify-between mx-auto p-4">
        {/* Logo */}
        <a href="./" className="flex items-center space-x-3 rtl:space-x-reverse">
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">local gems</span>
        </a>

        {/* Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          aria-expanded={isOpen}
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 17 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 1h15M1 7h15M1 13h15"
            />
          </svg>
        </button>

        {/* Menu Items */}
        <div className={`${isOpen ? "block" : "hidden"} w-full md:block md:w-auto`} id="navbar-default">
          <ul className="font-medium flex flex-col items-center p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
              <a
                href="/swipe"
                className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
              >
                discover
              </a>
            </li>
            {/* <li>
              <a
                href="#"
                className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
              >
                profile
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent"
              >
                leaderboard
              </a>
            </li> */}
            {/* Sign In/Out Button */}
            <li>
              {status === "loading" ? (
                <span className="text-gray-500">Loading...</span>
              ) : session ? (
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Sign Out
                </button>
              ) : (
                <button
                onClick={() => signIn("google", { prompt: "select_account", callbackUrl: window.location.href })
              }
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Sign In
                </button>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Nav;
