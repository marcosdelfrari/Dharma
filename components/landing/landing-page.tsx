import "@/app/landing.css";
import { LandingMain } from "@/components/landing/landing-main";
import { LandingMotionRoot } from "@/components/landing/motion";

export function DharmaLandingPage() {
  return (
    <LandingMotionRoot>
      <div className="landing-root min-h-screen bg-background text-foreground">
        <LandingMain />
      </div>
    </LandingMotionRoot>
  );
}
