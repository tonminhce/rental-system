"use client";
import HomeIcon from "@mui/icons-material/Home";
import Image from "next/image";
import Link from "next/link";
import "@scss/homepage.scss";

function HomePage() {
  return (
    <div className="home_container">
      <div className="home_hero">
        <h1>
          Discover homes effortlessly with <span className="home_highlight">renTalk</span> for a smooth rental experience.
        </h1>

        <h4 className="home_subtitle">
          Find rental homes and apartments customized to your preferences and budget.
        </h4>

        <div className="home_search">
          <Link href="/rent">
            <button className="home_searchBtn">
              <HomeIcon sx={{ fontSize: 24, color: "hsl(60, 9.1%, 97.8%)", marginRight: "8px" }} />
              View Rentals
            </button>
          </Link>
        </div>
      </div>

      <div className="home_banner">
        <Image
          priority={true}
          src="/banner.png"
          className="home_bannerImage"
          alt="The renTalk banner image"
          width={300}
          height={300}
        />
      </div>
    </div>
  );
}

export default HomePage;
