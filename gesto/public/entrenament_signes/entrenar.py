import os
# AIXÒ ÉS LA SOLUCIÓ A TOTS ELS PROBLEMES DE WEB: Forçar Keras Clàssic (v2)
os.environ["TF_USE_LEGACY_KERAS"] = "1"

import urllib.request
import pandas as pd
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import tensorflowjs as tfjs

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# 1. CONFIGURACIÓ
DIRECTORI_DATASET = 'dataset'
CLASSES = ['dit_abaix_nas', 'mans_tancades', 'none', 'polze_costat']
MODEL_TASK_PATH = 'hand_landmarker.task'

# 2. DESCARREGAR EL MODEL BASE DE MEDIAPIPE (si no existeix)
if not os.path.exists(MODEL_TASK_PATH):
    print(f"Descarregant el model base de MediaPipe ({MODEL_TASK_PATH})...")
    url = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
    urllib.request.urlretrieve(url, MODEL_TASK_PATH)
    print("Descàrrega completada!")

# 3. CONFIGURAR L'EXTRACTOR DE MANS
base_options = python.BaseOptions(model_asset_path=MODEL_TASK_PATH)
options = vision.HandLandmarkerOptions(base_options=base_options, num_hands=1)
detector = vision.HandLandmarker.create_from_options(options)

dades = []
etiquetes = []

print("\n--- FASE 1: Extracció de coordenades amb MediaPipe Tasks Vision ---")
for classe in CLASSES:
    ruta_classe = os.path.join(DIRECTORI_DATASET, classe)
    if not os.path.exists(ruta_classe):
        print(f"Carpeta no trobada: {ruta_classe}")
        continue
        
    imatges = os.listdir(ruta_classe)
    print(f"Processant {len(imatges)} fotos de la classe '{classe}'...")
    
    for nom_imatge in imatges:
        ruta_imatge = os.path.join(ruta_classe, nom_imatge)
        try:
            mp_image = mp.Image.create_from_file(ruta_imatge)
            detection_result = detector.detect(mp_image)
            
            if detection_result.hand_landmarks:
                for hand_landmarks in detection_result.hand_landmarks:
                    fila_coordenades = []
                    for landmark in hand_landmarks:
                        fila_coordenades.extend([landmark.x, landmark.y, landmark.z])
                    
                    dades.append(fila_coordenades)
                    etiquetes.append(classe)
        except Exception:
            pass

X = np.array(dades)
y = np.array(etiquetes)

print(f"\nExtracció completada! Tenim {len(X)} exemples vàlids.")

if len(X) == 0:
    print("ERROR: No s'ha detectat cap mà a les fotos.")
    exit()

print("\n--- FASE 2: Entrenament del Model ---")
encoder = LabelEncoder()
y_codificat = encoder.fit_transform(y)
y_categoric = tf.keras.utils.to_categorical(y_codificat)

print(f"L'ordre de les teves classes al JS haurà de ser: {list(encoder.classes_)}")

X_train, X_test, y_train, y_test = train_test_split(X, y_categoric, test_size=0.2, random_state=42)

# Model Seqüencial net (ara funcionarà perquè estem en Legacy Keras)
model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(63,)),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(len(list(encoder.classes_)), activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=50, validation_data=(X_test, y_test))

print("\n--- FASE 3: Exportació per a la web ---")
ruta_exportacio = "model_web"
tfjs.converters.save_keras_model(model, ruta_exportacio)
print(f"Model exportat correctament a la carpeta '{ruta_exportacio}'!")