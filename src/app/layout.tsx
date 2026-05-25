import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Prowider - Lead Distribution System",
  description: "Real-time, concurrency-safe, and fair lead allocation system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="nav-header">
          <div className="nav-container">
            <Link href="/request-service" className="logo">
              ⚡ Prowider Mini
            </Link>
            <nav className="nav-links">
              <Link href="/request-service" className="nav-link">
                New Enquiry
              </Link>
              <Link href="/dashboard" className="nav-link">
                Provider Dashboard
              </Link>
              <Link href="/test-tools" className="nav-link">
                Testing Panel
              </Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
