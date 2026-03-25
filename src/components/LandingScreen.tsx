"use client";

type Experience = "crit" | "iterate";

interface LandingScreenProps {
  onSelect: (experience: Experience) => void;
}

const CARDS: {
  id: Experience;
  label: string;
  image: string;
}[] = [
  {
    id: "crit",
    label: "Book Team Design Critique",
    image: "/wave-purple.png",
  },
  {
    id: "iterate",
    label: "Continue to Iterate",
    image: "/wave-warm.png",
  },
];

export default function LandingScreen({ onSelect }: LandingScreenProps) {
  return (
    <div
      className="flex h-screen w-screen items-center justify-center"
      style={{ background: "#F2F2F2" }}
    >
      <div>
        <h1
          className="mb-6 text-black"
          style={{
            fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: "40px",
            fontWeight: 700,
            lineHeight: "48px",
            letterSpacing: "0.37px",
          }}
        >
          What do you want to do today?
        </h1>

        <div className="flex gap-12">
          {CARDS.map((card) => (
            <button
              key={card.id}
              onClick={() => onSelect(card.id)}
              className="group flex w-[409px] flex-col gap-4 text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99]"
              style={{ background: "none", border: "none", padding: 0 }}
            >
              {/* Image card */}
              <div
                className="relative overflow-hidden"
                style={{
                  width: "409px",
                  height: "307px",
                  borderRadius: "12px",
                }}
              >
                {/* Wave image — large asset cropped to show the richest region */}
                <div
                  style={{
                    position: "absolute",
                    width: "1769px",
                    height: "995px",
                    left: "-680px",
                    top: "-344px",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.image}
                    alt=""
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                {/* Hover overlay */}
                <div
                  className="absolute inset-0 bg-black opacity-0 transition-opacity duration-200 group-hover:opacity-[0.04]"
                />
              </div>

              {/* Label */}
              <span
                className="text-black"
                style={{
                  fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
                  fontSize: "16px",
                  fontWeight: 700,
                  lineHeight: "24px",
                  letterSpacing: "-0.31px",
                }}
              >
                {card.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
