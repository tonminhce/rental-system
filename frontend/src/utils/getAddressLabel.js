export default function getAddressLabel({ province, districts }) {
  if (province === "") return "All";
  if (districts.length === 0) return province;
  return districts.join(", ") + ", " + province;
}
