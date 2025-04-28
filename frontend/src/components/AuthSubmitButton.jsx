import clsx from "clsx";
import ClipLoader from "react-spinners/ClipLoader";

export default function AuthSubmitButton({ loading, children, ...props }) {
  return (
    <button
      className={clsx("auth_submit-btn", loading && "auth_submit-btn--loading")}
      type="submit"
    >
      {loading ? (
        <ClipLoader loading={loading} color="#000" size={20} />
      ) : (
        children
      )}
    </button>
  );
}
