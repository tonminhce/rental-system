import "./OwnerCard.scss";
import { Avatar } from "@mui/material";
export default function OwnerCard({ owner }) {
  return (
    <div className="owner_container">
      <Avatar sx={{ bgcolor: "var(--rt-surface-tint)", color: "var(--rt-brand-ink)", gridArea: "avatar" }}>{(owner || "?").slice(0, 1)}</Avatar>
      <div className="owner_name">{owner || "Contact not provided"}</div>
      <div className="owner_joined">Listing contact</div>
    </div>
  );
}
