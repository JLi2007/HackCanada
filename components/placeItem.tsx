import React from "react";

interface PlaceItemProps {
  place: any;
}

const PlaceItem: React.FC<PlaceItemProps> = React.memo(({ place }) => {
  return (
    <li className="p-3 mb-3 bg-white shadow-lg rounded-lg">
      <h4 className="text-lg font-bold">{place.name}</h4>
      <p>{place.address || "Address not available"}</p>
      <p>{place.description || "No description available"}</p>
    </li>
  );
});

// Set a display name for the memoized component
PlaceItem.displayName = "PlaceItem";

export default PlaceItem;
