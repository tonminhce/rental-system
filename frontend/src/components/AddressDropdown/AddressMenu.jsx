import clsx from "clsx";
import styles from "./AddressDropdown.module.scss";

export default function AddressMenu({ active, children }) {
  return (
    <div className={clsx(styles.menu, !active && styles.hidden)}>
      {children}
    </div>
  );
}
