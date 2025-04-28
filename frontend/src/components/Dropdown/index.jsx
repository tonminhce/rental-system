import styles from "./Dropdown.module.scss";

export default function Dropdown({ children }) {
  return <div className={styles.dropdown}>{children}</div>;
}
