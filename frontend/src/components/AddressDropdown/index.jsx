"use client";
import VN_ADDRESSES from "@/constants/address";
import { useState } from "react";
import Dropdown from "../Dropdown";
import AddressForm from "./AddressForm";
import DistrictSelect from "./DistrictSelect";
import DropdownActions from "./DropdownActions";
import ProvinceSelect from "./ProvinceSelect";

export default function AddressDropdown({ address, setAddress }) {
  const [activeMenu, setActiveMenu] = useState("form");

  const toggleDistrict = (district) => {
    for (const selectedDistrict of address?.districts) {
      if (selectedDistrict.Id === district.Id) {
        const districts = address.districts.filter((d) => d.Id !== district.Id);
        return setAddress((prev) => ({ ...prev, districts }));
      }
    }

    const districts = [...address.districts, district];
    return setAddress((prev) => ({ ...prev, districts }));
  };

  return (
    <Dropdown>
      <div>
        <AddressForm
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          provinceLabel={address.province?.Name || ""}
          districtLabel={address.districts.map((d) => d.Name).join(", ") || ""}
          setAddress={setAddress}
        />
        <ProvinceSelect
          options={VN_ADDRESSES}
          active={activeMenu == "province"}
          onClick={(province) => {
            setAddress({ province, districts: [] });
            setActiveMenu("form");
          }}
        />
        <DistrictSelect
          active={address.province && activeMenu == "districts"}
          address={address}
          onChange={toggleDistrict}
        />
      </div>

      <DropdownActions
        setAddress={setAddress}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
      />
    </Dropdown>
  );
}
