import Link from "next/link";

const clients = [
  {
    name: "Sisel International",
    slug: "sisel",
    description: "Email Marketing & Automation",
    color: "text-green-400",
  },
  {
    name: "Santa Fe Kia",
    slug: "santa_fe_kia",
    description: "Sales & Marketing Intelligence",
    color: "text-stewart-text",
  },
  {
    name: "UsefulWax",
    slug: "usefulwax",
    description: "Record Store Operations",
    color: "text-stewart-text",
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
                <h3 className={`text-lg font-semibold ${client.color}`}>
                  {client.name}
                </h3>
                <p className="text-xs text-stewart-muted mt-1">
                  {client.description}
                </p>
                <Link
                  href="/sign-in"
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
