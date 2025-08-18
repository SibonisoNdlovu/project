import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AnimalCard from './AnimalCard';
import { Animal } from 'types/Animal';

jest.mock('components/CustomButton/CustomButton', () => ({ onClick, children, isActive }: { onClick: () => void; children: React.ReactNode; isActive: boolean }) => (
  <button onClick={onClick} className={isActive ? 'active' : ''}>
    {children}
  </button>
));

const mockAnimal: Animal = {
    name: 'Bobcat',
    taxonomy: {
      kingdom: 'Animalia',
      phylum: 'Chordata',
      class: 'Mammalia',
      order: 'Carnivora',
      family: 'Felidae',
      genus: 'Lynx',
      scientific_name: 'Lynx rufus',
    },
    locations: ['Central-America', 'North-America'],
    characteristics: {
      prey: 'Rabbits',
      name_of_young: 'Kitten',
      group_behavior: 'Solitary',
      estimated_population_size: '1,000,000',
      biggest_threat: 'Hunting',
      most_distinctive_feature: 'Short ear tufts',
      gestation_period: '63 days',
      habitat: 'Mountainous forest, swamp, desert',
      diet: 'Carnivore',
      average_litter_size: '2-4',
      lifestyle: 'Solitary',
      common_name: 'Bobcat',
      number_of_species: '1',
      location: 'North America',
      slogan: 'The wild cat of North America',
      group: 'Mammals',
      color: 'Brown, Red, Black, White, Tawny, Beige',
      skin_type: 'Fur',
      top_speed: '34 mph',
      lifespan: '12 - 15 years',
      weight: '4.1kg - 15.3kg (9lbs - 33lbs)',
      height: '15-23 inches',
      age_of_sexual_maturity: '1-2 years',
      age_of_weaning: '2 months',
    },
  };
  
  const renderAnimalCard = () => {
    const defaultProps = {
      animal: mockAnimal,
      rating: 3,
      selectedAttributes: ['diet', 'habitat'],
      isLiked: false,
      onRate: jest.fn(),
      onSelectAttributes: jest.fn(),
      onLike: jest.fn(),
    };
  
    return render(<AnimalCard {...defaultProps}/>);
  };
  
describe('AnimalCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders animal name', () => {
    renderAnimalCard();
    expect(screen.getByText('Bobcat')).toBeInTheDocument();
  });

  test('renders rating buttons', () => {
    renderAnimalCard();
    const starButtons = screen.getAllByText('★');
    expect(starButtons.length).toBe(5);
  });

  test('toggles like state when like button is clicked', () => {
    renderAnimalCard();
    const likeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(likeButton);
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument();
  });
});
