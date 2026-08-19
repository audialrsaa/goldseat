// ============================================================
// IMPORTS & FONTS
// ============================================================
import { Unbounded, Fraunces, Plus_Jakarta_Sans } from "next/font/google";

const display = Unbounded({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const accent = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic"],
  variable: "--font-accent",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

// ============================================================
// TYPES
// ============================================================
type Tag = "presale" | "baru dibuka" | "hampir habis";

interface Event {
  id: string;
  artist: string;
  tour: string;
  date: string;
  month: string;
  venue: string;
  price: string;
  tag: Tag;
}

// ============================================================
// DATA
// ============================================================
const EVENTS: Event[] = [
  {
    id: "aespa",
    artist: "aespa",
    tour: "Synk : Parallel Line",
    date: "12",
    month: "SEP",
    venue: "Indonesia Arena, GBK",
    price: "Rp 950.000",
    tag: "hampir habis",
  },
  {
    id: "nct127",
    artist: "NCT 127",
    tour: "Neo City — The Momentum",
    date: "26",
    month: "SEP",
    venue: "ICE BSD City",
    price: "Rp 850.000",
    tag: "presale",
  },
  {
    id: "riize",
    artist: "RIIZE",
    tour: "Riizing Day World Tour",
    date: "10",
    month: "OKT",
    venue: "GBK Senayan",
    price: "Rp 780.000",
    tag: "baru dibuka",
  },
  {
    id: "redvelvet",
    artist: "Red Velvet",
    tour: "R to V — Encore",
    date: "24",
    month: "OKT",
    venue: "Indonesia Arena, GBK",
    price: "Rp 820.000",
    tag: "presale",
  },
  {
    id: "exo",
    artist: "EXO",
    tour: "Exist On Stage",
    date: "08",
    month: "NOV",
    venue: "ICE BSD City",
    price: "Rp 990.000",
    tag: "hampir habis",
  },
  {
    id: "shinee",
    artist: "SHINee",
    tour: "Shining Diamond",
    date: "22",
    month: "NOV",
    venue: "GBK Senayan",
    price: "Rp 870.000",
    tag: "baru dibuka",
  },
];

const ROSTER = [
  "TVXQ",
  "SUPER JUNIOR",
  "GIRLS' GENERATION",
  "SHINee",
  "EXO",
  "RED VELVET",
  "NCT",
  "aespa",
  "RIIZE",
];

const FEATURES = [
  {
    title: "Kursi, Bukan Tebakan",
    desc: "Peta duduk 3D — lihat sudut panggung persis sebelum bayar.",
  },
  {
    title: "War Tiket yang Adil",
    desc: "Sistem antrean acak, bukan siapa cepat dia dapat.",
  },
  {
    title: "Anti Palsu",
    desc: "Kode dinamis di setiap tiket, berganti tiap detik.",
  },
  {
    title: "All-in-One",
    desc: "Notifikasi jadwal, gate, sampai setlist di satu tempat.",
  },
];

const NAV = [
  { label: "Jadwal", href: "#events" },
  { label: "Artis", href: "#roster" },
  { label: "Fitur", href: "#features" },
];

// ============================================================
// STYLES
// ============================================================
const TAG_STYLES: Record<Tag, string> = {
  presale: "bg-[#F4BBC9] text-[#2A0F1B]",
  "baru dibuka": "border border-[#F7EEED]/30 text-[#F7EEED] bg-transparent",
  "hampir habis": "bg-[#F191AC] text-[#2A0F1B]",
};

// ============================================================
// MAIN
// ============================================================
export default function Home() {
  return (
    <main
      className={`${display.variable} ${accent.variable} ${body.variable} bg-[#F7EEED] text-[#2A0F1B] antialiased`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <Header />
      <Hero />
      <Events />
      <Roster />
      <Features />
      <Footer />
    </main>
  );
}

// ============================================================
// HEADER
// ============================================================
function Header() {
  return (
    <header className="fixed top-0 z-50 w-full bg-[#180810]/90 backdrop-blur-md border-b border-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />
        <NavLinks />
        <AuthButton />
      </div>
    </header>
  );
}

function Logo() {
  return (
    <span
      className="text-lg font-semibold tracking-tight text-[#F7EEED]"
      style={{ fontFamily: "var(--font-display)" }}
    >
      sm<span className="text-[#F191AC]">Encore</span>
    </span>
  );
}

function NavLinks() {
  return (
    <nav className="hidden gap-8 text-sm text-[#F7EEED]/60 md:flex">
      {NAV.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="transition-colors hover:text-[#F7EEED]"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

function AuthButton() {
  return (
    <a
      href="#"
      className="rounded-full border border-[#F191AC]/40 px-5 py-1.5 text-sm text-[#F7EEED] transition-all hover:bg-[#F191AC] hover:text-[#2A0F1B]"
    >
      Masuk
    </a>
  );
}

// ============================================================
// HERO
// ============================================================
function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#180810] pt-20">
      <HeroGlow />

      <div className="relative mx-auto flex min-h-[80vh] max-w-6xl flex-col items-center justify-center px-6 text-center">
        <Badge text="Tiket Resmi, Panggung Sungguhan" />
        <HeroTitle />
        <HeroDescription />
        <HeroActions />
      </div>

      <Marquee />
    </section>
  );
}

function HeroGlow() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div
        className="absolute left-[10%] top-0 h-3/4 w-1/4 opacity-10"
        style={{
          background: "linear-gradient(180deg, #F191AC, transparent)",
          transform: "skewX(-10deg)",
        }}
      />
      <div
        className="absolute right-[10%] top-0 h-3/4 w-1/5 opacity-10"
        style={{
          background: "linear-gradient(180deg, #F6A6BB, transparent)",
          transform: "skewX(10deg)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[100px]"
        style={{ background: "radial-gradient(#F191AC, transparent)" }}
      />
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span
      className="text-sm text-[#F6A6BB]"
      style={{ fontFamily: "var(--font-accent)", fontStyle: "italic" }}
    >
      {text}
    </span>
  );
}

function HeroTitle() {
  return (
    <h1
      className="mt-4 max-w-3xl text-4xl leading-[1.1] text-[#F7EEED] md:text-6xl"
      style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
    >
      Setiap Konser Layak
      <br />
      <span className="text-[#F191AC]">Satu Encore Lagi.</span>
    </h1>
  );
}

function HeroDescription() {
  return (
    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#F7EEED]/50">
      Tiket resmi untuk semua artis SM Entertainment. Dari presale sampai gate,
      tanpa drama.
    </p>
  );
}

function HeroActions() {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <a
        href="#events"
        className="rounded-full bg-[#F191AC] px-8 py-3 text-sm font-medium text-[#2A0F1B] transition hover:bg-[#F6A6BB]"
      >
        Lihat Jadwal
      </a>
      <a
        href="#features"
        className="rounded-full border border-[#F7EEED]/20 px-8 py-3 text-sm text-[#F7EEED] transition hover:border-[#F7EEED]/50"
      >
        Pelajari
      </a>
    </div>
  );
}

// ============================================================
// MARQUEE
// ============================================================
function Marquee() {
  return (
    <div className="border-t border-[#F7EEED]/10 py-4">
      <div className="flex animate-marquee gap-8 whitespace-nowrap text-sm tracking-[0.3em] text-[#F7EEED]/30">
        {[...ROSTER, ...ROSTER].map((name, i) => (
          <span key={i} className="flex items-center gap-8">
            {name}
            <span className="text-[#F191AC]/40">◆</span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

// ============================================================
// EVENTS
// ============================================================
function Events() {
  return (
    <section id="events" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeader
        label="Jangan Sampai Kehabisan"
        title="Jadwal Konser"
        action="Lihat Semua →"
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {EVENTS.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
}

function SectionHeader({
  label,
  title,
  action,
}: {
  label: string;
  title: string;
  action?: string;
}) {
  return (
    <div className="mb-10 flex items-end justify-between">
      <div>
        <span
          className="text-sm text-[#F191AC]"
          style={{ fontFamily: "var(--font-accent)", fontStyle: "italic" }}
        >
          {label}
        </span>
        <h2
          className="text-3xl font-semibold md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h2>
      </div>
      {action && (
        <a href="#" className="text-sm text-[#2A0F1B]/40 hover:text-[#F191AC]">
          {action}
        </a>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  return (
    <div className="group rounded-2xl border border-[#2A0F1B]/8 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <span className={`rounded-full px-3 py-0.5 text-xs font-medium uppercase ${TAG_STYLES[event.tag]}`}>
            {event.tag}
          </span>
          <h3
            className="mt-2 text-xl font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {event.artist}
          </h3>
          <p
            className="text-sm text-[#2A0F1B]/50"
            style={{ fontFamily: "var(--font-accent)", fontStyle: "italic" }}
          >
            {event.tour}
          </p>
        </div>
        <div className="text-right">
          <div
            className="text-2xl font-semibold leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {event.date}
          </div>
          <div className="mt-1 text-xs tracking-widest text-[#2A0F1B]/30">
            {event.month}
          </div>
        </div>
      </div>

      <hr className="my-4 border-dashed border-[#2A0F1B]/10" />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#2A0F1B]/50">{event.venue}</p>
          <p className="text-sm font-semibold text-[#F191AC]">{event.price}</p>
        </div>
        <button className="rounded-full bg-[#2A0F1B] px-4 py-2 text-xs font-medium text-[#F7EEED] transition group-hover:bg-[#F191AC] group-hover:text-[#2A0F1B]">
          Pesan
        </button>
      </div>
    </div>
  );
}

// ============================================================
// ROSTER
// ============================================================
function Roster() {
  return (
    <section id="roster" className="bg-[#2A0F1B] py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <span
          className="text-sm text-[#F6A6BB]"
          style={{ fontFamily: "var(--font-accent)", fontStyle: "italic" }}
        >
          Satu Panggung, Semua Label
        </span>
        <h2
          className="mt-1 text-3xl font-semibold text-[#F7EEED]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Seluruh Artis SM
        </h2>
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-4 text-sm text-[#F7EEED]/50 sm:grid-cols-4">
          {ROSTER.map((name) => (
            <span
              key={name}
              className="transition-colors hover:text-[#F7EEED]"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FEATURES
// ============================================================
function Features() {
  return (
    <section id="features" className="bg-[#FAE6E7] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 text-center">
          <span
            className="text-sm text-[#F191AC]"
            style={{ fontFamily: "var(--font-accent)", fontStyle: "italic" }}
          >
            Kenapa smEncore
          </span>
          <h2
            className="mt-1 text-3xl font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Dibangun untuk Fans
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((item, i) => (
            <div key={item.title} className="border-t border-[#2A0F1B]/10 pt-4">
              <span className="text-xs tracking-widest text-[#F191AC]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3
                className="mt-2 text-base font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-[#2A0F1B]/50">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER
// ============================================================
function Footer() {
  return (
    <footer className="bg-[#180810] py-12 text-[#F7EEED]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-[#F7EEED]/40">
              Tiket resmi konser SM.
            </p>
          </div>
          <FooterLinks title="Jelajahi" items={["Jadwal", "Artis", "Venue"]} />
          <FooterLinks title="Bantuan" items={["FAQ", "Refund", "Kontak"]} />
          <FooterLinks title="Sosial" items={["Instagram", "TikTok", "X"]} />
        </div>

        <div className="mt-10 border-t border-[#F7EEED]/10 pt-6 text-center text-xs text-[#F7EEED]/30">
          © 2026 smEncore. Independen — bukan afiliasi SM Entertainment.
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-[#F6A6BB]">{title}</h4>
      <ul className="space-y-1.5 text-sm text-[#F7EEED]/40">
        {items.map((item) => (
          <li key={item}>
            <a href="#" className="transition-colors hover:text-[#F7EEED]">
              {item}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}