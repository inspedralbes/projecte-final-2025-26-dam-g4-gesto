# Documentació Tècnica - Projecte Gesto

Gesto és una plataforma que combina el reconeixement de gestos en temps real mitjançant intel·ligència artificial local i un assistent de llenguatge (LLM) per millorar l'accessibilitat i la interacció amb l'usuari.

## 🏗️ Arquitectura del Sistema

El projecte està dividit en tres components principals:

### 1. Frontend (Vue.js + Vite)
- **Framework**: Vue 3 amb Vuetify per al disseny d'interfície.
- **IA en el client**: Utilitza **TensorFlow.js** i **MediaPipe** per processar el vídeo de la càmera i reconèixer gestos sense enviar imatges al servidor (privacitat total).
- **Mòdul d'Aprenentatge**: Sistema interactiu que guia l'usuari en la realització correcta dels gestos mitjançant feedback visual en temps real.
- **Comunicació**: Es comunica amb el backend mitjançant una API REST.

### 2. Backend (Node.js + Express)
- **Motor**: Express.js per a la gestió de rutes i middlewares.
- **Base de dades**: MongoDB (mitjançant Mongoose) per a la gestió d'usuaris, sessions i datasets de gestos.
- **Autenticació**: Utilitza JSON Web Tokens (JWT) i Bcrypt per a la seguretat dels usuaris.

### 3. Intel·ligència Artificial (Ollama)
- El servidor executa una instància de **Ollama** per processar peticions de llenguatge natural de forma local, assegurant que les dades de l'usuari no surten de la nostra infraestructura.

## 📁 Estructura del Projecte

- `/gesto`: Codi font de l'aplicació web (Frontend).
- `/backend`: Lògica de servidor, models de dades i rutes de l'API.
- `/proxy`: Configuració de Nginx per al servidor de producció.
- `/.github/workflows`: Automatització del CI/CD.

## 🔌 API Endpoints Principals

| Ruta | Mètode | Descripció |
|------|--------|------------|
| `/api/auth/register` | POST | Registre de nous usuaris |
| `/api/auth/login` | POST | Login d'usuaris i retorn de JWT |
| `/api/ia` | POST | Interacció amb l'assistent Ollama |
| `/api/dataset` | GET/POST | Gestió dels patrons de gestos (només Admins) |

## 🛠️ Tecnologies Utilitzades

- **Llenguatges**: JavaScript (ES6+), CSS3 (Vanilla), HTML5.
- **DevOps**: Docker, Docker Compose, GitHub Actions.
- **Seguretat**: Nginx (Proxy), SSL (Let's Encrypt).
