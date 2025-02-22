import React from "react";

interface PlaceItemProps {
  place: {
    id: string;
    name: string;
    // Add other properties relevant to your place data
  };
  onLike: () => void;
  onDislike: () => void;
}

const PlaceItem: React.FC<PlaceItemProps> = ({ place, onLike, onDislike }) => {
  return (
    <div className="flex justify-between items-center">
      <span>{place.name}</span>
      <div className="flex space-x-2">
        <button onClick={onLike} className="text-red-500">
          ❤️
        </button>
        <button onClick={onDislike} className="text-gray-500">
          ❌
        </button>
      </div>
    </div>
  );
};

export default PlaceItem;
