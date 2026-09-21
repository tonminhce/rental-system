import "./PropertyImage.scss";
import Image from "next/image";

export default function PropertyImage({ src, width, height, alt = "Rental property photo" }) {
  if (!src) return null;

  width = width || "100%";
  height = height || "100%";
  return (
    <div style={{ width, height }} className="propertyImage_container">
      <Image alt={alt} className="propertyImage_main" src={src} fill sizes="(max-width: 760px) 100vw, 70vw" />
      <Image
        alt=""
        aria-hidden="true"
        className="propertyImage_overlay"
        src={src}
        fill
        sizes="(max-width: 760px) 100vw, 70vw"
      />
    </div>
  );
}
