# GESTO 🤟

**GESTO** és una solució mòbil innovadora dissenyada per eliminar les barreres de comunicació entre persones oients i persones amb discapacitat auditiva. L'aplicació utilitza **Intel·ligència Artificial** per traduir la Llengua de Signes a text i veu en temps real.

## 📖 Resum Executiu
GESTO actua com un intèrpret de butxaca per resoldre l'escletxa comunicativa en hospitals, comerços o situacions d'emergència.

## 🚀 Tecnologies
- **Frontend**: Vue.js (v3), Vuetify (v3), Vite
- **Backend**: Node.js, Express.js, Mongoose
- **Contenidors**: Docker, Docker Compose

## ⚡ Instal·lació i Ús
Pots executar el projecte de dues maneres:

### Mètode 1: Docker (Recomanat)
Aquest és el mètode més senzill i ràpid per tenir tot l'entorn funcionant.

1. **Prerequisits**: Assegura't de tenir [Docker](https://docs.docker.com/get-docker/) i [Docker Compose](https://docs.docker.com/compose/install/) instal·lats.
2. **Aixecar els contenidors**: Executa la següent comanda a l'arrel del projecte.
   ```bash
   docker-compose up --build
   ```
3. **Accedir a l'aplicació**: Obre el navegador i ves a `http://localhost:3000`.


## 🎯 Objectius del Projecte

### 3.1. MVP (Producte Mínim Viable)
* **Rastreig de mans:** En temps real via càmera.
* **Reconeixement:** 5-8 signes essencials (Hola, Gràcies, Ajuda, etc.).
* **Sortida:** Text i àudio (TTS).

### 3.2. Objectius Post-MVP
* **Traducció Inversa:** De veu a signes (vídeo/animació).
* **Construcció de Frases:** IA per a coherència gramatical.
* **Mòdul d'Aprenentatge:** Sistema gamificat per a usuaris oients.