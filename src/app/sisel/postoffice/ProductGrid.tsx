"use client";

export const SISEL_PRODUCTS = [
  {
    id: "supradetox", name: "SupraDetox", price: "$54.95",
    badge: "Best Seller", bgColor: "#16a34a", letter: "S",
    tagline: "Full-body detox & cleanse formula",
    description: "30-day intensive cleanse that supports your body's natural detoxification pathways. Gentle enough for daily use, powerful enough to feel the difference.",
  },
  {
    id: "fucoydon", name: "Fucoydon", price: "$89.95",
    badge: "", bgColor: "#16a34a", letter: "F",
    tagline: "Premium organic fucoidan blend",
    description: "Organic fucoidan sourced from three ocean species — supports immune function, cellular health, and healthy aging. One of Sisel's most trusted formulas.",
  },
  {
    id: "eternity", name: "Eternity", price: "$69.95",
    badge: "New", bgColor: "#e11d48", letter: "E",
    tagline: "Anti-aging telomere support",
    description: "Telomere support formula with resveratrol and science-backed ingredients for cellular longevity. Because aging well starts at the cellular level.",
  },
  {
    id: "h2stix", name: "H2 Stix", price: "$39.95",
    badge: "", bgColor: "#0d9488", letter: "H",
    tagline: "Molecular hydrogen water tablets",
    description: "Drop a tablet in any glass of water for powerful antioxidant support. Molecular hydrogen is one of the smallest, most bioavailable antioxidants on earth.",
  },
  {
    id: "ript_sunburst", name: "SiselRIPT Sunburst", price: "$83.99",
    badge: "New", bgColor: "#f59e0b", letter: "R",
    tagline: "Essential amino acids — new citrus flavor",
    description: "All 9 essential amino acids in Dr. Wolfe's researched ratio. Brand new citrus flavor, same patented formula backed by $20M in research and 25 human trials. Sugar-free, 15 calories.",
  },
  {
    id: "ript_lemonberry", name: "SiselRIPT Lemon Berry", price: "$83.99",
    badge: "", bgColor: "#84cc16", letter: "R",
    tagline: "Essential amino acids — original flavor",
    description: "The original RIPT formula that started it all. Lemon Berry flavor with all 9 essential amino acids, sugar-free, sweetened with stevia only. Muscle recovery and lean muscle support.",
  },
];

// ─── Variable substitution ───────────────────────────────────────

/** Replace template variables like {product_name} and {{name}} with actual values */
export function substituteProductVariables(html: string, vars: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(vars)) {
    // Double-brace first (from Python f-string escaping), then single-brace
    result = result.replaceAll(`{{${key}}}`, value);
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

/** Build preview variables from the hero product (first selected) */
export function getPreviewVariables(selectedProducts: string[]): Record<string, string> {
  if (!selectedProducts.length) return {};
  const hero = SISEL_PRODUCTS.find((p) => p.id === selectedProducts[0]);
  if (!hero) return {};
  return {
    product_name: hero.name,
    product_description: hero.description,
    product_tagline: hero.tagline,
    price: hero.price,
    product_url: "https://sisel.net",
    name: "Sarah",  // demo preview name
  };
}

// ─── Email HTML generation ───────────────────────────────────────

export function buildProductGridHtml(productIds: string[]): string {
  const items = SISEL_PRODUCTS.filter((p) => productIds.includes(p.id));
  if (!items.length) return "";
  let rows = "";
  for (let i = 0; i < items.length; i += 2) {
    rows += "<tr>";
    for (let j = i; j < Math.min(i + 2, items.length); j++) {
      const p = items[j];
      rows += `<td width="50%" style="padding:6px;" valign="top"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:8px;border:1px solid #eee;"><tr><td style="padding:14px;text-align:center;"><div style="width:48px;height:48px;background:${p.bgColor};border-radius:50%;margin:0 auto 8px;line-height:48px;color:#fff;font-weight:700;font-size:16px;">${p.letter}</div><p style="color:#333;font-weight:600;font-size:13px;margin:0 0 4px;">${p.name}</p><p style="color:#1a5c3a;font-weight:700;font-size:14px;margin:0;">${p.price}</p></td></tr></table></td>`;
    }
    if (items.length - i === 1) rows += '<td width="50%"></td>';
    rows += "</tr>";
  }
  return `<div style="border-top:1px solid #eee;padding-top:20px;margin-top:24px;"><p style="color:#666;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin:0 0 12px;">Featured Products</p><table width="100%" cellpadding="0" cellspacing="0">${rows}</table><div style="text-align:center;margin:16px 0 0;"><a href="https://sisel.net" style="display:inline-block;padding:10px 28px;background:#1a5c3a;color:#fff;text-decoration:none;border-radius:4px;font-size:13px;font-weight:600;">Shop All Products</a></div></div>`;
}

export function injectProductsIntoEmail(html: string, gridHtml: string): string {
  if (!html || !gridHtml) return html;
  const match = html.match(/<tr>\s*<td[^>]*background:\s*#f9f9f9/);
  if (match?.index !== undefined) {
    return html.slice(0, match.index) + `<tr><td style="padding:0 32px 24px;">${gridHtml}</td></tr>` + html.slice(match.index);
  }
  return html;
}

/** Full preview pipeline: substitute variables → inject product grid */
export function buildPreviewHtml(rawHtml: string, selectedProducts: string[]): string {
  if (!rawHtml) return rawHtml;
  let html = rawHtml;
  // Substitute template variables with hero product data
  const vars = getPreviewVariables(selectedProducts);
  if (Object.keys(vars).length > 0) {
    html = substituteProductVariables(html, vars);
  }
  // Inject featured products grid (all selected)
  if (selectedProducts.length > 0) {
    const gridHtml = buildProductGridHtml(selectedProducts);
    html = injectProductsIntoEmail(html, gridHtml);
  }
  return html;
}

// ─── UI Component ────────────────────────────────────────────────

interface ProductGridProps {
  selectedProducts: string[];
  onToggle: (id: string) => void;
}

export function ProductGrid({ selectedProducts, onToggle }: ProductGridProps) {
  const hero = selectedProducts.length > 0 ? SISEL_PRODUCTS.find((p) => p.id === selectedProducts[0]) : null;

  return (
    <div className="bg-stewart-card border border-stewart-border rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stewart-text">Product Grid</h3>
        <span className="text-xs text-stewart-muted">{selectedProducts.length} selected</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {SISEL_PRODUCTS.map((p) => {
          const isSelected = selectedProducts.includes(p.id);
          const isHero = selectedProducts[0] === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onToggle(p.id)}
              className={`relative flex items-center gap-3 rounded-lg p-3 text-left transition-all ${
                isHero
                  ? "bg-stewart-accent/15 border-2 border-stewart-accent"
                  : isSelected
                    ? "bg-stewart-accent/10 border-2 border-stewart-accent/50"
                    : "bg-stewart-bg border border-stewart-border hover:border-stewart-accent/30"
              }`}
            >
              {isSelected && (
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <svg viewBox="0 0 16 16" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 8l3 3 7-7" /></svg>
                </div>
              )}
              {p.badge && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/20 text-green-400">
                  {p.badge}
                </span>
              )}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: p.bgColor }}
              >
                {p.letter}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stewart-text truncate">{p.name}</p>
                <p className="text-xs text-stewart-muted">{p.price}</p>
              </div>
            </button>
          );
        })}
      </div>
      {hero && (
        <div className="bg-stewart-accent/5 border-l-2 border-stewart-accent rounded-r-lg px-3 py-2 text-xs text-stewart-muted">
          <strong className="text-stewart-text">{hero.name}</strong> selected as hero product — template variables auto-fill with this product's details.
          {selectedProducts.length > 1 && ` + ${selectedProducts.length - 1} more in featured products grid.`}
        </div>
      )}
    </div>
  );
}
