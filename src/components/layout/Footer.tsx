import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background py-6">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        {/* Copyright */}
        <p className="text-xs text-muted-foreground text-center sm:text-left">
          &copy; Safari group limited (G&L). Developed by M@habub Alam, Full-Stack Developer.
        </p>

        {/* Footer Navigation Links */}
        <ul className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground sm:justify-end">
          <li>
            <Link
              to="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms & Conditions
            </Link>
          </li>
          <li>
            <Link
              to="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link
              to="/cookies"
              className="transition-colors hover:text-foreground"
            >
              Cookies Policy
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
