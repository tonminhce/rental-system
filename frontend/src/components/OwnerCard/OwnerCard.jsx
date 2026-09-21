import "./OwnerCard.scss";
import { Avatar } from "@mui/material";
export default function OwnerCard({ owner }) {
  return (
    <div className="owner_container">
      <Avatar sx={{ bgcolor: "#e8eede", color: "#416037", gridArea: "avatar" }}>{(owner || "?").slice(0, 1)}</Avatar>
      <div className="owner_name">{owner || "Contact not provided"}</div>
      <div className="owner_joined">Listing contact</div>
    </div>
  );
}
