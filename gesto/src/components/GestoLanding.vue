<template>
  <div class="gesto-app">
    <!-- Fons animat amb blobs -->
    <div class="bg-blobs">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="container">
      <nav>
        <div class="logo" @click="simularNav('home')">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M9,2C7.9,2 7,2.9 7,4V17H5V5C5,4.45 4.55,4 4,4C3.45,4 3,4.45 3,5V17C3,19.2 4.8,21 7,21H13.5C15.42,21 17.55,20.03 18.9,18.66L20.8,16.76C21.18,16.38 21.18,15.75 20.8,15.36L19.4,13.96C19,13.58 18.4,13.58 18,13.96L17,14.96V8C17,7.45 16.55,7 16,7C15.45,7 15,7.45 15,8V12H13V3C13,2.45 12.55,2 12,2C11.45,2 11,2.45 11,3V12H9V2Z" />
          </svg>
          GESTO
        </div>
        <div class="nav-links">
          <template v-if="user">
            <span class="user-greeting">Hola, {{ user.name }}</span>
            <button @click="logout" class="btn-logout">TANCAR SESSIÓ</button>
          </template>
          <template v-else>
            <button @click="simularNav('login')">INICIAR SESSIÓ</button>
          </template>
        </div>
      </nav>
    </div>

    <transition name="fade" mode="out-in">
      
      <div v-if="paginaActual === 'home'" key="home">
        <header class="hero">
          <div class="container">
            <h1 data-aos="fade-up" data-aos-duration="1000">Trenca les barreres<br>del so.</h1>
            <p data-aos="fade-up" data-aos-delay="200">Traducció de Llengua de Signes a veu i text en temps real mitjançant Intel·ligència Artificial. El teu intèrpret de butxaca.</p>
            
            <div data-aos="zoom-in" data-aos-delay="400">
              <button class="btn-primary" @click="simularNav('traductor')">
                COMENÇAR A TRADUIR
              </button>
            </div>

            <br>
            <div class="scroll-indicator floating-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
              </svg>
            </div>
          </div>
        </header>

        <section class="info-section">
          <div class="container">
            
            <div class="info-grid">
              <div class="visual-placeholder" data-aos="fade-right">
                <img 
                  src="https://www.magisnet.com/wp-content/uploads/2023/09/signos.jpg" 
                  alt="Aprendre llengua de signes" 
                  class="feature-image"
                >
              </div>
              <div class="info-content" data-aos="fade-left">
                <h2>Aprèn amb GESTO</h2>
                <p>No només traduïm, t'ajudem a connectar. Practica el teu abecedari i frases quotidianes amb la nostra IA que et corregirà en temps real mentre aprens.</p>
                <button class="btn-primary small" @click="simularNav('tutorial')">ACCEDIR AL TUTORIAL</button>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-content" data-aos="fade-right">
                <h2>La necessitat de comprendre</h2>
                <p>En hospitals o situacions d'emergència, la manca d'intèrprets crea murs invisibles. GESTO elimina l'escletxa comunicativa quan més ho necessites.</p>
              </div>
              <div class="visual-placeholder" data-aos="fade-left">
                <img 
                  src="https://www.assersum.com/content/images/2024/09/Sin-t-tulo-2.png" 
                  alt="Barreras de comunicación" 
                  class="feature-image"
                >
              </div>
            </div>

            <div class="info-grid">
              <div class="visual-placeholder" data-aos="fade-right">
                 <img 
                  src="https://media2.dev.to/dynamic/image/width=800%2Cheight=%2Cfit=scale-down%2Cgravity=auto%2Cformat=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fepgmhwtajlp6xbx5ckvm.png" 
                  alt="Intel·ligència Artificial i Algoritmes" 
                  class="feature-image"
                >
              </div>
              <div class="info-content" data-aos="fade-left">
                <h2>Tecnologia invisible</h2>
                <p>Sense sensors extra. Sense configuracions complexes. Només la càmera del teu mòbil i el nostre motor d'IA que tradueix gestos a paraules a l'instant.</p>
                <button class="btn-outline" @click="simularNav('com-funciona')">VEURE COM FUNCIONA</button>
              </div>
            </div>

          </div>
        </section>

        <footer>
          <div class="container">
            <template v-if="!user">
              <p class="footer-cta">Vols guardar el teu historial?</p>
              <div class="footer-links">
                <a href="#" @click.prevent="simularNav('login')">Iniciar Sessió</a>
                <span class="separator">|</span>
                <a href="#" @click.prevent="simularNav('registre')">Crear Compte</a>
              </div>
            </template>
            <template v-else>
               <p class="footer-cta">Preparat per comunicar-te?</p>
               <div class="footer-links">
                  <a href="#" @click.prevent="simularNav('traductor')">COMENÇAR A TRADUIR</a>
               </div>
            </template>
            </div>
        </footer>
      </div>

      <div v-else-if="paginaActual === 'com-funciona'" key="com-funciona" class="how-it-works-view">
        <div class="container">
          <button class="btn-back" @click="simularNav('home')">← Tornar</button>
          
          <header class="section-header" data-aos="fade-down">
            <h1>Com funciona <span class="text-highlight">GESTO</span>?</h1>
            <p class="subtitle">Tecnologia avançada, ús senzill.</p>
          </header>

          <div class="gif-container" data-aos="zoom-in">
             <img 
               src="https://raw.githubusercontent.com/gist/TheJLifeX/74958cc59db477a91837244ff598ef4a/raw/088f3995801c58f79f0a79086f1cd4cc176396d3/00-hand-gesture-recognition.gif" 
               alt="GIF demostración" 
               class="demo-gif"
             >
          </div>

          <div class="steps-explanation" data-aos="fade-up">
            <div class="step-item">
              <div class="step-number">01</div>
              <h3>Captura</h3>
              <p>Obre l'aplicació i apunta amb la càmera. El sistema detecta els punts clau de les teves mans automàticament.</p>
            </div>
            <div class="step-item">
              <div class="step-number">02</div>
              <h3>Processament</h3>
              <p>El nostre motor d'Intel·ligència Artificial analitza el moviment i la posició dels dits en temps real.</p>
            </div>
            <div class="step-item">
              <div class="step-number">03</div>
              <h3>Traducció</h3>
              <p>A l'instant, els gestos es converteixen en text a la pantalla com si fossin subtitols en temps real.</p>
            </div>
          </div>
        </div>
      </div>

    </transition>
  </div>
</template>

<script>
import AOS from 'aos';
import 'aos/dist/aos.css';

export default {
  name: 'GestoLanding',
  data() {
    return {
      paginaActual: 'home',
      user: null
    }
  },
  mounted() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token) {
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch (e) {
          console.error('Error parsing user data', e);
        }
      } else {
         this.user = { name: 'Usuari' }; 
      }
    }

    AOS.init({
      offset: 100,
      duration: 800,
      easing: 'ease-out-cubic',
      once: true
    });
  },
  methods: {
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.user = null;
      this.paginaActual = 'home';
      this.$router.push('/');
    },
    simularNav(desti) {
      if (desti === 'traductor') {
        this.$router.push('/Camara');
      } else if (desti === 'login') {
        this.$router.push('/login');
      } else if (desti === 'registre') {
        this.$router.push('/register');
      } else if (desti === 'tutorial') {
        this.$router.push('/aprendre');
      } else {
        this.paginaActual = desti;
        setTimeout(() => {
          window.scrollTo(0,0);
          AOS.refresh();
        }, 100);
      }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Roboto+Mono:wght@400&display=swap');

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease, transform 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(10px); }

.floating-arrow { animation: bounce 2s infinite; }
@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

/* FONS AMB BLOBS */
.bg-blobs {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.blob {
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(0, 191, 255, 0.15) 0%, rgba(0, 191, 255, 0) 70%);
  border-radius: 50%;
  filter: blur(80px);
  animation: move-blobs 20s infinite alternate ease-in-out;
}

.blob-1 { top: -10%; left: -10%; background: radial-gradient(circle, rgba(0, 191, 255, 0.2) 0%, rgba(0, 191, 255, 0) 70%); }
.blob-2 { bottom: -10%; right: -10%; background: radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(124, 58, 237, 0) 70%); animation-delay: -5s; }
.blob-3 { top: 40%; left: 30%; background: radial-gradient(circle, rgba(0, 191, 255, 0.1) 0%, rgba(0, 191, 255, 0) 70%); animation-delay: -10s; }

@keyframes move-blobs {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(100px, 50px) scale(1.1); }
  100% { transform: translate(-50px, 100px) scale(0.9); }
}

.gesto-app {
  font-family: 'Inter', sans-serif;
  background-color: #0a0a0a; 
  color: #E0E0E0; 
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden; 
  position: relative;
}

.gesto-app > div:not(.bg-blobs) {
  position: relative;
  z-index: 1;
}

* { box-sizing: border-box; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 0; height: 80px; }
.logo { font-size: 1.5rem; font-weight: 800; letter-spacing: 2px; color: #fff; text-transform: uppercase; display: flex; align-items: center; gap: 10px; cursor: pointer; }
.icon { width: 24px; height: 24px; fill: #00BFFF; }
.nav-links button { background: none; border: none; color: #A0A0A0; font-weight: 600; cursor: pointer; margin-left: 20px; font-size: 0.9rem; transition: color 0.3s; }
.nav-links button:hover { color: #fff; }

.user-greeting { color: #fff; margin-right: 20px; font-weight: 500; }
.btn-logout { background: none; border: 1px solid #333; color: #A0A0A0; font-weight: 600; cursor: pointer; padding: 8px 16px; border-radius: 4px; font-size: 0.9rem; transition: all 0.3s; }
.btn-logout:hover { border-color: #ffca28; color: #ffca28; }

.hero { height: 85vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative; background: radial-gradient(circle at center, #1e1e1e 0%, #121212 70%); }
.hero h1 { 
  font-size: 4rem; 
  font-weight: 800; 
  line-height: 1.1; 
  margin-bottom: 24px; 
  background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%); 
  -webkit-background-clip: text; 
  background-clip: text; 
  -webkit-text-fill-color: transparent; 
  color: transparent; 
  letter-spacing: -1px;
}
.hero p { font-size: 1.25rem; color: #A0A0A0; max-width: 600px; margin: 0 auto 48px auto; }
.scroll-indicator { margin-top: 60px; opacity: 0.5; }

.btn-primary { 
  background: linear-gradient(135deg, #00BFFF 0%, #0080FF 100%); 
  color: #000; 
  padding: 18px 48px; 
  font-size: 1.1rem; 
  font-weight: 800; 
  border: none; 
  border-radius: 50px; 
  cursor: pointer; 
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
  box-shadow: 0 10px 30px rgba(0, 191, 255, 0.3); 
  text-transform: uppercase; 
  letter-spacing: 2px; 
}
.btn-primary:hover { 
  background: linear-gradient(135deg, #33CFFF 0%, #00BFFF 100%); 
  box-shadow: 0 15px 40px rgba(0, 191, 255, 0.5); 
  transform: translateY(-5px) scale(1.02); 
}
.btn-primary.small { padding: 14px 32px; font-size: 0.95rem; margin-top: 15px; }

.btn-outline { border: 1px solid #333; background: transparent; color: #fff; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-weight: 600; margin-top: 20px; font-size: 0.9rem; }
.btn-outline:hover { border-color: #fff; }

.info-section { padding: 100px 0; background-color: #0f0f0f; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; margin-bottom: 120px; }

.info-content h2 { font-size: 2.5rem; margin-bottom: 20px; color: #fff; font-weight: 800; }
.info-content p { color: #888; margin-bottom: 30px; font-size: 1.1rem; max-width: 500px; }

.visual-placeholder { 
  width: 100%; 
  height: 400px; 
  background: rgba(255, 255, 255, 0.03); 
  border-radius: 20px; 
  overflow: hidden; 
  border: 1px solid rgba(255, 255, 255, 0.08); 
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 40px rgba(0,0,0,0.4); 
}
.feature-image { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; transition: transform 0.5s ease; }
.visual-placeholder:hover .feature-image { transform: scale(1.05); }

footer { padding: 60px 0; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05); background-color: rgba(10, 10, 10, 0.8); backdrop-filter: blur(10px); }
.footer-cta { color: #fff; font-size: 1.2rem; margin-bottom: 20px; }
.footer-links { display: flex; justify-content: center; gap: 30px; margin-bottom: 30px; }
.footer-links a { color: #666; text-decoration: none; font-size: 0.9rem; transition: color 0.3s; }
.footer-links a:hover { color: #00BFFF; }
.separator { color: #333; }

/* VISTAS INTERNAS */
.how-it-works-view, .tutorial-view { min-height: 100vh; padding-bottom: 80px; }
.btn-back { background: none; border: none; color: #666; font-size: 1rem; cursor: pointer; margin: 20px 0; display: inline-flex; align-items: center; transition: color 0.3s; }
.btn-back:hover { color: #00BFFF; }
.section-header { text-align: center; margin-bottom: 40px; }
.section-header h1 { font-size: 2.5rem; color: #fff; font-weight: 800; }
.text-highlight { color: #00BFFF; }

.gif-container { max-width: 600px; margin: 0 auto 60px auto; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1); background: #000; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
.demo-gif { width: 100%; height: auto; display: block; }

.steps-explanation { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; max-width: 1000px; margin: 0 auto; }
.step-item { 
  background: rgba(255, 255, 255, 0.03); 
  padding: 40px 30px; 
  border-radius: 20px; 
  border: 1px solid rgba(255, 255, 255, 0.08); 
  backdrop-filter: blur(10px);
  text-align: center; 
  transition: transform 0.3s ease, border-color 0.3s ease;
}
.step-item:hover {
  transform: translateY(-10px);
  border-color: rgba(0, 191, 255, 0.3);
}
.step-number { font-family: 'Roboto Mono', monospace; font-size: 2.5rem; color: #00BFFF; margin-bottom: 15px; opacity: 0.4; }

/* RESPONSIVE MÓVIL */
@media (max-width: 768px) {
  .hero h1 { font-size: 2.5rem; }
  
  /* Convertimos la grid en flex column para móviles */
  .info-grid { 
    display: flex; 
    flex-direction: column; 
    gap: 30px;
  }
  
  /* order: -1 asegura que la imagen SIEMPRE esté arriba del texto en móvil */
  .visual-placeholder { 
    height: 250px; 
    order: -1; 
  }
  
  .steps-explanation { grid-template-columns: 1fr; }
}
</style>