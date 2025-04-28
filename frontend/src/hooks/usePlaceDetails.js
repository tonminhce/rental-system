import { useEffect, useState } from "react";

export default function usePlaceDetails(addressId, version = "v1") {
  const [addressDetails, setAddressDetails] = useState(null);

  useEffect(() => {
    const getAddressDetails = async () => {
      if (!addressId) return;

      const url = `/api/places/details?place_id=${addressId}&more_compound=true`;
      const response = await fetch(url.toString());
      const data = await response.json();

      return data?.result;
    };

    getAddressDetails()
      .then((data) => {
        if (version == "v2") {
          const { place_id, geometry, formatted_address, compound } = data;

          const lng = geometry?.location?.lng;
          const lat = geometry?.location?.lat;

          console.log(compound);

          setAddressDetails({
            placeId: place_id,
            location: [lng, lat],
            displayedAddress: formatted_address,
            compound,
          });
          return;
        }
        setAddressDetails(data);
      })
      .catch((error) => {
        setAddressDetails({
          placeId: null,
          location: null,
          displayedAddress: null,
        });
        console.log(
          `[ERROR] Fail to get the address detail with id ${addressId}`
        );
        console.log(error);
      });
  }, [addressId]);

  return addressDetails;
}
