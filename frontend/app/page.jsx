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
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

// ============================================================
// DATA
// ============================================================

const EVENTS = [
  {
    artist: "aespa",
    tour: "SYNK : PARALLEL LINE",
    date: "12.09",
    venue: "INDONESIA ARENA",
    price: "950K",
    status: "ALMOST SOLD OUT",
  },
  {
    artist: "NCT 127",
    tour: "NEO CITY — THE MOMENTUM",
    date: "26.09",
    venue: "ICE BSD CITY",
    price: "850K",
    status: "PRESALE",
  },
  {
    artist: "RIIZE",
    tour: "RIIZING DAY",
    date: "10.10",
    venue: "GBK SENAYAN",
    price: "780K",
    status: "NEW",
  },
  {
    artist: "Red Velvet",
    tour: "R TO V — ENCORE",
    date: "24.10",
    venue: "INDONESIA ARENA",
    price: "820K",
    status: "PRESALE",
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
    title: "3D Seat View",
    desc: "Lihat perspektif panggung dari kursi pilihanmu sebelum membeli.",
  },
  {
    title: "Fair Queue System",
    desc: "Sistem antrean acak — bukan siapa cepat, tapi siapa beruntung.",
  },
  {
    title: "Dynamic Security",
    desc: "Kode tiket dinamis yang berganti setiap detik. Anti pemalsuan.",
  },
  {
    title: "Smart Notifications",
    desc: "Pengingat jadwal, info gate, hingga setlist di satu dashboard.",
  },
];

// ============================================================
// STYLES
// ============================================================

const STATUS_STYLES = {
  "ALMOST SOLD OUT": "bg-[#F191AC]/25 text-[#9B4963]",
  PRESALE: "border border-[#3A252D]/10 text-[#3A252D]/60",
  NEW: "bg-[#3A252D] text-[#F7EEED]",
};

// ============================================================
// MAIN
// ============================================================

export default function Home() {
  return (
    <main
      className={`${display.variable} ${accent.variable} ${body.variable} min-h-screen bg-[#F7EEED] text-[#3A252D] antialiased`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <Navbar />
      <Hero />
      <Ticker />
      <Upcoming />
      <Roster />
      <Features />
      <Footer />
    </main>
  );
}

// ============================================================
// NAVBAR
// ============================================================

function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full bg-[#F7EEED]/85 backdrop-blur-xl border-b border-[#3A252D]/8">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-10">
        <a
          href="#"
          className="text-xl tracking-[-0.08em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          sm<span className="text-[#F191AC]">Encore</span>
        </a>

        <nav className="hidden items-center gap-8 text-xs uppercase tracking-[0.18em] text-[#3A252D]/55 md:flex">
          <a
            href="#events"
            className="transition hover:text-[#3A252D]"
          >
            Events
          </a>
          <a
            href="#roster"
            className="transition hover:text-[#3A252D]"
          >
            Artists
          </a>
          <a
            href="#features"
            className="transition hover:text-[#3A252D]"
          >
            Features
          </a>
        </nav>

        <a
          href="/login"
          className="rounded-full bg-[#F191AC] px-6 py-2.5 text-xs uppercase tracking-wider text-[#3A252D] transition hover:bg-[#F6A6BB]"
        >
          Sign In
        </a>
      </div>
    </header>
  );
}

// ============================================================
// HERO
// ============================================================

function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#F7EEED] pt-24">
      <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(120deg,transparent_0%,transparent_48%,rgba(241,145,172,0.12)_48%,rgba(241,145,172,0.12)_48.2%,transparent_48.2%,transparent_100%)]" />

      <div className="relative mx-auto grid min-h-[90vh] max-w-[1400px] items-center gap-12 px-6 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <div>
          <div className="mb-8 flex items-center gap-4">
            <span className="h-px w-12 bg-[#F191AC]" />
            <span
              className="text-sm italic text-[#D66F91]"
              style={{ fontFamily: "var(--font-accent)" }}
            >
              The concert starts here.
            </span>
          </div>

          <h1
            className="max-w-4xl text-[13vw] font-semibold leading-[0.82] tracking-[-0.08em] sm:text-8xl lg:text-[8rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            SEE
            <br />
            <span className="ml-[8vw] text-[#F191AC]">THE</span>
            <br />
            SHOW.
          </h1>

          <div className="mt-10 flex max-w-xl flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <p className="max-w-sm text-sm leading-7 text-[#3A252D]/60">
              Platform tiket konser untuk fans Indonesia.
              Temukan jadwal, pilih venue, dan dapatkan tiket
              tanpa harus berpindah-pindah platform.
            </p>

            <a
              href="#events"
              className="group flex w-fit items-center gap-4"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3A252D] text-[#F7EEED] transition group-hover:bg-[#F191AC] group-hover:text-[#3A252D]">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </span>
              <span className="text-xs uppercase tracking-[0.15em]">
                Explore Events
              </span>
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[440px]">
          <div className="relative aspect-[0.72] rotate-3 overflow-hidden rounded-[2rem] bg-[#3A252D] p-7 text-[#F7EEED] shadow-2xl shadow-[#3A252D]/20 transition duration-700 hover:rotate-0">
            <div className="absolute inset-x-7 top-1/2 h-px bg-[#F4BBC9]/15" />

            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <span
                  className="text-lg"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  smEncore
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#F7EEED]/35">
                  001 / 2026
                </span>
              </div>

              <div>
                <p
                  className="mb-3 text-sm italic text-[#F6A6BB]"
                  style={{ fontFamily: "var(--font-accent)" }}
                >
                  World Tour
                </p>
                <h2
                  className="text-5xl leading-none tracking-[-0.06em]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  aespa
                </h2>

                <div className="mt-8 grid grid-cols-2 border-t border-[#F7EEED]/10 pt-5 text-xs">
                  <div>
                    <p className="mb-1 text-[#F7EEED]/35">DATE</p>
                    <p>12 SEP 2026</p>
                  </div>
                  <div>
                    <p className="mb-1 text-[#F7EEED]/35">VENUE</p>
                    <p>INDONESIA ARENA</p>
                  </div>
                </div>
              </div>

              <div className="flex items-end justify-between border-t border-[#F7EEED]/10 pt-5">
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#F7EEED]/35">
                  Official Ticket
                </span>
                <span className="flex items-center gap-2 text-xs text-[#F6A6BB]">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#F6A6BB]" />
                  LIVE
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 hidden rounded-full border border-[#3A252D]/10 bg-[#FAE6E7] px-5 py-3 text-[10px] uppercase tracking-[0.15em] shadow-lg sm:block">
            Indonesia · 2026
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TICKER
// ============================================================

function Ticker() {
  return (
    <section className="overflow-hidden border-y border-[#3A252D]/8 bg-[#F191AC] py-4">
      <div className="flex w-max animate-ticker gap-10 whitespace-nowrap">
        {[...ROSTER, ...ROSTER].map((artist, index) => (
          <div
            key={index}
            className="flex items-center gap-10 text-sm font-semibold uppercase tracking-[0.12em] text-[#3A252D]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span>{artist}</span>
            <span className="text-[#3A252D]/35">✦</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 30s linear infinite;
        }
      `}</style>
    </section>
  );
}

// ============================================================
// UPCOMING
// ============================================================

function Upcoming() {
  return (
    <section
      id="events"
      className="mx-auto max-w-[1400px] px-6 py-28 lg:px-10"
    >
      <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p
            className="mb-3 text-sm italic text-[#D66F91]"
            style={{ fontFamily: "var(--font-accent)" }}
          >
            Don&apos;t miss the next one
          </p>
          <h2
            className="text-4xl tracking-[-0.05em] md:text-6xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            UPCOMING
            <br />
            <span className="text-[#F191AC]">SHOWS.</span>
          </h2>
        </div>

        <a
          href="/events"
          className="text-xs uppercase tracking-[0.18em] text-[#3A252D]/40 transition hover:text-[#3A252D]"
        >
          View all →
        </a>
      </div>

      <div className="space-y-0">
        {EVENTS.map((event, index) => (
          <EventRow key={event.artist} event={event} index={index} />
        ))}
      </div>
    </section>
  );
}

function EventRow({ event, index }) {
  return (
    <a
      href={`/events/${event.artist.toLowerCase()}`}
      className="group grid gap-6 border-t border-[#3A252D]/10 py-6 transition hover:bg-[#FAE6E7] hover:px-4 md:grid-cols-[60px_1fr_180px_160px]"
    >
      <span className="text-xs text-[#3A252D]/30 font-medium">
        {(index + 1).toString().padStart(2, "0")}
      </span>

      <div>
        <div className="flex items-center gap-3">
          <h3
            className="text-2xl tracking-[-0.04em] transition group-hover:text-[#D66F91] md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {event.artist}
          </h3>
          <span
            className={`text-[8px] uppercase tracking-[0.15em] px-2.5 py-0.5 rounded-full ${
              STATUS_STYLES[event.status]
            }`}
          >
            {event.status}
          </span>
        </div>
        <p
          className="mt-1 text-sm italic text-[#3A252D]/50"
          style={{ fontFamily: "var(--font-accent)" }}
        >
          {event.tour}
        </p>
      </div>

      <div className="text-sm">
        <p className="text-[#3A252D]/40">{event.date}</p>
        <p className="font-medium">{event.venue}</p>
      </div>

      <div className="flex items-center justify-between md:block md:text-right">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[#3A252D]/40">
            From
          </p>
          <p
            className="mt-0.5 text-lg font-semibold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Rp {event.price}
          </p>
        </div>
        <span className="text-[#D66F91] opacity-0 transition group-hover:opacity-100">
          →
        </span>
      </div>
    </a>
  );
}

// ============================================================
// ROSTER
// ============================================================

function Roster() {
  return (
    <section
      id="roster"
      className="bg-[#3A252D] px-6 py-28 text-[#F7EEED] lg:px-10"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p
              className="mb-4 text-sm italic text-[#F6A6BB]"
              style={{ fontFamily: "var(--font-accent)" }}
            >
              The artists
            </p>
            <h2
              className="text-5xl leading-[0.9] tracking-[-0.06em] md:text-7xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ONE
              <br />
              LABEL.
              <br />
              <span className="text-[#F191AC]">MANY</span>
              <br />
              WORLDS.
            </h2>
          </div>

          <div className="grid gap-0">
            {ROSTER.map((artist, index) => (
              <div
                key={artist}
                className="group flex items-center justify-between border-b border-[#F7EEED]/10 py-5 transition hover:px-3"
              >
                <div className="flex items-center gap-6">
                  <span className="text-xs text-[#F7EEED]/30 font-medium">
                    {(index + 1).toString().padStart(2, "0")}
                  </span>
                  <span
                    className="text-xl transition group-hover:text-[#F6A6BB] md:text-2xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {artist}
                  </span>
                </div>
                <span className="text-sm text-[#F7EEED]/30 transition group-hover:text-[#F6A6BB] group-hover:translate-x-1">
                  →
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FEATURES (formerly Manifesto)
// ============================================================

function Features() {
  return (
    <section
      id="features"
      className="mx-auto max-w-[1400px] px-6 py-28 lg:px-10"
    >
      <div className="mb-16 text-center">
        <p
          className="mb-3 text-sm italic text-[#D66F91]"
          style={{ fontFamily: "var(--font-accent)" }}
        >
          Why smEncore?
        </p>
        <h2
          className="text-4xl tracking-[-0.05em] md:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          BUILT FOR
          <br />
          <span className="text-[#F191AC]">FANS.</span>
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, index) => (
          <div
            key={feature.title}
            className="group rounded-2xl border border-[#3A252D]/8 bg-[#FAE6E7] p-8 transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#3A252D]/10"
          >
            <span
              className="text-3xl font-light text-[#D66F91]/50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {(index + 1).toString().padStart(2, "0")}
            </span>
            <h3
              className="mt-4 text-lg font-semibold"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#3A252D]/55">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid gap-8 rounded-3xl border border-[#3A252D]/8 bg-[#F4BBC9]/35 p-10 backdrop-blur sm:grid-cols-3">
        <div>
          <p
            className="text-4xl font-semibold text-[#C65C7F]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            100%+
          </p>
          <p className="mt-1 text-sm text-[#3A252D]/55">Artis SM</p>
        </div>
        <div>
          <p
            className="text-4xl font-semibold text-[#C65C7F]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            #1
          </p>
          <p className="mt-1 text-sm text-[#3A252D]/55">
            Platform Tiket Fans
          </p>
        </div>
        <div>
          <p
            className="text-4xl font-semibold text-[#C65C7F]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            4.9★
          </p>
          <p className="mt-1 text-sm text-[#3A252D]/55">
            Rating Pengguna
          </p>
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
    <footer className="border-t border-[#3A252D]/10 bg-[#FAE6E7] px-6 py-12 lg:px-10">
      <div className="mx-auto flex max-w-[1400px] flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p
            className="text-2xl tracking-[-0.07em]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            sm<span className="text-[#F191AC]">Encore</span>
          </p>
          <p className="mt-2 text-xs text-[#3A252D]/45">
            A fan-made concert ticket platform.
          </p>
        </div>

        <div className="flex flex-wrap gap-6 text-xs uppercase tracking-widest text-[#3A252D]/50">
          <a href="#" className="transition hover:text-[#3A252D]">
            Instagram
          </a>
          <a href="#" className="transition hover:text-[#3A252D]">
            TikTok
          </a>
          <a href="#" className="transition hover:text-[#3A252D]">
            X
          </a>
          <a href="#" className="transition hover:text-[#3A252D]">
            Admin
          </a>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-[1400px] border-t border-[#3A252D]/8 pt-6 text-center text-[10px] uppercase tracking-widest text-[#3A252D]/30">
        © 2026 smEncore · Independen — bukan afiliasi SM Entertainment
      </div>
    </footer>
  );
} 