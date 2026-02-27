import type { Metadata } from 'next';
import productAwardsData from '@/data/productAwards.json';
import type { ProductAwardsData } from '@/types';
import AwardsClient from '@/components/awards/AwardsClient';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://littleleaps.com';

export const metadata: Metadata = {
  title: 'Baby Product Awards 2026 — Gold & Silver Winners',
  description:
    'The Little Leaps Baby Awards 2026 — Gold and Silver winners for the best baby products, expert-tested across Diapers, Strollers, Baby Skincare, Feeding Products, Baby Monitors, and Toys. Find the safest, highest-rated products for your baby.',
  keywords: [
    'baby awards 2026', 'best baby products 2026', 'baby product awards',
    'best diapers', 'best stroller', 'best baby monitor', 'best baby skincare',
    'best baby feeding products', 'best baby toys', 'little leaps baby awards',
  ],
  alternates: { canonical: `${BASE_URL}/awards` },
  openGraph: {
    title: 'Little Leaps Baby Awards 2026 — Best Baby Products',
    description:
      'Expert-tested Gold & Silver award winners for the best baby products across every essential category.',
    url: `${BASE_URL}/awards`,
  },
};

const data = productAwardsData as ProductAwardsData;

// Build JSON-LD ItemList from award data
function buildAwardsSchema() {
  const items: object[] = [];
  let position = 1;

  for (const [year, categories] of Object.entries(data)) {
    for (const [category, awards] of Object.entries(categories as Record<string, { gold: { name: string; brand: string; description: string }; silver: { name: string; brand: string; description: string } }>)) {
      if (awards.gold) {
        items.push({
          '@type': 'ListItem',
          position: position++,
          name: `${awards.gold.brand} ${awards.gold.name} — ${year} ${category} Gold Award`,
          description: awards.gold.description,
          url: `${BASE_URL}/awards`,
        });
      }
      if (awards.silver) {
        items.push({
          '@type': 'ListItem',
          position: position++,
          name: `${awards.silver.brand} ${awards.silver.name} — ${year} ${category} Silver Award`,
          description: awards.silver.description,
          url: `${BASE_URL}/awards`,
        });
      }
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Little Leaps Baby Awards 2026',
    description: 'Expert-tested Gold and Silver award winners for the best baby products.',
    url: `${BASE_URL}/awards`,
    numberOfItems: items.length,
    itemListElement: items,
  };
}

export default function AwardsPage() {
  return (
    <div className="section-padding page-padding">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildAwardsSchema()) }}
      />
      <div className="max-w-6xl mx-auto">

        {/* Page header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-blush-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-blush-500" viewBox="0 0 32 32" fill="none"
                   aria-hidden="true">
                <path d="M10 28h12M16 28v-6" stroke="currentColor" strokeWidth="1.8"
                      strokeLinecap="round"/>
                <path d="M10 8h12v8a6 6 0 01-12 0V8z" stroke="currentColor" strokeWidth="1.8"
                      strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 12H7a2 2 0 000 4h3M22 12h3a2 2 0 010 4h-3"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
            Little Leaps Baby Awards 2026
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Our expert team tests hundreds of baby products each year. These are the Gold and
            Silver Award winners — the very best across every essential category.
          </p>
        </div>

        {/* Awards grid with dropdowns */}
        <AwardsClient data={data} />

        {/* Bottom CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-lavender-50 to-blush-50
                        rounded-3xl p-8">
          <p className="text-gray-700 font-semibold mb-2">Wondering where your baby is at?</p>
          <p className="text-gray-500 text-sm mb-5">
            Take our free milestone quiz and get a personalised development report for your
            baby&apos;s current stage.
          </p>
          <a href="/quiz"
             className="inline-block bg-gradient-to-r from-blush-500 to-lavender-500 text-white
                        font-bold px-6 py-3 rounded-full text-sm hover:from-blush-600
                        hover:to-lavender-600 transition-all focus:outline-none
                        focus-visible:ring-2 focus-visible:ring-blush-400 focus-visible:ring-offset-2">
            Take the Milestone Quiz
          </a>
        </div>
      </div>
    </div>
  );
}
