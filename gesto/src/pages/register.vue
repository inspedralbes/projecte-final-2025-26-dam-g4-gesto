<template>
  <div class="gesto-app">
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
        <h2>Crear Compte</h2>
        <p class="subtitle">Uneix-te a la revolució comunicativa</p>

        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="name">Nom complet</label>
            <input type="text" id="name" v-model="form.name" required placeholder="El teu nom" maxlength="32">
          </div>

          <div class="form-group">
            <label for="email">Correu electrònic</label>
            <input type="email" id="email" v-model="form.email" required placeholder="exemple@correu.com">
          </div>

          <div class="form-group">
            <label for="password">Contrasenya</label>
            <input type="password" id="password" v-model="form.password" required placeholder="••••••••">
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Contrasenya</label>
            <input type="password" id="confirmPassword" v-model="form.confirmPassword" required placeholder="••••••••">
          </div>

          <button type="submit" class="btn-primary full-width">REGISTRAR-SE</button>
        </form>

        <p class="auth-footer">
          Ja tens compte? <a href="#" @click.prevent="$router.push('/login')">Inicia sessió</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import AOS from 'aos';
import 'aos/dist/aos.css';

export default {
  name: 'RegisterPage',
  data() {
    return {
      form: {
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      }
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
    async handleRegister() {
      if (this.form.password !== this.form.confirmPassword) {
        alert('Les contrasenyes no coincideixen');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: this.form.name,
            email: this.form.email,
            password: this.form.password
          })
        });

        const data = await response.json();

        if (response.ok) {
          alert('Registre completat amb èxit!');
          this.$router.push('/login');
        } else {
          alert(data.msg || 'Error en el registre');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error de connexió amb el servidor');
      }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap');

.gesto-app {
  font-family: 'Inter', sans-serif;
  background-color: #121212; 
  color: #E0E0E0; 
  min-height: 100vh;
  width: 100%;
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

.auth-container {
  min-height: calc(100vh - 80px); /* Resta el header */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  background: radial-gradient(circle at center, #1e1e1e 0%, #121212 70%);
}

.auth-box {
  background-color: #1a1a1a;
  padding: 40px;
  border-radius: 8px;
  width: 100%;
  max-width: 480px;
  border: 1px solid #333;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
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
  padding: 12px;
  background-color: #252525;
  border: 1px solid #333;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #00BFFF;
}

.btn-primary {
  background-color: #00BFFF;
  color: #000;
  padding: 14px 20px;
  font-size: 1rem;
  font-weight: 700;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 191, 255, 0.2);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-primary:hover {
  background-color: #33CFFF;
  box-shadow: 0 0 20px rgba(0, 191, 255, 0.4);
  transform: translateY(-2px);
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
</style>
