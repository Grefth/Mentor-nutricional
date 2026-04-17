import { useNavigate } from "react-router-dom";
import style from './Landing.module.css';

export function Landing() {
    const navigate = useNavigate();

    return (
        <div className={style.container}>
            <div className={style.hero}>
                <div className={style.heroContent}>
                    <div className={style.badge}>
                        <span className="material-symbols-outlined">stars</span>
                        <span>Tu mentor nutricional personal</span>
                    </div>
                    
                    <h1 className={style.title}>
                        Transforma tu salud con
                        <span className={style.gradient}> nutrición inteligente</span>
                    </h1>
                    
                    <p className={style.subtitle}>
                        Registra tus comidas fácilmente con IA, obtén asesoría personalizada 
                        de tu mentor nutricional y alcanza tus objetivos de salud.
                    </p>

                    <button 
                        onClick={() => navigate('/app')}
                        className={style.ctaButton}
                    >
                        <span>Probar ahora</span>
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>

                <div className={style.heroImage}>
                    <div className={style.imageCard}>
                        <span className="material-symbols-outlined" style={{ fontSize: '120px', color: 'var(--light-green)' }}>
                            nutrition
                        </span>
                    </div>
                </div>
            </div>

            <div className={style.features}>
                <h2 className={style.featuresTitle}>¿Cómo funciona?</h2>
                
                <div className={style.featuresGrid}>
                    <div className={style.featureCard}>
                        <div className={style.featureIcon}>
                            <span className="material-symbols-outlined">photo_camera</span>
                        </div>
                        <h3>Registra con foto</h3>
                        <p>Sube una foto de tu comida y nuestra IA analizará automáticamente los ingredientes y calorías</p>
                    </div>

                    <div className={style.featureCard}>
                        <div className={style.featureIcon}>
                            <span className="material-symbols-outlined">bar_chart</span>
                        </div>
                        <h3>Seguimiento en tiempo real</h3>
                        <p>Visualiza tu progreso diario de calorías, proteínas, carbohidratos y grasas de forma clara</p>
                    </div>

                    <div className={style.featureCard}>
                        <div className={style.featureIcon}>
                            <span className="material-symbols-outlined">psychology</span>
                        </div>
                        <h3>Asistente personal</h3>
                        <p>Chatea con tu mentor nutricional que conoce tu historial y te brinda consejos personalizados</p>
                    </div>
                </div>
            </div>

            <div className={style.cta}>
                <h2>¿Listo para comenzar?</h2>
                <p>Empieza a cuidar tu nutrición de forma inteligente y sencilla</p>
                <button 
                    onClick={() => navigate('/app')}
                    className={style.ctaButtonSecondary}
                >
                    <span>Comenzar gratis</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                </button>
            </div>
        </div>
    );
}
