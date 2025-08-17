import { useContext, useState } from "react";
import { Button } from "./ui/button";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.svg";
import { AuthContext } from "@/context/AuthContext";

const navLinks = [
  { name: "Home", href: "#hero" },
  { name: "Benefits", href: "#benefits" },
  { name: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);

  return (
    <div className="fixed top-3 z-40 px-5 w-full">
      <nav
        className="bg-background/70 backdrop-blur-md border border-neutral-100 shadow-md rounded-2xl border-b px-4 py-3 transition-all duration-300"
        style={{ WebkitBackdropFilter: "blur(12px)" }}
      >
        <div className="w-full flex justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Pixel Logo" className="size-10" />
          </div>
          <div className="absolute right-1/2 translate-x-1/2 top-1/2 -translate-y-1/2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-primary font-medium px-2 py-1 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="hidden md:flex gap-2 items-center">
            {isAuthenticated() ? (
              <>
                <Link to="/pdfs">
                  <Button className="px-4 py-2 font-medium">Dashboard</Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button className="px-4 py-2 font-medium" variant="outline">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="px-4 py-2 font-medium ml-2">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setOpen((o) => !o)}
              className="text-muted-foreground focus:outline-none p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {open ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="flex flex-col">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-muted-foreground hover:text-primary font-medium px-2 py-2 transition-colors text-lg"
                onClick={() => setOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <Button
              className="w-full px-4 py-2 font-medium mb-2"
              variant="outline"
            >
              Login
            </Button>
            <Button className="w-full px-4 py-2 font-medium">Sign Up</Button>
          </div>
        )}
      </nav>
    </div>
  );
}
