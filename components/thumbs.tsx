"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import confetti from "canvas-confetti";

const ThumbsUpButton = () => {
    const [liked, setLiked] = useState(false);

  return (
    <motion.button
      onClick={(event) => {
        if (!liked) {
          const rect = event.currentTarget.getBoundingClientRect(); // Get button position for confetti
          confetti({
            origin: {
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight,
            },
          });
        }
        setLiked(!liked);
      }}
      whileTap={{ scale: 1.2 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="flex items-center justify-center p-3 rounded-full border border-gray-400 bg-white shadow-md hover:bg-gray-100"
    >
      <ThumbsUp
        size={24}
        className={`transition-all ${
          liked ? "text-blue-500 fill-blue-500/50" : "text-gray-500"
        }`}
      />
    </motion.button>
  );
};

export default ThumbsUpButton;
