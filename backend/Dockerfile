FROM node:22

WORKDIR /usr/src/app

COPY package*.json ./
# 1. Instalar Python 3, pip y librerías del sistema para procesar imágenes (MediaPipe/OpenCV)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 2. Instalar las librerías pesadas de Inteligencia Artificial
# (Usamos --break-system-packages porque las versiones nuevas de Node/Debian lo requieren al instalar pip global)
RUN pip3 install --no-cache-dir --break-system-packages \
    tensorflow \
    tensorflowjs \
    mediapipe \
    scikit-learn \
    pandas
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
