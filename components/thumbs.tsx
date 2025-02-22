"use client";
import { motion } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import confetti from "canvas-confetti";

interface ThumbsUpButtonProps {
  placeId: string | number;
  likedPlaces: Record<string | number, boolean>;
  setLikedPlaces: React.Dispatch<React.SetStateAction<Record<string | number, boolean>>>;
}

const ThumbsUpButton: React.FC<ThumbsUpButtonProps> = ({ placeId, likedPlaces, setLikedPlaces }) => {
  const liked = likedPlaces[placeId] || false;

  const handleLike = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!liked) {
      const rect = event.currentTarget.getBoundingClientRect();
      confetti({
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
      });
      setLikedPlaces((prev) => ({ ...prev, [placeId]: true }));
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
      disabled={liked}
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
