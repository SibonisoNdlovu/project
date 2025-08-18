import React, { useState } from 'react';
import AnimalCard from 'components/AnimalCard/AnimalCard';
import useFetchAnimals from 'hooks/useFetchAnimals';
import useLocalStorage from 'hooks/useLocalStorage';
import { Animal } from 'types/Animal';

const AnimalListPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { animals, loading, error } = useFetchAnimals(searchTerm);
  const [rating, setRating] = useLocalStorage<Record<string, number>>('animalRatings', {});

  const [selectedAttributes, setSelectedAttributes] = useLocalStorage<Record<string, string[]>>(
    'animalAttributes',
    {}
  );

  const [likedAnimals, setLikedAnimals] = useLocalStorage<Animal[]>('likedAnimals', []);

  const handleRate = (name: string, stars: number) => {
    setRating((prev) => ({ ...prev, [name]: stars }));
  };

  const handleSelectAttributes = (name: string, attributes: string[]) => {
    setSelectedAttributes((prev) => ({ ...prev, [name]: attributes }));
  };

  const handleLike = (animal: Animal) => {
    setLikedAnimals((prev) => {
      const isLiked = prev.some((likedAnimal) => likedAnimal.name === animal.name);
      return isLiked
        ? prev.filter((likedAnimal) => likedAnimal.name !== animal.name) // Remove if already liked
        : [...prev, animal]; // Add if not liked
    });
  };

  /**
   * Render a list of AnimalCard components
   * @param list - Array of animals to render
   * @param likedCheck - Optional boolean to override like status (used for liked list)
   */
  const renderAnimalCards = (list: Animal[], likedCheck?: boolean) =>
    list.map((animal) => (
      <AnimalCard
        key={animal.name}
        animal={animal}
        rating={rating[animal.name] || 0}
        selectedAttributes={selectedAttributes[animal.name] || []}
        isLiked={likedCheck ?? likedAnimals.some((a) => a.name === animal.name)}
        onRate={handleRate}
        onSelectAttributes={handleSelectAttributes}
        onLike={() => handleLike(animal)}
      />
    ));

  return (
    <div className="p-3">
      <h1 className="text-xl font-bold mb-3 text-center">Favorite Animals</h1>
      <div className="mb-3 flex justify-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="border p-1.5 rounded w-64 text-sm text-center"
        />
      </div>
      {loading && <p className="text-sm text-center">Loading...</p>}
      {error && <p className="text-sm text-center">{error}</p>}

      <div className="grid grid-row-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {renderAnimalCards(animals)}
      </div>

      <h2 className="text-lg font-semibold mt-5">Animals I Like</h2>
      <div className="grid grid-row-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {renderAnimalCards(likedAnimals, true)}
      </div>
    </div>
  );
};

export default AnimalListPage;
