export default function formatAddress({ street, district, province } = {}) {
  return [street, district, province].filter(Boolean).join(", ") || "Ho Chi Minh City";
}
