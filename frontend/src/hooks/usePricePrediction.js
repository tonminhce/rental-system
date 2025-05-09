import { useState, useEffect } from 'react';

export default function usePricePrediction(propertyData) {
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [priceDifference, setPriceDifference] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const predictPrice = async () => {
      if (!propertyData || !propertyData.address || !propertyData.coordinates) return;

      setIsPredicting(true);
      setError(null);
      
      try {
        const predictionEndpoint = process.env.NEXT_PUBLIC_CRAWLER_PRICE_PREDICTION_ENDPOINT;
        
        const response = await fetch(predictionEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            province: propertyData.address.province,
            district: propertyData.address.district,
            ward: propertyData.address.ward,
            location_latitude: propertyData.coordinates.coordinates[1],
            location_longitude: propertyData.coordinates.coordinates[0],
            area: propertyData.area,
            bedrooms: propertyData.bedrooms || 0,
            bathrooms: propertyData.bathrooms || 0,
          }),
        });
        
        const result = await response.json();
        setPredictedPrice(result.price);
        
        // Calculate price difference percentage
        if (propertyData.price && result.price) {
          const actualPrice = parseFloat(propertyData.price);
          const predPrice = parseFloat(result.price);
          const diffPercentage = ((actualPrice - predPrice) / predPrice) * 100;
          setPriceDifference(diffPercentage);
        }
      } catch (error) {
        console.error('Error predicting price:', error);
        setError('Failed to predict price');
      } finally {
        setIsPredicting(false);
      }
    };

    predictPrice();
  }, [propertyData]);

  const getPriceDifferenceText = () => {
    if (priceDifference === null) return '';
    
    const absPercentage = Math.abs(priceDifference).toFixed(1);
    if (priceDifference > 0) {
      return `${absPercentage}% higher than predicted`;
    } else if (priceDifference < 0) {
      return `${absPercentage}% lower than predicted`;
    }
    return 'Same as predicted price';
  };

  return {
    predictedPrice,
    isPredicting,
    priceDifference,
    error,
    getPriceDifferenceText
  };
} 