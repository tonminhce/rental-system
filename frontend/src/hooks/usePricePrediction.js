import { useState, useEffect } from "react";

const PREDICTION_ENDPOINT = process.env.NEXT_PUBLIC_CRAWLER_PRICE_PREDICTION_ENDPOINT;

export default function usePricePrediction(propertyData) {
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [priceDifference, setPriceDifference] = useState(null);
  const [error, setError] = useState(null);

  // Depend on the scalar fields actually sent instead of on the post object: a
  // parent that rebuilds the wrapper on every render would otherwise restart the
  // request, and a response that lands late would label the wrong listing.
  const province = propertyData?.address?.province;
  const district = propertyData?.address?.district;
  const ward = propertyData?.address?.ward;
  const longitude = propertyData?.coordinates?.coordinates?.[0];
  const latitude = propertyData?.coordinates?.coordinates?.[1];
  const area = propertyData?.area;
  const bedrooms = propertyData?.bedrooms || 0;
  const bathrooms = propertyData?.bathrooms || 0;
  const listedPrice = propertyData?.price;

  useEffect(() => {
    if (!PREDICTION_ENDPOINT || latitude == null || longitude == null) return;

    const controller = new AbortController();
    let active = true;

    const predictPrice = async () => {
      setIsPredicting(true);
      setError(null);

      try {
        const response = await fetch(PREDICTION_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            province,
            district,
            ward,
            location_latitude: latitude,
            location_longitude: longitude,
            area,
            bedrooms,
            bathrooms,
          }),
        });

        const result = await response.json();
        if (!active) return;

        const predPrice = parseFloat(result.price);
        const actualPrice = parseFloat(listedPrice);

        if (Number.isFinite(predPrice)) {
          setPredictedPrice(result.price);
          setPriceDifference(
            predPrice !== 0 && Number.isFinite(actualPrice)
              ? ((actualPrice - predPrice) / predPrice) * 100
              : null
          );
        } else {
          setPredictedPrice(null);
          setPriceDifference(null);
        }
      } catch (caught) {
        if (!active || caught.name === "AbortError") return;
        console.error("Error predicting price:", caught);
        setError("Failed to predict price");
        setPredictedPrice(null);
        setPriceDifference(null);
      } finally {
        if (active) setIsPredicting(false);
      }
    };

    predictPrice();

    return () => {
      active = false;
      controller.abort();
    };
  }, [province, district, ward, latitude, longitude, area, bedrooms, bathrooms, listedPrice]);

  const getPriceDifferenceText = () => {
    if (priceDifference === null) return "";

    const absPercentage = Math.abs(priceDifference).toFixed(1);
    if (priceDifference > 0) {
      return `${absPercentage}% higher than predicted`;
    } else if (priceDifference < 0) {
      return `${absPercentage}% lower than predicted`;
    }
    return "Same as predicted price";
  };

  return {
    predictedPrice,
    isPredicting,
    priceDifference,
    error,
    getPriceDifferenceText,
  };
}
