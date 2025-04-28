import styles from "./AddressDropdown.module.scss";
import { ArrowForwardIos, CloseOutlined } from "@mui/icons-material";

export default function OptionIcon({ isActive, handleClear }) {
  return (
    <>
      {isActive ? (
        <CloseOutlined className={styles.icon} onClick={handleClear} />
      ) : (
        <ArrowForwardIos className={styles.icon} />
      )}
    </>
  );
}
