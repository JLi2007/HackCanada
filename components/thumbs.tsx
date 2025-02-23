"use client";
import { motion } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import confetti from "canvas-confetti";
import { useState, useEffect } from "react";

interface Place {
  id: string | number;
  name: string;
  address?: string;
  description?: string;
  photo?: string;
  type?: string;
}

interface ThumbsProps {
  place: Place;
  likedPlaces: Record<string | number, boolean>;
  setLikedPlaces: React.Dispatch<React.SetStateAction<Record<string | number, boolean>>>;
}

const ThumbsUpButton: React.FC<ThumbsProps> = ({ place, likedPlaces, setLikedPlaces }) => {
  const [totalLikes, setTotalLikes] = useState(0);
  const isLiked = likedPlaces[place.id] || false;

  const handleLike = async () => {
    try {
      const response = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send the full place object now.
        body: JSON.stringify({
          place: place,
          action: isLiked ? "unlike" : "like",
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setLikedPlaces((prev) => ({ ...prev, [place.id]: !isLiked }));
        setTotalLikes(data.totalLikes);
        if (!isLiked) {
          confetti();
        }
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  // Fetch initial like count
  useEffect(() => {
    fetch(`/api/likes?placeId=${place.id}`)
      .then((res) => res.json())
      .then((data) => {
        setTotalLikes(data.totalLikes);
      })
      .catch(console.error);
  }, [place.id]);

  return (
    <motion.button
      onClick={handleLike}
      whileTap={{ scale: 1.2 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`flex items-center justify-center p-3 rounded-full border border-gray-400 shadow-md ${
        isLiked ? "bg-gray-300 cursor-not-allowed" : "bg-white hover:bg-gray-100"
      }`}
      disabled={isLiked}
    >
      <ThumbsUp
        size={24}
        className={`transition-all ${
          isLiked ? "text-blue-500 fill-blue-500/50" : "text-gray-500"
        }`}
      />
      <span className="text-gray-400">{totalLikes}</span>
    </motion.button>
  );
};

export default ThumbsUpButton;
