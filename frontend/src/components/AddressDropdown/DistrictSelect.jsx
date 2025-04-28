"use client";
import styles from "./AddressDropdown.module.scss";
import AddressMenu from "./AddressMenu";

export default function DistrictSelect({ onChange, active, address }) {
  return (
    <AddressMenu active={active}>
      {(address.province.Districts || []).map((district) => (
        <label className={styles.option} key={district.Id}>
          <input
            type="checkbox"
            checked={address.districts.some((d) => d.Id === district.Id)}
            onChange={() => onChange(district)}
          />
          {district.Name}
        </label>
      ))}
    </AddressMenu>
  );
}
