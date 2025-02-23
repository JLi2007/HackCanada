"use client";
import { motion } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import confetti from "canvas-confetti";
import { useState, useEffect } from "react";

interface ThumbsProps {
  placeId: string | number;
  likedPlaces: Record<string | number, boolean>;
  setLikedPlaces: React.Dispatch<
    React.SetStateAction<Record<string | number, boolean>>
  >;
}

const ThumbsUpButton: React.FC<ThumbsProps> = ({
  placeId,
  likedPlaces,
  setLikedPlaces,
}) => {
  const [totalLikes, setTotalLikes] = useState(0);
  const isLiked = likedPlaces[placeId] || false;

  const handleLike = async () => {
    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeId,
          action: isLiked ? "unlike" : "like",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setLikedPlaces((prev) => ({
          ...prev,
          [placeId]: !isLiked,
        }));
        setTotalLikes(data.totalLikes);
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  // Fetch initial like count
  useEffect(() => {
    fetch(`/api/likes?placeId=${placeId}`)
      .then((res) => res.json())
      .then((data) => {
        setTotalLikes(data.totalLikes);
      })
      .catch(console.error);
  }, [placeId]);

  return (
    <motion.button
      onClick={handleLike}
      whileTap={{ scale: 1.2 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`flex items-center justify-center p-3 rounded-full border border-gray-400 shadow-md ${
        isLiked
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-white hover:bg-gray-100"
      }`}
      disabled={isLiked}
    >
      <ThumbsUp
        size={24}
        className={`transition-all ${
          isLiked ? "text-blue-500 fill-blue-500/50" : "text-gray-500"
        }`}
      />
      <span>{totalLikes}</span>
    </motion.button>
  );
};

export default ThumbsUpButton;
