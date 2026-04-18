import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import style from './Landing.module.css';
import { ThemeToggle } from "../../components/ThemeToggle";

function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Set initial hidden state via JS (not CSS), so elements are visible without JS
        const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-animate]'));
        targets.forEach((t) => {
            const dir = t.dataset.animate || 'up';
            const tx = dir === 'left' ? '-48px' : dir === 'right' ? '48px' : '0px';
            const ty = dir === 'up' ? '40px' : '0px';
            t.style.opacity = '0';
            t.style.transform = `translate(${tx}, ${ty})`;
            t.style.transition = 'opacity 0.75s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.75s cubic-bezier(0.25,0.46,0.45,0.94)';
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const delay = Number((entry.target as HTMLElement).dataset.delay ?? 0);
                        setTimeout(() => {
                            (entry.target as HTMLElement).style.opacity = '1';
                            (entry.target as HTMLElement).style.transform = 'none';
                        }, delay);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0, rootMargin: '0px 0px -60px 0px' }
        );
        targets.forEach((t) => observer.observe(t));

        // Chart bars animation
        const chartTargets = Array.from(el.querySelectorAll<HTMLElement>('[data-chart]'));
        const chartObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        (entry.target as HTMLElement).classList.add(style.chartActive);
                        chartObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.2 }
        );
        chartTargets.forEach((t) => chartObserver.observe(t));

        return () => { observer.disconnect(); chartObserver.disconnect(); };
    }, []);
    return ref;
}

export function Landing() {
    const navigate = useNavigate();
    const pageRef = useScrollReveal();

    return (
        <div className={style.container} ref={pageRef}>

            {/* ── Navbar ── */}
            <nav className={style.nav}>
                <div className={style.navLogo}>
                    <span className="material-symbols-outlined">nutrition</span>
                    NutriMentor
                </div>
                <ThemeToggle className="h-9 w-9" />
            </nav>

            {/* ── Hero ── */}
            <section className={style.hero}>
                <div className={style.heroBg} />

                <div className={`${style.heroBadge} ${style.heroIn}`}>
                    <span className="material-symbols-outlined">auto_awesome</span>
                    <span>Potenciado con IA</span>
                </div>

                <h1 className={`${style.heroTitle} ${style.heroIn} ${style.heroDelay1}`}>
                    Transforma tu salud con
                    <br />
                    <span className={style.gradient}>nutrición inteligente</span>
                </h1>

                <p className={`${style.heroSubtitle} ${style.heroIn} ${style.heroDelay2}`}>
                    Registra tus comidas con una foto, obtén análisis nutricional al instante
                    y recibe asesoría personalizada de tu mentor IA.
                </p>

                <div className={`${style.heroCtas} ${style.heroIn} ${style.heroDelay3}`}>
                    <button onClick={() => navigate('/app')} className={style.ctaButton}>
                        <span>Empezar gratis</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                    <button onClick={() => navigate('/agente')} className={style.ctaButtonOutline}>
                        <span className="material-symbols-outlined">smart_toy</span>
                        <span>Ver asistente</span>
                    </button>
                </div>

                <div className={style.heroScroll}>
                    <span className="material-symbols-outlined">keyboard_arrow_down</span>
                    <span>Scroll</span>
                </div>
            </section>

            {/* ── Stats ── */}
            <div className={style.stats}>
                <div className={style.statsGrid}>
                    <div className={style.statItem} data-animate="up">
                        <div className={style.statNum}>+5k</div>
                        <div className={style.statLabel}>Comidas analizadas</div>
                    </div>
                    <div className={style.statItem} data-animate="up" data-delay="100">
                        <div className={style.statNum}>98%</div>
                        <div className={style.statLabel}>Precisión IA</div>
                    </div>
                    <div className={style.statItem} data-animate="up" data-delay="200">
                        <div className={style.statNum}>3 seg</div>
                        <div className={style.statLabel}>Por análisis</div>
                    </div>
                </div>
            </div>

            {/* ── Feature 1: foto → IA ── */}
            <div className={style.featureRow}>
                <div className={style.featureVisual} data-animate="left">
                    <div className={style.featureVisualInner}>
                        <span className="material-symbols-outlined">photo_camera</span>
                        <span className={style.featureVisualLabel}>Foto al instante</span>
                    </div>
                </div>
                <div className={style.featureContent} data-animate="right" data-delay="150">
                    <span className={style.featureTag}>
                        <span className="material-symbols-outlined">bolt</span>
                        Paso 1
                    </span>
                    <h2 className={style.featureTitle}>Toma una foto de tu plato</h2>
                    <p className={style.featureDesc}>
                        En segundos nuestra IA detecta todos los ingredientes, estima
                        porciones y calcula las calorías y macronutrientes con alta precisión.
                    </p>
                    <div className={style.featurePills}>
                        <span className={style.pill}>
                            <span className="material-symbols-outlined">check_circle</span>
                            Detección automática
                        </span>
                        <span className={style.pill}>
                            <span className="material-symbols-outlined">check_circle</span>
                            Calorías al instante
                        </span>
                        <span className={style.pill}>
                            <span className="material-symbols-outlined">check_circle</span>
                            Sin escribir nada
                        </span>
                    </div>
                </div>
            </div>

            <div className={style.divider} />

            {/* ── Feature 2: tracking ── */}
            <div className={`${style.featureRow} ${style.reverse}`}>
                <div className={style.featureVisual} data-animate="right">
                    <div className={style.chartCard} data-chart>
                        <div className={style.chartHeader}>
                            <span className={style.chartTitle}>📊 Hoy</span>
                            <span className={style.chartDate}>18 abr · 2026</span>
                        </div>
                        <div>
                            <div className={style.kcalRow}>
                                <span className={style.kcalNum}>1,840</span>
                                <span className={style.kcalLabel}>/ 2,200 kcal</span>
                            </div>
                            <div className={style.kcalTrack}>
                                <div className={style.kcalFill} style={{ '--target-w': '84%' } as React.CSSProperties} />
                            </div>
                        </div>
                        <div className={style.macroList}>
                            <div className={style.macroRow}>
                                <span className={style.macroLabel}>Proteínas</span>
                                <div className={style.macroTrack}>
                                    <div className={style.macroBar} style={{ '--target-w': '72%', '--bar-clr': '#2E7D32', animationDelay: '0.3s' } as React.CSSProperties} />
                                </div>
                                <span className={style.macroPct}>72%</span>
                            </div>
                            <div className={style.macroRow}>
                                <span className={style.macroLabel}>Carbohidr.</span>
                                <div className={style.macroTrack}>
                                    <div className={style.macroBar} style={{ '--target-w': '58%', '--bar-clr': '#43A047', animationDelay: '0.5s' } as React.CSSProperties} />
                                </div>
                                <span className={style.macroPct}>58%</span>
                            </div>
                            <div className={style.macroRow}>
                                <span className={style.macroLabel}>Grasas</span>
                                <div className={style.macroTrack}>
                                    <div className={style.macroBar} style={{ '--target-w': '45%', '--bar-clr': '#66BB6A', animationDelay: '0.7s' } as React.CSSProperties} />
                                </div>
                                <span className={style.macroPct}>45%</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={style.featureContent} data-animate="left" data-delay="150">
                    <span className={style.featureTag}>
                        <span className="material-symbols-outlined">bolt</span>
                        Paso 2
                    </span>
                    <h2 className={style.featureTitle}>Seguimiento en tiempo real</h2>
                    <p className={style.featureDesc}>
                        Visualiza tu consumo diario de calorías, proteínas, carbohidratos
                        y grasas con gráficas claras. Sabe exactamente cuánto te falta para
                        llegar a tu meta.
                    </p>
                    <div className={style.featurePills}>
                        <span className={style.pill}>
                            <span className="material-symbols-outlined">check_circle</span>
                            Meta de kcal
                        </span>
                        <span className={style.pill}>
                            <span className="material-symbols-outlined">check_circle</span>
                            Macronutrientes
                        </span>
                        <span className={style.pill}>
                            <span className="material-symbols-outlined">check_circle</span>
                            Historial del día
                        </span>
                    </div>
                </div>
            </div>

            <div className={style.divider} />

            {/* ── Feature 3: asistente ── */}
            <div className={style.featureRow}>
                <div className={style.featureVisual} data-animate="left">
                    <div className={style.featureVisualInner}>
                        <span className="material-symbols-outlined">psychology</span>
                        <span className={style.featureVisualLabel}>Mentor IA</span>
                    </div>
                </div>
                <div className={style.featureContent} data-animate="right" data-delay="150">
                    <span className={style.featureTag}>
                        <span className="material-symbols-outlined">bolt</span>
                        Paso 3
                    </span>
                    <h2 className={style.featureTitle}>Tu asistente nutricional personal</h2>
                    <p className={style.featureDesc}>
                        Chatea con un mentor IA que conoce tu historial completo. 
                        Pregunta sobre sustituciones, planes de comida o consejos 
                        específicos para tus objetivos.
                    </p>
                    <div className={style.featurePills}>
                        <span className={style.pill}>
                            <span className="material-symbols-outlined">check_circle</span>
                            Conoce tu historial
                        </span>
                        <span className={style.pill}>
                            <span className="material-symbols-outlined">check_circle</span>
                            Consejos personalizados
                        </span>
                        <span className={style.pill}>
                            <span className="material-symbols-outlined">check_circle</span>
                            Disponible 24/7
                        </span>
                    </div>
                </div>
            </div>

            {/* ── Final CTA ── */}
            <div className={style.cta}>
                <div className={style.ctaBg} />
                <h2 data-animate="up">¿Listo para empezar?</h2>
                <p data-animate="up" data-delay="100">
                    Empieza a cuidar tu nutrición de forma inteligente, sin complicaciones.
                </p>
                <div data-animate="up" data-delay="200">
                    <button onClick={() => navigate('/app')} className={style.ctaButtonSecondary}>
                        <span>Comenzar ahora</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
