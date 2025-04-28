export default function setSearchParams(
  key,
  value,
  params,
  isValid = (value) => true
) {
  if (isValid(value)) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
}
