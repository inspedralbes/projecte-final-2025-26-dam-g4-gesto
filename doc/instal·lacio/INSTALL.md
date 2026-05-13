# Manual d'Instal·lació i Desplegament - Gesto

Aquest document detalla els passos necessaris per instal·lar el projecte en un entorn local i com s'ha configurat el sistema de desplegament automàtic.

## 📋 Requisits Previs

Abans de començar, assegura't de tenir instal·lat:
- **Docker** i **Docker Compose** (Recomanat)
- **Node.js** v20 o superior (si es vol executar sense Docker)
- **Git**

## 🚀 Instal·lació en Local (Docker)

La forma més ràpida d'executar Gesto és utilitzant Docker Compose, ja que aixeca automàticament el frontend, el backend i la base de dades d'IA (Ollama).

1. **Clonar el repositori:**
   ```bash
   git clone https://github.com/inspedralbes/projecte-final-2025-26-dam-g4-gesto.git
   cd projecte-final-2025-26-dam-g4-gesto
   ```

2. **Configurar variables d'entorn:**
   Crea un fitxer `.env` a la carpeta `backend` basant-te en `.env.example`.

3. **Aixecar els contenidors:**
   ```bash
   docker compose up -d --build
   ```

4. **Accedir a l'aplicació:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

## 🌐 Desplegament al Servidor (CD)

El projecte utilitza **GitHub Actions** per al desplegament continu. Cada vegada que es fa un `push` a la branca `main`, s'activa el següent flux:

1. **CI (Integració Contínua):** Es passen els linters i es comprova que les imatges de Docker construeixen correctament.
2. **CD (Desplegament Continu):** 
   - L'Action es connecta per SSH al servidor de producció.
   - S'executa un `git pull` per actualitzar el codi.
   - Es reinicien els contenidors amb `docker compose up -d --build`.

### Configuració del Servidor
El servidor de producció està basat en **Ubuntu 24.04** i utilitza **Nginx** com a proxy invers per gestionar el trànsit HTTP/HTTPS i els certificats de Let's Encrypt.

## 🛠️ Resolució de Problemes Comuns

### El `git pull` falla al servidor
Si s'han fet canvis manuals al servidor, el desplegament automàtic pot fallar. La solució és forçar la sincronització:
```bash
git reset --hard origin/main
docker compose down
docker compose up -d --build
```

### Problemes amb Ollama
Assegura't que el contenidor d'Ollama té accés a internet per descarregar els models de llenguatge necessaris en la primera execució.
