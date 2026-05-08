<template>
  <div class="gesto-app">
    <!-- Fons animat amb blobs -->
    <div class="bg-blobs">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
    </div>

    <div class="container">
      <nav>
        <div class="logo" @click="$router.push('/')">
          <svg class="icon" viewBox="0 0 24 24">
            <path d="M9,2C7.9,2 7,2.9 7,4V17H5V5C5,4.45 4.55,4 4,4C3.45,4 3,4.45 3,5V17C3,19.2 4.8,21 7,21H13.5C15.42,21 17.55,20.03 18.9,18.66L20.8,16.76C21.18,16.38 21.18,15.75 20.8,15.36L19.4,13.96C19,13.58 18.4,13.58 18,13.96L17,14.96V8C17,7.45 16.55,7 16,7C15.45,7 15,7.45 15,8V12H13V3C13,2.45 12.55,2 12,2C11.45,2 11,2.45 11,3V12H9V2Z" />
          </svg>
          GESTO
        </div>
        <div class="nav-links">
          <button @click="$router.push('/')">TORNAR A L'INICI</button>
        </div>
      </nav>
    </div>

    <div class="auth-container">
      <div class="auth-box" data-aos="fade-up">
        <h2>Benvingut/da</h2>
        <p class="subtitle">Inicia sessió per continuar</p>

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email">Correu electrònic</label>
            <input type="email" id="email" v-model="form.email" required placeholder="exemple@correu.com">
          </div>

          <div class="form-group">
            <label for="password">Contrasenya</label>
            <input type="password" id="password" v-model="form.password" required placeholder="••••••••">
          </div>


          <div v-if="errorMsg" class="error-message">
            {{ errorMsg }}
          </div>

          <div v-if="loading" class="spinner-container">
            <LoadingSpinner />
            <p>Iniciant sessió...</p>
          </div>
          <button v-else type="submit" class="btn-primary full-width">
            INICIAR SESSIÓ
          </button>
        </form>

        <p class="auth-footer">
          Encara no tens compte? <a href="#" @click.prevent="$router.push('/register')">Registra't</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import AOS from 'aos';
import 'aos/dist/aos.css';
import LoadingSpinner from '../components/LoadingSpinner.vue';

export default {
  name: 'LoginPage',
  components: {
    LoadingSpinner
  },
  data() {
    return {
      form: {
        email: '',
        password: ''
      },
      loading: false,
      errorMsg: ''
    }
  },
  mounted() {
    AOS.init({
      offset: 50,
      duration: 800,
      easing: 'ease-out-cubic',
      once: true
    });
  },
  methods: {
    async handleLogin() {
      this.errorMsg = '';
      this.loading = true;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.form.email,
            password: this.form.password
          })
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('token', data.token);
          if (data.user) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
          this.$router.push('/');
        } else {
          this.errorMsg = data.msg || 'Error en l\'inici de sessió';
        }
      } catch (error) {
        console.error('Error:', error);
        this.errorMsg = 'Error de connexió amb el servidor';
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

.gesto-app {
  font-family: 'Inter', sans-serif;
  background-color: #0a0a0a; 
  color: #E0E0E0; 
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
}

/* FONS AMB BLOBS */
.bg-blobs {
  position: absolute;
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
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0, 191, 255, 0.4) 0%, rgba(0, 191, 255, 0) 70%);
  border-radius: 50%;
  filter: blur(60px);
  animation: move-blobs 25s infinite alternate ease-in-out;
}

.blob-1 { top: -20%; left: -10%; background: radial-gradient(circle, rgba(0, 191, 255, 0.5) 0%, rgba(0, 191, 255, 0) 70%); }
.blob-2 { bottom: -20%; right: -10%; background: radial-gradient(circle, rgba(124, 58, 237, 0.4) 0%, rgba(124, 58, 237, 0) 70%); animation-delay: -5s; }

@keyframes move-blobs {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(100px, 100px) scale(1.1); }
}

* { box-sizing: border-box; }

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
  z-index: 2;
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

.auth-container {
  min-height: calc(100vh - 80px); 
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  position: relative;
  z-index: 2;
}

.auth-box {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  padding: 50px 40px;
  border-radius: 24px;
  width: 100%;
  max-width: 480px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
  transition: transform 0.3s ease;
}
.auth-box:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.12);
}

h2 {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #fff;
  text-align: center;
}

.subtitle {
  color: #888;
  text-align: center;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #aaa;
  font-size: 0.9rem;
}

input {
  width: 100%;
  padding: 14px 18px;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #00BFFF;
  background-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 15px rgba(0, 191, 255, 0.15);
}

.btn-primary {
  background: linear-gradient(135deg, #00BFFF 0%, #0080FF 100%);
  color: #000;
  padding: 16px 20px;
  font-size: 1rem;
  font-weight: 800;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 20px rgba(0, 191, 255, 0.2);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #33CFFF 0%, #00BFFF 100%);
  box-shadow: 0 15px 30px rgba(0, 191, 255, 0.4);
  transform: translateY(-3px);
}

.full-width {
  width: 100%;
  margin-top: 10px;
}

.auth-footer {
  text-align: center;
  margin-top: 25px;
  color: #888;
  font-size: 0.9rem;
}

.auth-footer a {
  color: #00BFFF;
  text-decoration: none;
  font-weight: 600;
}

.auth-footer a:hover {
  text-decoration: underline;
}

.error-message {
  color: #ffca28; /* Amber color for errors on dark theme */
  background-color: rgba(255, 202, 40, 0.1);
  border-left: 3px solid #ffca28;
  padding: 10px;
  margin-bottom: 20px;
  font-size: 0.9rem;
  border-radius: 4px;
}

.btn-primary:disabled {
  background-color: #555;
  color: #888;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}
.spinner-container p {
  color: #00BFFF;
  margin-top: 10px;
  font-weight: 600;
  letter-spacing: 1px;
}
</style>
