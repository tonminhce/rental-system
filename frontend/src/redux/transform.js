export const transformPropertiesResponse = (response) => {
  return {
    properties: response?.data?.data ?? [],
    pagination: response?.data?.pagination,
  };
};


export const transformFavouritePropertiesResponse = (response) => {
  return {
    properties: response?.data?.posts ?? [],
    pagination: response?.data?.pagination,
  };
};
