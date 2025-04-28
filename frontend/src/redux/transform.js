export const transformPropertiesResponse = (response) => {
  return {
    properties: response?.data?.data ?? [],
    pagination: response?.data?.pagination,
  };
};
