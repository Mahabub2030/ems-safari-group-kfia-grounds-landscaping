import AboutSection from "./home/AboutSection";
import FeaturesSection from "./home/FeaturesSection";
import Herosections from "./home/Herosection";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Herosections />

      {/* Features Section */}
      <FeaturesSection />

      {/* About Section */}
      <AboutSection />
    </div>
  );
}
