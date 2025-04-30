import {
  ArrowBackIos,
  CachedOutlined,
  SearchOutlined,
} from "@mui/icons-material";
import clsx from "clsx";
import styles from "./AddressDropdown.module.scss";

export default function DropdownActions({
  setAddress,
  activeMenu,
  setActiveMenu,
}) {
  const goBack = () => setTimeout(() => setActiveMenu("form"), 0);
  const reset = () => {
    if (activeMenu == "form" || activeMenu == "province") {
      setAddress({ province: { Id: "all", Name: "All" }, districts: [] });
    } else {
      setAddress({ districts: [] });
    }
  };

  return (
    <div className={styles.action}>
      {activeMenu != "form" && (
        <div onClick={goBack} className={styles.actionBtn}>
          <ArrowBackIos /> Back
        </div>
      )}
      <div style={{ flex: 1 }}></div>
      <div onClick={reset} className={styles.actionBtn}>
        <CachedOutlined /> Reset
      </div>
      <div className={clsx(styles.actionBtn, styles.actionBtnPrimary)}>
        <SearchOutlined />
        Search
      </div>
    </div>
  );
}
