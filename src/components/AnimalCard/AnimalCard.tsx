import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import CustomButton from 'components/CustomButton/CustomButton';
import { Animal } from 'types/Animal';

interface AnimalCardProps {
  animal: Animal;
  rating: number;
  selectedAttributes: string[]; 
  isLiked: boolean; 
  onRate: (name: string, stars: number) => void;
  onSelectAttributes: (name: string, attributes: string[]) => void; 
  onLike: (animal: Animal) => void; 
}

const numOfStars = [1, 2, 3, 4, 5];

const AnimalCard: React.FC<AnimalCardProps> = ({
  animal,
  rating,
  selectedAttributes,
  isLiked,
  onRate,
  onSelectAttributes,
  onLike,
}) => {
  const { name, characteristics } = animal;

  // Local state to manage the attributes selected by the user
  const [selected, setSelected] = useState<string[]>(selectedAttributes);

  // Keep local state in sync if parent changes `selectedAttributes`
  useEffect(() => {
    setSelected(selectedAttributes);
  }, [selectedAttributes]);

  // Handle when user selects or deselects an attribute
  const handleAttributeChange = (attribute: string) => {
    const newAttributes = selected.includes(attribute)
      ? selected.filter((attr) => attr !== attribute)
      : [...selected, attribute];

    setSelected(newAttributes);
    onSelectAttributes(name, newAttributes); 
  };
  
  // Render the star rating buttons (1 to 5 stars)
  const renderStarButtons = () =>
    numOfStars.map((star) => (
      <CustomButton
        key={star}
        onClick={() => onRate(name, star)}
        isActive={rating >= star}
      >
        ★
      </CustomButton>
    ));

  // Render up to 5 clickable attribute buttons
  const renderAttributeButtons = () =>
    Object.entries(characteristics)
      .slice(0, 5)
      .map(([key, value]) => (
        <CustomButton
          key={key}
          onClick={() => handleAttributeChange(key)}
          isActive={selected.includes(key)}
          className="m-1 w-auto"
        >
          {key}: {value}
        </CustomButton>
      ));

  return (
    <div className="border border-gray-200 rounded-lg shadow-md p-4 m-2 flex flex-col bg-white hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{name}</h2>
        <button onClick={() => onLike(animal)}>
          {isLiked ? (
            <FaHeart className="text-red-500" /> 
          ) : (
            <FaRegHeart className="text-gray-400" />
          )}
        </button>
      </div>
      <div>
        <strong>Rating:</strong>
        <div className="flex justify-center space-x-2 my-2">{renderStarButtons()}</div>
      </div>
      <div className="mt-4">
        <strong>Select Attributes:</strong>
        <div className="flex flex-wrap mt-2">{renderAttributeButtons()}</div>
      </div>
    </div>
  );
};

export default AnimalCard;
