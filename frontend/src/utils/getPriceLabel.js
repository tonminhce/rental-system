function getPriceRangeType(min, max) {
  if (min === 0 && max === 0) {
    return "all";
  } else if (min === 0) {
    return "less";
  } else if (max === 0) {
    return "more";
  } else if (min == max) {
    return "equal";
  } else {
    return "between";
  }
}
export function getPriceOptionLabel([min, max]) {
  const labels = {
    all: "Any price range",
    less: `Less than ${max} milion VND`,
    more: `More than ${min} miliion VND`,
    between: `${min} - ${max} milion VND`,
  };

  return labels[getPriceRangeType(min, max)];
}

export const getPriceSelectLabel = ([min, max]) => {
  const labels = {
    all: "Any price range",
    less: `≤ ${max} milion VND`,
    more: `≥ ${min} miliion VND`,
    equal: `${min} million VND`,
    between: `${min} - ${max} milion VND`,
  };

  return labels[getPriceRangeType(min, max)];
};
