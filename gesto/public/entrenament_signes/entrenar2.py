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
import json # <-- Añadido para exportar las clases


# 1. CONFIGURACIÓ AUTOMÀTICA
DIRECTORI_DATASET = 'tutorial'
RUTA_EXPORTACIO = 'model_web_v2' # <-- Ruta directa al frontend


# Detecta las clases automáticamente leyendo los nombres de los archivos JSON
if not os.path.exists(DIRECTORI_DATASET):
    os.makedirs(DIRECTORI_DATASET)

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

CLASSES = [d for d in os.listdir(DIRECTORI_DATASET) if os.path.isdir(os.path.join(DIRECTORI_DATASET, d)) or d.endswith('.json')]
CLASSES = [c.replace('.json', '') for c in CLASSES]
CLASSES = list(set(CLASSES))
print(f"Classes detectades automàticament: {CLASSES}")


if len(CLASSES) < 2:
   print("ERROR: Necessites almenys 2 gestos diferents dins de 'tutorial' per entrenar.")
   exit()


dades = []
etiquetes = []


print("\n--- FASE 1: Càrrega de coordenades des de JSON o Imatges (Llegat) ---")
for classe in CLASSES:
    ruta_json = os.path.join(DIRECTORI_DATASET, f"{classe}.json")
    ruta_carpeta = os.path.join(DIRECTORI_DATASET, classe)
    
    if os.path.exists(ruta_json):
        print(f"Processant JSON de '{classe}'...")
        try:
            with open(ruta_json, 'r') as f:
                contingut = json.load(f)
                for mostra in contingut:
                    if "landmarks" in mostra and len(mostra["landmarks"]) == 126:
                        dades.append(mostra["landmarks"])
                        etiquetes.append(classe)
        except Exception as e:
            print(f"Error processant {ruta_json}: {e}")
            
    elif os.path.exists(ruta_carpeta):
        print(f"Processant imatges antigues de '{classe}' i convertint a JSON...")
        imatges = [img for img in os.listdir(ruta_carpeta) if img.endswith('.jpg') or img.endswith('.png')]
        
        if 'detector' not in locals():
            print("Carregant motor de MediaPipe (només el primer cop)...")
            MODEL_TASK_PATH = 'hand_landmarker.task'
            if not os.path.exists(MODEL_TASK_PATH):
                urllib.request.urlretrieve("https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", MODEL_TASK_PATH)
            base_options = python.BaseOptions(model_asset_path=MODEL_TASK_PATH)
            options = vision.HandLandmarkerOptions(base_options=base_options, num_hands=2)
            detector = vision.HandLandmarker.create_from_options(options)
            
        noves_mostres = []
        for nom_imatge in imatges:
            ruta_imatge = os.path.join(ruta_carpeta, nom_imatge)
            try:
                mp_image = mp.Image.create_from_file(ruta_imatge)
                detection_result = detector.detect(mp_image)
                
                coordenades = []
                coordenades_mirrored = []
                
                if detection_result.hand_landmarks and len(detection_result.hand_landmarks) > 0:
                    for landmark in detection_result.hand_landmarks[0]:
                        coordenades.extend([landmark.x, landmark.y, landmark.z])
                        coordenades_mirrored.extend([1.0 - landmark.x, landmark.y, landmark.z])
                else:
                    coordenades.extend([0]*63)
                    coordenades_mirrored.extend([0]*63)
                
                if detection_result.hand_landmarks and len(detection_result.hand_landmarks) > 1:
                    for landmark in detection_result.hand_landmarks[1]:
                        coordenades.extend([landmark.x, landmark.y, landmark.z])
                        coordenades_mirrored.extend([1.0 - landmark.x, landmark.y, landmark.z])
                else:
                    coordenades.extend([0]*63)
                    coordenades_mirrored.extend([0]*63)
                
                if sum(coordenades) != 0:
                    noves_mostres.append({"label": classe, "landmarks": coordenades})
                    noves_mostres.append({"label": classe, "landmarks": coordenades_mirrored})
                    dades.append(coordenades)
                    dades.append(coordenades_mirrored)
                    etiquetes.append(classe)
                    etiquetes.append(classe)
            except Exception:
                pass
                
        if len(noves_mostres) > 0:
            with open(ruta_json, 'w') as f:
                json.dump(noves_mostres, f)
            print(f"  -> Creat {classe}.json amb {len(noves_mostres)} mostres!")


X = np.array(dades)
y = np.array(etiquetes)


print(f"\nExtracció completada! Tenim {len(X)} exemples vàlids.")


if len(X) == 0:
   print("ERROR: No s'ha detectat cap dada vàlida.")
   exit()


print("\n--- FASE 2: Entrenament del Model ---")
encoder = LabelEncoder()
y_codificat = encoder.fit_transform(y)


# 1. Comptem quantes classes REALS tenen coordenades vàlides
numero_classes_reals = len(encoder.classes_)
print(f"Classes finalment acceptades per a l'entrenament: {list(encoder.classes_)}")


if numero_classes_reals < 2:
   print("ERROR: Necessites almenys 2 gestos vàlids amb mans detectades per poder entrenar.")
   exit()


y_categoric = tf.keras.utils.to_categorical(y_codificat, num_classes=numero_classes_reals)


X_train, X_test, y_train, y_test = train_test_split(X, y_categoric, test_size=0.2, random_state=42)


# --- XARXA NEURONAL MILLORADA I MÉS PROFUNDA ---
model = tf.keras.Sequential([
   tf.keras.layers.Dense(256, activation='relu', input_shape=(126,)),
   tf.keras.layers.Dropout(0.3), # El Dropout evita que la IA memorice las fotos exactas
   tf.keras.layers.Dense(128, activation='relu'),
   tf.keras.layers.Dropout(0.2),
   tf.keras.layers.Dense(64, activation='relu'),
   tf.keras.layers.Dense(numero_classes_reals, activation='softmax')
])

# Ajustamos cómo aprende y le damos más tiempo de estudio (100 epochs en lugar de 50)
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=100, batch_size=32, validation_data=(X_test, y_test))


print("\n--- FASE 3: Exportació Automàtica per a la Web ---")
# 1. Guardar el model sobrescribiendo el antiguo en la carpeta public/model_web
tfjs.converters.save_keras_model(model, RUTA_EXPORTACIO)


# 2. Generar el archivo classes.json
ruta_json = os.path.join(RUTA_EXPORTACIO, "classes.json")
with open(ruta_json, "w") as f:
   json.dump(list(encoder.classes_), f)


print(f"¡Model i etiquetes exportats correctament a '{RUTA_EXPORTACIO}'!")
print("Ja pots recarregar la teva pàgina web, no has de tocar cap codi!")
