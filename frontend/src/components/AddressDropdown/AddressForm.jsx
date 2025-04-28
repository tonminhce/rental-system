import styles from "./AddressDropdown.module.scss";
import AddressMenu from "./AddressMenu";
import OptionIcon from "./OptionIcon";

export default function AddressForm({
  activeMenu,
  setActiveMenu,
  provinceLabel,
  districtLabel,
  setAddress,
}) {
  const openProvinceMenu = () => setActiveMenu("province");
  const openDistrictsMenu = () => provinceLabel && setActiveMenu("districts");

  const clearProvince = (e) => {
    e.stopPropagation();
    setTimeout(() => {
      setAddress({ province: { Name: "All", Id: "all" }, districts: [] });
      setActiveMenu("form");
    }, 0);
  };

  const clearDistricts = (e) => {
    e.stopPropagation();
    setTimeout(() => {
      setAddress({ ...address, districts: [] });
      setActiveMenu("form");
    }, 0);
  };
  return (
    <AddressMenu active={activeMenu == "form"}>
      <div className={styles.input} onClick={openProvinceMenu}>
        <div className={styles.title}>Province</div>
        <OptionIcon isActive={provinceLabel} handleClear={clearProvince} />
        <div className={styles.value}>{provinceLabel || ""}</div>
      </div>

      <div className={styles.input} onClick={openDistrictsMenu}>
        <div className={styles.title}>Districts</div>
        <OptionIcon isActive={districtLabel} handleClear={clearDistricts} />
        {districtLabel && (
          <div className={styles.value}>{districtLabel || ""}</div>
        )}
      </div>
    </AddressMenu>
  );
}
