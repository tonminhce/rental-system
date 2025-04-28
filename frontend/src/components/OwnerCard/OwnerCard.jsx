import "./OwnerCard.scss";
import Image from "next/image";

export default function OwnerCard({ owner }) {
  return (
    <div className="owner_container">
      <div className="owner_avatar">
        <Image
          src="https://m.media-amazon.com/images/I/51U9SFk6SJL._AC_UF1000,1000_QL80_.jpg"
          fill
          sizes="100%"
          alt={owner}
        />
      </div>
      <div className="owner_name">{owner}</div>
      <div className="owner_joined">Joined 3 months agon</div>
    </div>
  );
}
