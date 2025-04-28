import "./PropertyImage.scss";
import Image from "next/image";

export default function PropertyImage({ src, width, height }) {
  if (!src) return null;

  width = width || "100%";
  height = height || "100%";
  return (
    <div style={{ width, height }} className="propertyImage_container">
      <Image className="propertyImage_main" src={src} fill sizes="100%" />
      <Image className="propertyImage_overlay" src={src} fill sizes="100%" />
    </div>
  );
}
