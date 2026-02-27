FROM python:3.10-slim

ENV PYTHONUNBUFFERED=1

# Instal·lem les dependències del sistema
RUN apt-get update && apt-get install -y \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Instal·lem Node.js versió 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Instal·lem TOTA la intel·ligència artificial (es baixarà ràpid perquè no compila)
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