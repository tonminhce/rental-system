import { SUPPORTED_PROPERTY_TYPES } from "@/constants";

export default function getPropertyTypeLabel(propType) {
  return SUPPORTED_PROPERTY_TYPES[propType];
}
