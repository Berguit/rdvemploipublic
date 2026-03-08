import Navbar from '@/components/navbar';
import HeroSection from '@/components/hero-section';
import MapRegionsSection from '@/components/map-regions-section';
import LatestJobs from '@/components/latest-jobs';
import StatsSection from '@/components/stats-section';
import ToolsSection from '@/components/tools-section';
import Footer from '@/components/footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <MapRegionsSection />
        <LatestJobs />
        <StatsSection />
        <ToolsSection />
      </main>
      <Footer />
    </div>
  );
}