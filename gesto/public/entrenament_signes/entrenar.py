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
import json

import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import urllib.request

# 1. CONFIGURACIÓ
DIRECTORI_DATASET = 'dataset'

# Llistar dinàmicament totes les classes
CLASSES = [d for d in os.listdir(DIRECTORI_DATASET) if os.path.isdir(os.path.join(DIRECTORI_DATASET, d)) or d.endswith('.json')]
CLASSES = [c.replace('.json', '') for c in CLASSES if c != 'dataset_']
CLASSES = list(set(CLASSES))
CLASSES.sort()

dades = []
etiquetes = []

print("\n--- FASE 1: Càrrega de coordenades des de JSON o Imatges (Llegat) ---")
for classe in CLASSES:
    ruta_json = os.path.join(DIRECTORI_DATASET, f"{classe}.json")
    ruta_carpeta = os.path.join(DIRECTORI_DATASET, classe)
    
    # 1. Intentar carregar des del JSON nou (súper ràpid)
    if os.path.exists(ruta_json):
        print(f"Processant JSON de la classe '{classe}'...")
        try:
            with open(ruta_json, 'r') as f:
                contingut = json.load(f)
                for mostra in contingut:
                    if "landmarks" in mostra and len(mostra["landmarks"]) == 126:
                        dades.append(mostra["landmarks"])
                        etiquetes.append(classe)
        except Exception as e:
            print(f"Error processant {ruta_json}: {e}")
            
    # 2. Si no hi ha JSON, però tenim l'antiga carpeta d'imatges
    elif os.path.exists(ruta_carpeta):
        print(f"Processant imatges antigues de '{classe}' i convertint a JSON...")
        imatges = [img for img in os.listdir(ruta_carpeta) if img.endswith('.jpg') or img.endswith('.png')]
        
        # Inicialitzar MediaPipe només si cal
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
                
                # Mà 1
                if detection_result.hand_landmarks and len(detection_result.hand_landmarks) > 0:
                    for landmark in detection_result.hand_landmarks[0]:
                        coordenades.extend([landmark.x, landmark.y, landmark.z])
                        coordenades_mirrored.extend([1.0 - landmark.x, landmark.y, landmark.z])
                else:
                    coordenades.extend([0]*63)
                    coordenades_mirrored.extend([0]*63)
                
                # Mà 2
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
            print(f"  -> Creat {classe}.json amb {len(noves_mostres)} mostres per la propera vegada!")
    else:
        print(f"No s'han trobat dades per a la classe: {classe}")

X = np.array(dades)
y = np.array(etiquetes)

print(f"\nExtracció completada! Tenim {len(X)} exemples vàlids.")

if len(X) == 0:
    print("ERROR: No s'ha detectat cap dada vàlida als arxius JSON.")
    exit()

print("\n--- FASE 2: Entrenament del Model ---")
encoder = LabelEncoder()
y_codificat = encoder.fit_transform(y)
y_categoric = tf.keras.utils.to_categorical(y_codificat)

print(f"L'ordre de les teves classes al JS haurà de ser: {list(encoder.classes_)}")

X_train, X_test, y_train, y_test = train_test_split(X, y_categoric, test_size=0.2, random_state=42)

# Model Seqüencial net (ara funcionarà perquè estem en Legacy Keras)
model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(126,)),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(len(list(encoder.classes_)), activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=50, validation_data=(X_test, y_test))

print("\n--- FASE 3: Exportació per a la web ---")
ruta_exportacio = "model_web"
tfjs.converters.save_keras_model(model, ruta_exportacio)

# Guardar classes.json perquè JS ho llegeixi automàticament
ruta_classes = os.path.join(ruta_exportacio, "classes.json")
with open(ruta_classes, "w") as f:
    json.dump(list(encoder.classes_), f)

print(f"Model exportat correctament a la carpeta '{ruta_exportacio}'!")