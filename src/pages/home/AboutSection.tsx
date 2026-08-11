import logoDammam from "@/assets/imgs/dammam.jpg";
import logoSafari from "@/assets/imgs/safari.png";
import { CheckCircle2 } from "lucide-react";

const highlights = [
  "Comprehensive workforce & equipment management",
  "Real-time site status reporting and inspection logs",
  "Optimized schedule dispatching across grounds locations",
  "Customized operational dashboards for project management",
];

export default function AboutSection() {
  return (
    <section className="w-full py-16 md:py-24 px-4 md:px-8 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* Image / Graphic Container */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Image / Graphic Container */}
            <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-xl border border-border bg-background/50 p-6 flex flex-col items-center justify-center gap-4">
              <img
                src={logoSafari}
                alt="Safari Group Logo"
                className="h-1/2 w-auto object-contain"
              />
              <img
                src={logoDammam}
                alt="Dammam Logo"
                className="h-1/2 w-auto object-contain"
              />
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-primary uppercase">
                About The Project
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
                Safari Group Grounds & Landscaping Management
              </h2>
            </div>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Designed specifically for large-scale operations, our platform
              centralizes operations, field team deployments, and quality
              inspections into a unified, accessible dashboard.
            </p>

            <ul className="space-y-3 pt-2">
              {highlights.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
