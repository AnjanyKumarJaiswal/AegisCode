import "./hero.css";
import StatusTag from "./StatusTag";
import Headline from "./Headline";
import Subheadline from "./Subheadline";
import CTARow from "./CTARow";
import TerminalArtifact from "./TerminalArtifact";

export default function HeroSection() {
    return (
        <>
            <section className="hero" aria-label="AegisCode Hero">
                <div className="hero-content">
                    <StatusTag />
                    <Headline />
                    <Subheadline />
                    <CTARow />
                    <TerminalArtifact />
                </div>
            </section>

            {}
            <div className="hero-separator" aria-hidden="true" />
        </>
    );
}
