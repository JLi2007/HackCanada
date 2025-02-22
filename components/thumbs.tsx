"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import confetti from "canvas-confetti";

interface ThumbsUpButtonProps {
  placeId: string | number; 
}

const ThumbsUpButton: React.FC<ThumbsUpButtonProps> = ({ placeId }) => {
  const storageKey = `liked-${placeId}`;
  const [liked, setLiked] = useState<boolean>(false);

  useEffect(() => {
    const savedLiked = localStorage.getItem(storageKey);
    if (savedLiked === "true") {
      setLiked(true);
    }
  }, [storageKey]);

  const handleLike = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!liked) {
      const rect = event.currentTarget.getBoundingClientRect();
      confetti({
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
      });
      setLiked(true);
      localStorage.setItem(storageKey, "true");
    }
  };

  return (
    <motion.button
      onClick={handleLike}
      whileTap={{ scale: 1.2 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`flex items-center justify-center p-3 rounded-full border border-gray-400 shadow-md ${
        liked ? "bg-gray-300 cursor-not-allowed" : "bg-white hover:bg-gray-100"
      }`}
      disabled={liked} // Disable button after clicking
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
