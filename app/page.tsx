import Nav from "@/app/components/Nav";
import { Bold } from "lucide-react";
import Link from "next/link";
export default function Home() {
  return (
    <div className="relative">
      <img src="/press_space_bar.svg" className="absolute top-35 left-200" width="20%"></img>
      <img src="/hover_over_cards.svg" className="absolute bottom-20 left-170" width="20%"></img>
      <main className="h-screen w-screen flex flex-row items-center justify-center bg-gradient-to-b from-white to-[#E3E0E0] via-white [background-position:0%]">
       
      <div className="flex flex-col items-center justify-left w-[50%] gap-8">
        <h1 className="flex items-center text-6xl w-[75%] h-[100%] text-black font-extrabold text-left animate-gradient-x">
          good news.<br />your new favourite spot is right around the corner.
        </h1>
        <span className="w-[75%] text-left text-2xl gap-50">
          discovering local <em>Canadian</em> businesses<br />has never been easier.
        </span>
        <div className="flex flex-row justify-start h-[100%] w-[75%]">
       
  <div className="cursor-pointer text-white w-[30%] text-center p-2 rounded-3xl bg-gradient-to-r from-red-500 to-red-800 bg-[length:400%_400%] animate-gradient-x">
  <Link href="/swipe">
    <strong>Let's go</strong>
    </Link>
  </div>

        </div>
      </div>


      <div className = "flex flex-row items-center justify-center w-[50%]">
        <img width='80%' src='/mock-up.svg'></img>
      </div>
      </main>
    </div>
  );
}
