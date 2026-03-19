import Link from "next/link";

const clients = [
  {
    name: "Sisel International",
    slug: "sisel",
    description: "Email Marketing & Automation",
    color: "text-green-400",
    logo: (
      <svg viewBox="0 0 120 58" className="h-14 w-auto">
        {/* Berry cluster — double helix pattern */}
        <circle cx="52" cy="3" r="2.8" fill="#6ab04c" />
        <circle cx="60" cy="3" r="2.2" fill="#6ab04c" />
        <circle cx="67" cy="3" r="1.8" fill="#6ab04c" />
        <circle cx="48" cy="9" r="2.2" fill="#6ab04c" />
        <circle cx="56" cy="9" r="3" fill="#6ab04c" />
        <circle cx="64" cy="9" r="2.5" fill="#6ab04c" />
        <circle cx="71" cy="9" r="2" fill="#6ab04c" />
        <circle cx="52" cy="15" r="2.8" fill="#6ab04c" />
        <circle cx="60" cy="15" r="3" fill="#6ab04c" />
        <circle cx="68" cy="15" r="2.2" fill="#6ab04c" />
        <circle cx="56" cy="21" r="2.5" fill="#6ab04c" />
        <circle cx="64" cy="21" r="2.8" fill="#6ab04c" />
        <circle cx="60" cy="27" r="2" fill="#6ab04c" />
        {/* Text — white for dark bg */}
        <text x="10" y="52" fontFamily="'Helvetica Neue', Arial, sans-serif" fontSize="22" fontWeight="700" fill="white" letterSpacing="5">
          sisel
        </text>
        <text x="108" y="42" fontFamily="Arial, sans-serif" fontSize="6" fill="#94a3b8">®</text>
      </svg>
    ),
  },
  {
    name: "Santa Fe Kia",
    slug: "santa_fe_kia",
    description: "Sales & Marketing Intelligence",
    color: "text-stewart-text",
    logo: (
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 62 24" className="h-7 w-auto" fill="white">
          {/* New Kia logo — connected angular letterforms */}
          {/* K */}
          <polygon points="0,24 5,24 5,14 13,24 19,24 9,12 18,0 12,0 5,10 5,0 0,0" />
          {/* I (angled) */}
          <polygon points="22,0 19,24 24,24 27,0" />
          {/* A */}
          <polygon points="30,24 35,0 40,0 49,24 44,24 42,17 34,17 33,24" />
          <polygon points="35,13 41,13 39,5 37,5" />
        </svg>
        <span className="text-base font-semibold text-white tracking-tight">Santa Fe Kia</span>
      </div>
    ),
  },
  {
    name: "UsefulWax",
    slug: "usefulwax",
    description: "Record Store Operations",
    color: "text-stewart-text",
    logo: (
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="h-8 w-8">
          <circle cx="12" cy="12" r="11" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
          <circle cx="12" cy="12" r="7" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="12" cy="12" r="3" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
          <circle cx="12" cy="12" r="1.2" fill="#e2e8f0" />
        </svg>
        <span className="text-lg font-bold text-white tracking-tight">UsefulWax</span>
      </div>
    ),
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stewart-bg flex flex-col">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-stewart-text tracking-tight">
          Powered by Stewart
        </h1>
        <p className="mt-4 text-lg text-stewart-muted max-w-xl">
          AI operations assistant for businesses.
        </p>

        <hr className="w-16 border-stewart-border my-8" />

        <p className="text-stewart-muted max-w-2xl leading-relaxed">
          Stewart is an intelligent operations layer that handles the work between your
          tools — order updates, customer notifications, inventory alerts, and more.
        </p>
        <p className="mt-4 text-stewart-muted max-w-2xl leading-relaxed">
          Built for businesses that want automation you can trust. Every action is
          auditable, every message is approved, and your data stays yours.
        </p>

        {/* Client Access */}
        <div className="mt-12">
          <p className="text-xs font-medium text-stewart-muted uppercase tracking-widest mb-6">
            Client Access
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
            {clients.map((client) => (
              <div
                key={client.slug}
                className="bg-stewart-card border border-stewart-border rounded-lg p-6 flex flex-col items-center text-center hover:border-stewart-accent/40 transition-colors"
              >
                <div className="h-14 flex items-center justify-center mb-2">
                  {client.logo}
                </div>
                <p className="text-xs text-stewart-muted">
                  {client.description}
                </p>
                <Link
                  href={client.slug === "sisel" ? "/sisel" : "/sign-in?redirect_url=/dashboard"}
                  className="mt-4 px-5 py-2 bg-stewart-accent text-white text-sm font-medium rounded-md hover:bg-stewart-accent/90 transition-colors"
                >
                  Log in
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="mt-12">
          <a
            href="mailto:spencer@getthriftyprovo.com"
            className="px-6 py-2.5 border border-stewart-border text-stewart-muted text-sm rounded-md hover:text-stewart-text hover:border-stewart-accent/40 transition-colors"
          >
            Get in touch
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stewart-border py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-stewart-muted">
            &copy; {new Date().getFullYear()} Get Thrifty Provo L.L.C.
          </p>
          <div className="flex gap-6">
            <Link href="/" className="text-xs text-stewart-muted hover:text-stewart-text transition-colors">
              Home
            </Link>
            <Link href="/privacy" className="text-xs text-stewart-muted hover:text-stewart-text transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-stewart-muted hover:text-stewart-text transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
