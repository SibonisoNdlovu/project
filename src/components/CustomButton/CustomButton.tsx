import React from 'react';

interface CustomButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({
  onClick,
  children,
  isActive,
  className
}) => {
  return (
    <button
      onClick={onClick}
      className={`${className} px-3 py-1 border rounded transition duration-200 ${
        isActive ? 'bg-green-300' : 'bg-gray-200 hover:bg-gray-300'
      }`}
    >
      {children}
    </button>
  );
};

export default CustomButton;
