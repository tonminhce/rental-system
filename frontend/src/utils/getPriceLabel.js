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
    less: `Less than ${max} million VND`,
    more: `More than ${min} million VND`,
    equal: `${min} million VND`,
    between: `${min} - ${max} million VND`,
  };

  return labels[getPriceRangeType(min, max)];
}

export const getPriceSelectLabel = ([min, max]) => {
  const labels = {
    all: "Any price range",
    less: `≤ ${max} million VND`,
    more: `≥ ${min} million VND`,
    equal: `${min} million VND`,
    between: `${min} - ${max} million VND`,
  };

  return labels[getPriceRangeType(min, max)];
};
