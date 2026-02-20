<template>
  <div class="gesto-app">
    <div class="container">
      <nav>
        <div class="logo" @click="simularNav('home')">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M9,2C7.9,2 7,2.9 7,4V17H5V5C5,4.45 4.55,4 4,4C3.45,4 3,4.45 3,5V17C3,19.2 4.8,21 7,21H13.5C15.42,21 17.55,20.03 18.9,18.66L20.8,16.76C21.18,16.38 21.18,15.75 20.8,15.36L19.4,13.96C19,13.58 18.4,13.58 18,13.96L17,14.96V8C17,7.45 16.55,7 16,7C15.45,7 15,7.45 15,8V12H13V3C13,2.45 12.55,2 12,2C11.45,2 11,2.45 11,3V12H9V2Z" />
          </svg>
          GESTO
        </div>
        <div class="nav-links">
          <button @click="simularNav('aprendre')" class="btn-aprendre">TUTORIAL</button>

          <template v-if="user">
            <span class="user-greeting">Hola, {{ user.name }}</span>
            <button @click="simularNav('logout')" class="btn-logout">TANCAR SESSIÓ</button>
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
                  src="https://www.assersum.com/content/images/2024/09/Sin-t-tulo-2.png" 
                  alt="Barreras de comunicación" 
                  class="feature-image"
                >
              </div>
              <div class="info-content" data-aos="fade-left">
                <h2>La necessitat de comprendre</h2>
                <p>En hospitals o situacions d'emergència, la manca d'intèrprets crea murs invisibles. GESTO elimina l'escletxa comunicativa quan més ho necessites.</p>
              </div>
            </div>

            <div class="info-grid reversed">
              <div class="info-content" data-aos="fade-right">
                <h2>Tecnologia invisible</h2>
                <p>Sense sensors extra. Sense configuracions complexes. Només la càmera del teu mòbil i el nostre motor d'IA que tradueix gestos a paraules a l'instant.</p>
                <button class="btn-outline" @click="simularNav('com-funciona')">VEURE COM FUNCIONA</button>
              </div>
              <div class="visual-placeholder" data-aos="fade-left">
                 <img 
                  src="https://i.blogs.es/2b36a7/algoritmo/450_1000.png" 
                  alt="Intel·ligència Artificial i Algoritmes" 
                  class="feature-image"
                >
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
      this.$router.push('/');
    },
    simularNav(desti) {
      if (desti === 'aprendre') {
        // Redirige a la nueva página usando Vue Router
        this.$router.push('/aprendre');
      } else if (desti === 'traductor') {
        this.$router.push('/Camara');
      } else if (desti === 'home') {
        this.paginaActual = 'home';
        if (this.$route.path !== '/') {
            this.$router.push('/');
        }
      } else if (desti === 'login') {
        this.$router.push('/login');
      } else if (desti === 'registre') {
        this.$router.push('/register');
      } else if (desti === 'logout') {
        this.logout();
      } else if (desti === 'com-funciona') {
         this.paginaActual = desti;
         setTimeout(() => {
            window.scrollTo(0,0);
            AOS.refresh();
         }, 100);
      } else {
        alert('Navegant a: ' + desti);
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

.gesto-app {
  font-family: 'Inter', sans-serif;
  background-color: #121212; 
  color: #E0E0E0; 
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden; 
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

.btn-aprendre {
  color: white;
  border: 1px solid white;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 800;
  margin: 12px;
  background: transparent;
  transition: background 0.3s ease;
}
.btn-aprendre:hover {
  background: rgba(255, 255, 255, 0.1);
}

.hero { height: 85vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; position: relative; background: radial-gradient(circle at center, #1e1e1e 0%, #121212 70%); }
.hero h1 { font-size: 3.5rem; font-weight: 800; line-height: 1.2; margin-bottom: 20px; background: linear-gradient(to right, #ffffff, #a0a0a0); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
.hero p { font-size: 1.2rem; color: #A0A0A0; max-width: 600px; margin: 0 auto 40px auto; }
.scroll-indicator { margin-top: 60px; opacity: 0.5; }

.btn-primary { background-color: #00BFFF; color: #000; padding: 16px 40px; font-size: 1.1rem; font-weight: 700; border: none; border-radius: 4px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 0 20px rgba(0, 191, 255, 0.2); text-transform: uppercase; letter-spacing: 1px; }
.btn-primary:hover { background-color: #33CFFF; box-shadow: 0 0 30px rgba(0, 191, 255, 0.4); transform: translateY(-2px); }

.btn-outline { border: 1px solid #333; background: transparent; color: #fff; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-weight: 600; margin-top: 20px; font-size: 0.9rem; }
.btn-outline:hover { border-color: #fff; }

.info-section { padding: 100px 0; background-color: #0f0f0f; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; margin-bottom: 100px; }
.info-content h2 { font-size: 2.5rem; margin-bottom: 20px; color: #fff; }
.info-content p { color: #888; margin-bottom: 30px; font-size: 1.1rem; }

.visual-placeholder { width: 100%; height: 350px; background: linear-gradient(45deg, #1a1a1a, #252525); border-radius: 8px; display: flex; justify-content: center; align-items: center; border: 1px solid #333; position: relative; overflow: hidden; }
.feature-image { width: 100%; height: 100%; object-fit: cover; display: block; opacity: 0.8; transition: opacity 0.3s ease; }
.visual-placeholder:hover .feature-image { opacity: 1; }

footer { padding: 60px 0; text-align: center; border-top: 1px solid #1f1f1f; background-color: #121212; }
.footer-cta { color: #fff; font-size: 1.2rem; margin-bottom: 20px; }
.footer-links { display: flex; justify-content: center; gap: 30px; margin-bottom: 30px; }
.footer-links a { color: #666; text-decoration: none; font-size: 0.9rem; transition: color 0.3s; }
.footer-links a:hover { color: #00BFFF; }
.separator { color: #333; }


.how-it-works-view {
  min-height: 100vh;
  padding-bottom: 80px;
}

.btn-back {
  background: none;
  border: none;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  margin: 20px 0;
  display: inline-flex;
  align-items: center;
  transition: color 0.3s;
}
.btn-back:hover { color: #00BFFF; }

.section-header {
  text-align: center;
  margin-bottom: 40px;
}
.section-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #fff;
  margin-bottom: 10px;
}
.text-highlight { color: #00BFFF; }
.subtitle { color: #888; font-size: 1.1rem; }

.gif-container {
  max-width: 600px;
  margin: 0 auto 60px auto;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(0, 191, 255, 0.1);
  border: 1px solid #333;
  background: #000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.demo-gif {
  width: 100%;
  height: auto;
  max-height: 500px; 
  display: block;
}

.steps-explanation {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  max-width: 1000px;
  margin: 0 auto;
}

.step-item {
  background: #1a1a1a;
  padding: 30px;
  border-radius: 8px;
  border: 1px solid #2a2a2a;
  text-align: center;
  transition: transform 0.3s;
}
.step-item:hover {
  transform: translateY(-5px);
  border-color: #00BFFF;
}

.step-number {
  font-family: 'Roboto Mono', monospace;
  font-size: 2.5rem;
  font-weight: bold;
  color: rgba(0, 191, 255, 0.2);
  margin-bottom: 15px;
}

.step-item h3 {
  color: #fff;
  font-size: 1.3rem;
  margin-bottom: 15px;
}
.step-item p {
  color: #aaa;
  font-size: 0.95rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .hero h1 { font-size: 2.5rem; }
  .info-grid { grid-template-columns: 1fr; }
  .info-grid.reversed { display: flex; flex-direction: column-reverse; gap: 30px; }
  .visual-placeholder { height: 250px; }
  
  .steps-explanation { grid-template-columns: 1fr; }
}
</style>