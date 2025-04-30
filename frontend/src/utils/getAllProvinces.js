export function removeProvincePrefix(province) {
  return province.replace("Tỉnh ", "").replace("Thành phố ", "");
}

export default async function getAllProvinces() {
  const response = await fetch(
    "https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json"
  );

  const data = await response.json();

  const provinces = data.map((province) => removeProvincePrefix(province.Name));

  console.log(provinces);
}
