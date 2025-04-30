export default function formatAddress({ street, district, province }) {
  return `${street}, Quận ${district}, ${province}`;
}