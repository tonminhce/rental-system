import { ArrowForwardIos } from "@mui/icons-material";
import styles from "./AddressDropdown.module.scss";
import AddressMenu from "./AddressMenu";

export default function ProvinceSelect({ options, active = false, onClick }) {
  return (
    <AddressMenu active={active}>
      {options.sort().map((province) => (
        <div
          key={province.Id}
          className={styles.option}
          onClick={() => onClick(province)}
        >
          <div style={{ flex: 1 }}>{province.Name}</div>
          <ArrowForwardIos />
        </div>
      ))}
    </AddressMenu>
  );
}
