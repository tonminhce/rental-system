export function isJSON(str: string): boolean {
  if (typeof str !== "string") {
    return false; // Not a string, so it's not JSON
  }
  try {
    JSON.parse(str);
    return true; // It's valid JSON
  } catch (error) {
    return false; // Parsing failed, not JSON
  }
}

/**
 * get all element of targetArray do not in compareArray
 * @param targetArray
 * @param compareArray
 * @returns array
 */
export function diffArray(targetArray: Array<any>, compareArray: Array<any>) {
  return targetArray.filter((item) => compareArray.indexOf(item) < 0);
}
