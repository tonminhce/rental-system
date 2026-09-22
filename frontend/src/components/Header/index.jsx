"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { Avatar, IconButton, Menu, MenuItem } from "@mui/material";
import { ArrowOutward, FavoriteBorderOutlined, MenuOutlined } from "@mui/icons-material";
import useMenu from "@/hooks/useMenu";
import FavouritePostMenu from "../GetPropertiesPage/components/FavouritePostMenu";
import AccountMenu from "./components/AccountMenu";
import { useState } from "react";
export default function Header() {
  const pathname = usePathname();
  const user = useSelector((state) => state.auth.user);
  const [open, anchorEl, handleClick, handleClose] = useMenu();
  const [savedOpen, savedAnchor, openSaved, closeSaved] = useMenu();
  const [mobileAnchor, setMobileAnchor] = useState(null);
  const links = [
    ["/rent", "Find a home"],
    ["/roommate", "Find a roommate"],
    ["/#how-it-works", "How it works"],
  ];
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand-word" href="/" aria-label="renTalk home">
            renTalk<span>.</span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map(([href, label]) => (
              <Link href={href} key={href} aria-current={pathname === href ? "page" : undefined}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <IconButton aria-label="Saved homes" onClick={openSaved}>
                  <FavoriteBorderOutlined fontSize="small" />
                </IconButton>
                <button className="account-button" onClick={handleClick} aria-label="Account menu" aria-expanded={open}>
                  <Avatar src={user.avatar} sx={{ width: 29, height: 29 }} />
                  <span>{user.name}</span>
                </button>
              </>
            ) : (
              <Link href="/login" className="login-link">
                Log in
              </Link>
            )}
            <Link href="/landlord/publish" className="list-home-link">
              List your property <ArrowOutward sx={{ fontSize: 15 }} />
            </Link>
            <IconButton
              className="mobile-menu-button"
              aria-label="Open navigation"
              onClick={(e) => setMobileAnchor(e.currentTarget)}
            >
              <MenuOutlined />
            </IconButton>
          </div>
        </div>
      </header>
      <Menu anchorEl={mobileAnchor} open={!!mobileAnchor} onClose={() => setMobileAnchor(null)}>
        {links.map(([href, label]) => (
          <MenuItem component={Link} href={href} key={href} onClick={() => setMobileAnchor(null)}>
            {label}
          </MenuItem>
        ))}
        <MenuItem component={Link} href="/landlord/publish" onClick={() => setMobileAnchor(null)}>
          List your property
        </MenuItem>
      </Menu>
      <AccountMenu anchorEl={anchorEl} open={open} handleClose={handleClose} />
      <FavouritePostMenu anchorEl={savedAnchor} open={savedOpen} onCancel={closeSaved} />
    </>
  );
}
