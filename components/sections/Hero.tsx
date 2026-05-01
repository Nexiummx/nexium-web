import { WA_LINKS } from "@/lib/constants";
import { WaIcon } from "@/components/icons/WaIcon";
import styles from "./Hero.module.css";

function HexNet() {
  const outerNodes: [number, number][] = [
    [220, 20],
    [380, 110],
    [380, 330],
    [220, 420],
    [60, 330],
    [60, 110],
  ];
  const midNodes: [number, number][] = [
    [220, 110],
    [310, 162],
    [310, 266],
    [220, 318],
    [130, 266],
    [130, 162],
  ];
  const outerToMid: [number, number, number, number][] = [
    [220, 20, 220, 110],
    [380, 110, 310, 162],
    [380, 330, 310, 266],
    [220, 420, 220, 318],
    [60, 330, 130, 266],
    [60, 110, 130, 162],
  ];
  const midToInner: [number, number, number, number][] = [
    [220, 110, 220, 158],
    [310, 162, 262, 182],
    [310, 266, 262, 230],
    [220, 318, 220, 254],
    [130, 266, 178, 230],
    [130, 162, 178, 182],
  ];

  return (
    <svg viewBox="0 0 440 440" fill="none" aria-hidden="true">
      <polygon
        points="220,20 380,110 380,330 220,420 60,330 60,110"
        fill="none"
        stroke="#1B2F6E"
        strokeWidth="1"
        opacity="0.25"
      />
      <polygon
        points="220,60 350,135 350,285 220,360 90,285 90,135"
        fill="none"
        stroke="#1B2F6E"
        strokeWidth="1.2"
        opacity="0.18"
        style={{ animation: "hpulse 7s ease-in-out infinite", animationDelay: "0.5s" }}
      />
      <polygon
        points="220,110 310,162 310,266 220,318 130,266 130,162"
        fill="rgba(27,47,110,0.08)"
        stroke="#1B2F6E"
        strokeWidth="1.5"
        opacity="0.5"
        style={{ animation: "hpulse 5s ease-in-out infinite" }}
      />
      <polygon
        points="220,158 262,182 262,230 220,254 178,230 178,182"
        fill="rgba(27,47,110,0.2)"
        stroke="#1B2F6E"
        strokeWidth="1.8"
      />
      {outerToMid.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#1B2F6E"
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="4 4"
          style={{
            animation: `hpulse ${4 + i * 0.6}s ease-in-out infinite`,
            animationDelay: `${i * 0.3}s`,
          }}
        />
      ))}
      {midToInner.map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#1B2F6E"
          strokeWidth="1.2"
          opacity="0.4"
        />
      ))}
      {outerNodes.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="4"
          fill="#8A9BB0"
          opacity="0.5"
          style={{
            animation: `hpulse ${3 + i * 0.5}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}
      {midNodes.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="5"
          fill="none"
          stroke="#1B2F6E"
          strokeWidth="1.5"
          style={{
            animation: `hpulse ${4 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.25}s`,
          }}
        />
      ))}
      <circle cx="220" cy="206" r="8" fill="#1B2F6E" opacity="0.9" />
      <circle
        cx="220"
        cy="206"
        r="14"
        fill="none"
        stroke="#1B2F6E"
        strokeWidth="1"
        style={{ animation: "hpulse 3s ease-in-out infinite" }}
      />
      <circle
        cx="220"
        cy="206"
        r="22"
        fill="none"
        stroke="#1B2F6E"
        strokeWidth=".5"
        opacity="0.4"
        style={{ animation: "hpulse 4s ease-in-out infinite", animationDelay: "0.5s" }}
      />
    </svg>
  );
}

export function Hero() {
  return (
    <section id="hero" className={styles.section} data-st>
      <div className="bgr" aria-hidden="true" />
      <svg
        className={`${styles.deco} hpulse`}
        style={{ top: -100, right: -120, width: 500 }}
        viewBox="0 0 500 500"
        aria-hidden="true"
      >
        <polygon points="250,20 450,130 450,370 250,480 50,370 50,130" fill="none" stroke="#1B2F6E" strokeWidth="1.5" />
        <polygon points="250,60 420,160 420,340 250,440 80,340 80,160" fill="none" stroke="#1B2F6E" strokeWidth=".8" />
      </svg>
      <div className={styles.inner}>
        <div className={`${styles.grid} rv`}>
          <div>
            <div className={styles.eye}>Agencia tech · Durango</div>
            <h1 className={styles.title}>
              Tu negocio,
              <br />
              <span className="acc">digital</span>
              <br />
              y escalando.
            </h1>
            <p className={styles.sub}>
              Construimos el software que tu negocio necesita para dejar de hacer las cosas a mano y crecer sin límites
              técnicos.
            </p>
            <div className={styles.ctas}>
              <a href={WA_LINKS.hero} className="btn-p" target="_blank" rel="noopener noreferrer">
                <WaIcon /> Hablemos de tu negocio
              </a>
              <a href="#servicios" className="btn-s">
                Ver servicios ↓
              </a>
            </div>
          </div>
          <div className={styles.hexVis}>
            <HexNet />
          </div>
        </div>
      </div>
    </section>
  );
}
