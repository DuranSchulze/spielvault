import Link from "next/link";

export const metadata = {
  title: "Library — Spiel Vault",
};

const DEMO_SPIELS = [
  {
    id: "1",
    title: "Q4 Partner Outreach Pitch",
    department: "Sales",
    tag: "Outreach",
    preview:
      "Hi [Name], I've been following your recent expansion into the APAC region. Given your focus on scalability, I thought you'd find our latest digital asset framework particularly relevant. Would you be open to a 5-minute synch next Tuesday?",
  },
  {
    id: "2",
    title: "API Downtime Empathy Statement",
    department: "Support",
    tag: "Technical",
    preview:
      "We understand how critical our services are to your daily workflow. Our engineering team is currently addressing a service interruption affecting [Service Name]. We expect full restoration by [Time] and will provide updates every 30 minutes.",
  },
  {
    id: "3",
    title: "Welcome Note: Core Team",
    department: "HR",
    tag: "Onboarding",
    preview:
      "Welcome to the family! We're thrilled to have your expertise on board. To get started, please check your onboarding portal for the first week's agenda...",
  },
  {
    id: "4",
    title: "Meeting Request: External",
    department: "Sales",
    tag: "Outreach",
    preview:
      "It was a pleasure meeting you at the summit. I'd love to continue our conversation regarding digital infrastructure. Does your schedule permit a brief call?",
  },
];

const DEPARTMENTS = ["All", "Sales", "Support", "HR"];
const TAGS = ["All Tags", "Outreach", "Technical", "Onboarding"];

export default function SpielsPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="px-8 pt-8 pb-0">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#2b3437] tracking-tight">
              Spiel Library
            </h1>
            <p className="mt-1 text-sm text-[#49636f]">
              Your curated collection of high-impact communications.
            </p>
          </div>
          <Link
            href="/spiels/new"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-white text-sm font-semibold bg-[#005db5] hover:bg-[#0052a0] transition-colors"
          >
            + New Spiel
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-6 border-b border-[#e8ecef] pb-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[#49636f] uppercase tracking-widest mr-2">
              Departments
            </span>
            {DEPARTMENTS.map((d) => (
              <button
                key={d}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  d === "All"
                    ? "bg-[#005db5] text-white"
                    : "text-[#49636f] hover:bg-[#e8ecef]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-xs font-semibold text-[#49636f] uppercase tracking-widest mr-2">
              Tags
            </span>
            {TAGS.map((t) => (
              <button
                key={t}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  t === "All Tags"
                    ? "bg-[#2b3437] text-white"
                    : "text-[#49636f] hover:bg-[#e8ecef]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Spiel list */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="flex flex-col gap-3">
          {DEMO_SPIELS.map((spiel) => (
            <div
              key={spiel.id}
              className="group bg-white border border-[#e8ecef] rounded-lg px-6 py-5 hover:border-[#005db5]/30 hover:shadow-[0_2px_12px_rgba(0,93,181,0.06)] transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold text-[#005db5] bg-[#d6e3ff]/60 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {spiel.department}
                    </span>
                    <span className="text-[10px] font-medium text-[#49636f] bg-[#e8ecef] px-2 py-0.5 rounded-full">
                      {spiel.tag}
                    </span>
                  </div>
                  <h3 className="font-display text-[15px] font-semibold text-[#2b3437] leading-snug mb-2">
                    {spiel.title}
                  </h3>
                  <p className="text-sm text-[#49636f] line-clamp-2 leading-relaxed">
                    &ldquo;{spiel.preview}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
                  <button
                    title="Copy"
                    className="p-1.5 rounded-md text-[#49636f] hover:text-[#2b3437] hover:bg-[#e8ecef] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                      <path
                        d="M1 9.50006C1 10.3285 1.67157 11.0001 2.5 11.0001H4L4 10.0001H2.5C2.22386 10.0001 2 9.7762 2 9.50006L2 2.50006C2 2.22392 2.22386 2.00006 2.5 2.00006L9.5 2.00006C9.77614 2.00006 10 2.22392 10 2.50006V4.00002H5.5C4.67158 4.00002 4 4.67159 4 5.50002V12.5C4 13.3284 4.67158 14 5.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.50002C14 4.67159 13.3284 4.00002 12.5 4.00002H11V2.50006C11 1.67163 10.3284 1.00006 9.5 1.00006H2.5C1.67157 1.00006 1 1.67163 1 2.50006V9.50006ZM5 5.50002C5 5.22388 5.22386 5.00002 5.5 5.00002H12.5C12.7761 5.00002 13 5.22388 13 5.50002V12.5C13 12.7762 12.7761 13 12.5 13H5.5C5.22386 13 5 12.7762 5 12.5V5.50002Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <Link
                    href={`/spiels/${spiel.id}`}
                    title="Edit"
                    className="p-1.5 rounded-md text-[#49636f] hover:text-[#2b3437] hover:bg-[#e8ecef] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                      <path
                        d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1465 1.14645L3.71455 8.57836C3.62459 8.66832 3.55263 8.77461 3.50251 8.89155L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10847 11.4975C6.2254 11.4474 6.3317 11.3754 6.42166 11.2855L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42166 9.28547L11.5 2.20711L12.7929 3.5L5.71455 10.5784L4.21924 11.2192L3.78081 10.7808L4.42166 9.28547Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
