import React from 'react';

const PlaceholderPage = ({ title }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <h1 className="text-2xl font-semibold text-gray-700">{title}</h1>
    </div>
  );
};

export default PlaceholderPage;
