import HeroSection from "./components/hero/HeroSection";
import FeaturesSection from "./components/features/FeaturesSection";
import DashboardSection from "./components/dashboard-hero/DashboardSection";

export default function Home() {
    return (
        <main>
            <HeroSection />
            <FeaturesSection />
            <DashboardSection />
        </main>
    );
}
