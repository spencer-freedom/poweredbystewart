// The presenter's voice. Live, Spencer says the connective sentence
// between beats; sent as a URL, the page has to say it. One line, in his
// voice, at the top of a beat — never a paragraph.

export function Bridge({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-8 max-w-2xl border-l-2 border-stewart-accent/60 pl-4 text-base sm:text-lg italic leading-relaxed text-stewart-muted">
      {children}
    </p>
  );
}
