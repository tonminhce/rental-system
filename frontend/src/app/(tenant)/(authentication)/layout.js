import Image from "next/image";
import banner from "@public/auth-banner.svg";
import "@scss/authentication.scss";
import { Suspense } from "react";

export default function AuthLayout({ children }) {
  return (
    <main id="main-content" className="auth_container">
      <div className="auth_banner">
        <Image
          priority
          src="/images/rentalk-living.jpg"
          width={700}
          height={800}
          alt="A bright, welcoming living space"
        />
        <div className="auth_photo-copy">
          <span>A PLACE TO BELONG</span>
          <h2>
            Every new chapter
            <br />
            starts somewhere.
          </h2>
          <p>Let’s find your somewhere.</p>
          <small>Illustrative space · AI-generated</small>
        </div>
      </div>

      <div className="auth_content">
        <Suspense>{children}</Suspense>
      </div>
    </main>
  );
}
