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
          <button @click="simularNav('login')">INICIAR SESSIÓ</button>
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
            <p class="footer-cta">Vols guardar el teu historial?</p>
            <div class="footer-links">
              <a href="#" @click.prevent="simularNav('login')">Iniciar Sessió</a>
              <span class="separator">|</span>
              <a href="#" @click.prevent="simularNav('registre')">Crear Compte</a>
            </div>
          </div>
        </footer>
      </div>
    </transition>
  </div>
</template>

<script>
// IMPORTAMOS AOS
import AOS from 'aos';
import 'aos/dist/aos.css';

export default {
  name: 'GestoLanding',
  data() {
    return {
      paginaActual: 'home'
    }
  },
  mounted() {
    // INICIALIZAMOS AOS AL MONTAR EL COMPONENTE
    AOS.init({
      offset: 100,      // distancia en px antes de activar la animación
      duration: 800,    // duración de la animación en ms
      easing: 'ease-out-cubic', // tipo de curva de velocidad
      once: true        // si true, solo se anima la primera vez que bajas
    });
  },
  methods: {
    simularNav(desti) {
      if (desti === 'traductor') {
        this.paginaActual = desti;
        setTimeout(() => AOS.refresh(), 100);
      } else if (desti === 'home') {
        // If we are already on home (which renders this component), just reset internal state if needed
        this.paginaActual = 'home';
        this.$router.push('/');
      } else if (desti === 'login') {
        this.$router.push('/login');
      } else if (desti === 'registre') {
        this.$router.push('/register');
      } else if (desti === 'com-funciona') {
         // Keep existing logic or add route if exists
         console.log('Com funciona clicked');
      } else {
        alert('Navegant a: ' + desti);
      }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px); 
}

.floating-arrow {
  animation: bounce 2s infinite;
}

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

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  height: 80px;
}

.logo {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 2px;
  color: #fff;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.icon { width: 24px; height: 24px; fill: #00BFFF; }

.nav-links button {
  background: none;
  border: none;
  color: #A0A0A0;
  font-weight: 600;
  cursor: pointer;
  margin-left: 20px;
  font-size: 0.9rem;
  transition: color 0.3s;
}
.nav-links button:hover { color: #fff; }

.hero {
  height: 85vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;
  background: radial-gradient(circle at center, #1e1e1e 0%, #121212 70%);
}

.hero h1 {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 20px;
  background: linear-gradient(to right, #ffffff, #a0a0a0);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent; 
}

.hero p {
  font-size: 1.2rem;
  color: #A0A0A0;
  max-width: 600px;
  margin: 0 auto 40px auto;
}

.scroll-indicator {
  margin-top: 60px;
  opacity: 0.5;
}

.btn-primary {
  background-color: #00BFFF;
  color: #000;
  padding: 16px 40px;
  font-size: 1.1rem;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 191, 255, 0.2);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.btn-primary:hover {
  background-color: #33CFFF;
  box-shadow: 0 0 30px rgba(0, 191, 255, 0.4);
  transform: translateY(-2px);
}

.btn-outline {
  border: 1px solid #333;
  background: transparent;
  color: #fff;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 20px;
  font-size: 0.9rem;
}
.btn-outline:hover { border-color: #fff; }

.info-section { padding: 100px 0; background-color: #0f0f0f; }

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  margin-bottom: 100px;
}

.info-content h2 { font-size: 2.5rem; margin-bottom: 20px; color: #fff; }
.info-content p { color: #888; margin-bottom: 30px; font-size: 1.1rem; }

.visual-placeholder {
  width: 100%;
  height: 350px;
  background: linear-gradient(45deg, #1a1a1a, #252525);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #333;
  position: relative;
  overflow: hidden; 
}

.feature-image {
  width: 100%;
  height: 100%;
  object-fit: cover; 
  display: block;
  opacity: 0.8; 
  transition: opacity 0.3s ease;
}
.visual-placeholder:hover .feature-image { opacity: 1; }

footer {
  padding: 60px 0;
  text-align: center;
  border-top: 1px solid #1f1f1f;
  background-color: #121212;
}

.footer-cta { color: #fff; font-size: 1.2rem; margin-bottom: 20px; }
.footer-links { display: flex; justify-content: center; gap: 30px; margin-bottom: 30px; }
.footer-links a { color: #666; text-decoration: none; font-size: 0.9rem; transition: color 0.3s; }
.footer-links a:hover { color: #00BFFF; }
.separator { color: #333; }

.translator-view {
  height: 80vh; 
  display: flex; 
  flex-direction: column; 
  justify-content: center; 
  align-items: center; 
  text-align: center;
}
.camera-feed {
  max-width: 600px; 
  margin-bottom: 20px; 
  border-color: #00BFFF;
}
.camera-feed p { color: #00BFFF; }

@media (max-width: 768px) {
  .hero h1 { font-size: 2.5rem; }
  .info-grid { grid-template-columns: 1fr; }
  .visual-placeholder { height: 250px; }
  .info-grid.reversed { 
      display: flex; 
      flex-direction: column-reverse; 
      gap: 30px;
  }
}
</style>