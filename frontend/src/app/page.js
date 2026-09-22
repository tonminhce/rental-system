"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  ArrowForward,
  Search,
  PlaceOutlined,
  ApartmentOutlined,
  PaymentsOutlined,
  AutoAwesomeOutlined,
  ExploreOutlined,
  FavoriteBorder,
  ArrowOutward,
  Check,
} from "@mui/icons-material";
import { useGetPropertiesQuery } from "@/redux/features/properties/propertyApi";
import { toggleChatWidget } from "@/redux/features/system/systemSlice";
import PropertyCard from "@/components/GetPropertiesPage/components/PropertyCard";
import "@scss/homepage.scss";

const neighborhoods = [
  { name: "Thảo Điền", district: "Thủ Đức", text: "Leafy streets. A slower pace.", number: "01", color: "sage" },
  { name: "Bình Thạnh", district: "Bình Thạnh", text: "Local life, right by the city.", number: "02", color: "sand" },
  { name: "Quận 1", district: "Quận 1", text: "At the heart of everything.", number: "03", color: "clay" },
];

export default function HomePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [district, setDistrict] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const { data, isLoading, error, refetch } = useGetPropertiesQuery({ page: 1, limit: 4, transactionType: "rent" });
  const search = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (district) params.set("district", district);
    if (type) params.set("propertyType", type);
    if (budget) params.set("maxPrice", budget);
    router.push(`/rent?${params}`);
  };
  return (
    <main id="main-content" className="home-page">
      <section className="hero-section">
        <div className="hero-copy animate-fade-in-up">
          <div className="eyebrow">
            <span className="status-dot" /> A NEW CHAPTER STARTS HERE
          </div>
          <h1>
            More than a place.
            <br />A place to <em>belong.</em>
          </h1>
          <p>
            Find your kind of home in Ho Chi Minh City.
            <br className="desktop-break" /> A little less searching. A lot more living.
          </p>
          <div className="hero-actions">
            <Link className="button-primary btn-animated" href="/rent">
              Explore homes <ArrowForward fontSize="small" />
            </Link>
            <a className="text-link" href="#how-it-works">
              How it works <ArrowOutward fontSize="small" />
            </a>
          </div>
          <div className="hero-note">
            <span className="note-icon">
              <Check fontSize="small" />
            </span>
            <span>Your neighborhood. Your budget. Your next beginning.</span>
          </div>
        </div>
        <figure className="hero-photo animate-scale-in">
          <Image
            src="/images/rentalk-living.jpg"
            alt="A sunlit apartment with a linen sofa, natural wood, and tropical greenery"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 52vw"
          />
          <div className="photo-label float-subtle">
            <span className="photo-label-icon">
              <PlaceOutlined />
            </span>
            <div>
              <strong>Room for your next chapter</strong>
              <span>Inspired by life in Ho Chi Minh City</span>
            </div>
          </div>
          <figcaption>Illustrative space · AI-generated</figcaption>
          <span className="photo-index">THE EVERYDAY, ELEVATED / 01</span>
        </figure>
        <form className="home-search animate-fade-in-up delay-150" onSubmit={search} aria-label="Find a rental home">
          <div className="search-field">
            <PlaceOutlined />
            <label htmlFor="home-location">
              Where do you want to live?
              <select id="home-location" value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="">All of Ho Chi Minh City</option>
                <option>Thủ Đức</option>
                <option>Bình Thạnh</option>
                <option>Quận 1</option>
                <option>Quận 3</option>
                <option>Quận 7</option>
                <option>Tân Bình</option>
              </select>
            </label>
          </div>
          <div className="search-field">
            <ApartmentOutlined />
            <label htmlFor="home-type">
              Your kind of place
              <select id="home-type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Any property type</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="room">Room</option>
                <option value="villa">Villa</option>
              </select>
            </label>
          </div>
          <div className="search-field">
            <PaymentsOutlined />
            <label htmlFor="home-budget">
              Monthly budget
              <select id="home-budget" value={budget} onChange={(e) => setBudget(e.target.value)}>
                <option value="">Any budget</option>
                <option value="5">Up to 5 million ₫</option>
                <option value="10">Up to 10 million ₫</option>
                <option value="20">Up to 20 million ₫</option>
                <option value="30">Up to 30 million ₫</option>
              </select>
            </label>
          </div>
          <button className="button-primary" type="submit">
            <Search fontSize="small" /> Find a home
          </button>
        </form>
      </section>
      <section className="discovery-section" aria-labelledby="homes-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">MAKE YOURSELF AT HOME</span>
            <h2 id="homes-title">A good place to start.</h2>
          </div>
          <Link className="text-link" href="/rent">
            View all homes <ArrowForward fontSize="small" />
          </Link>
        </div>
        <div className="listing-intro">
          <p>Discover spaces for the way you live.</p>
          {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
            <span className="demo-label">Preview collection · sample listings</span>
          )}
        </div>
        {isLoading ? (
          <div className="home-property-grid" aria-label="Loading homes">
            {[0, 1, 2, 3].map((i) => (
              <div className="skeleton-card" key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="inline-empty" role="status">
            <p>We couldn’t load homes right now.</p>
            <button className="text-link" onClick={refetch}>
              Try again <ArrowForward fontSize="small" />
            </button>
          </div>
        ) : data?.properties?.length ? (
          <div className="home-property-grid">
            {data.properties.map((property, idx) => (
              <div
                key={property.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <PropertyCard property={{ ...property, thumbnail: property.images?.[0]?.url }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            <p>New places are on their way. Explore the map to find your neighborhood.</p>
            <Link className="text-link" href="/rent">
              Explore the map <ArrowForward fontSize="small" />
            </Link>
          </div>
        )}
      </section>
      <section className="neighborhood-section" aria-labelledby="neighborhood-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FIND YOUR CORNER OF THE CITY</span>
            <h2 id="neighborhood-title">
              Different neighborhoods.
              <br />A little more you.
            </h2>
          </div>
          <p>
            From your first morning coffee to your favorite
            <br className="desktop-break" /> way home. Start with a neighborhood.
          </p>
        </div>
        <div className="neighborhood-grid">
          {neighborhoods.map((area, idx) => (
            <Link
              className={`neighborhood-card ${area.color} animate-fade-in-up`}
              style={{ animationDelay: `${idx * 100}ms` }}
              key={area.name}
              href={`/rent?district=${encodeURIComponent(area.district)}`}
            >
              <span className="neighborhood-number">HCMC / {area.number}</span>
              <ExploreOutlined className="neighborhood-art" />
              <div>
                <h3>{area.name}</h3>
                <p>{area.text}</p>
              </div>
              <span className="circle-arrow">
                <ArrowOutward />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LESS FRICTION. MORE POSSIBILITY.</span>
            <h2>A simpler way home.</h2>
          </div>
        </div>
        <div className="how-grid">
          {[
            [Search, "01", "Find your fit", "Set your budget, choose a neighborhood, and explore homes on the map."],
            [
              FavoriteBorder,
              "02",
              "Keep the good ones",
              "Save your favorites and compare the details that matter to you.",
            ],
            [
              ApartmentOutlined,
              "03",
              "Make the connection",
              "Contact the listed owner, arrange a visit, and see if it feels like home.",
            ],
          ].map(([Icon, n, title, copy], idx) => (
            <div
              className="how-card animate-fade-in-up"
              style={{ animationDelay: `${idx * 100}ms` }}
              key={n}
            >
              <div>
                <Icon />
                <span>{n}</span>
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="assistant-banner">
        <div className="assistant-spark">
          <AutoAwesomeOutlined />
        </div>
        <div>
          <span className="eyebrow">A LITTLE HELP GOES A LONG WAY</span>
          <h2>Tell us what home looks like.</h2>
          <p>Let our AI assistant help you explore the possibilities.</p>
        </div>
        <button className="button-light" onClick={() => dispatch(toggleChatWidget())}>
          Let’s talk <ArrowForward fontSize="small" />
        </button>
      </section>
      <footer className="site-footer">
        <Link href="/" className="brand-word">
          renTalk<span>.</span>
        </Link>
        <p>Find a place. Make it yours.</p>
        <span>© {new Date().getFullYear()} renTalk</span>
        <a href="#main-content">Back to top ↑</a>
      </footer>
    </main>
  );
}
