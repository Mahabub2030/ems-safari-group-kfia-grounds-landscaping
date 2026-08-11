import { ClipboardCheck, ShieldCheck, TreePine, Users } from "lucide-react";

const features = [
  {
    icon: TreePine,
    title: "Grounds & Landscaping",
    description:
      "Real-time monitoring and scheduling for campus grounds, irrigation, and facility maintenance.",
  },
  {
    icon: Users,
    title: "Workforce Operations",
    description:
      "Manage staff schedules, track on-site attendance, and assign daily operational tasks seamlessly.",
  },
  {
    icon: ClipboardCheck,
    title: "Task Tracking & EMS",
    description:
      "Automated work order creation, completion verification, and asset tracking.",
  },
  {
    icon: ShieldCheck,
    title: "Quality & Compliance",
    description:
      "Ensure all landscaping and grounds maintenance meet client and safety standards.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-slate-50 dark:bg-slate-900/50 px-4 md:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            Key Platform Features
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Streamlining airport grounds landscaping operations with automated
            tools and real-time tracking.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-6 bg-background rounded-2xl border border-border/50 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
