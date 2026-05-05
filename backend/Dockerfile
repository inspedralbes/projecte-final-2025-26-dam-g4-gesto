# Usamos la versión estable (bookworm)
FROM python:3.10-slim-bookworm

ENV PYTHONUNBUFFERED=1

# TRUCO ANTI-FIREWALL: Cambiamos todos los repositorios de HTTP a HTTPS.
# Al encriptar la conexión, el cortafuegos del instituto no puede ver qué
# archivos estamos descargando y dejará de bloquearnos con el Error 403.
RUN sed -i 's/http:/https:/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    gnupg \
    libgl1 \
    libglib2.0-0 \
    libgles2 \
    libegl1 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instal·lem Node.js versió 22 (Usando el script oficial)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Instal·lem TOTA la intel·ligència artificial
RUN pip install --no-cache-dir \
    tensorflow==2.15.0 \
    tensorflowjs \
    mediapipe \
    scikit-learn \
    pandas

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000
CMD ["node", "server.js"]