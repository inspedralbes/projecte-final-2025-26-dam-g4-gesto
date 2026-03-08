const express = require('express');
const router = express.Router();
const multer = require('multer');
const extract = require('extract-zip');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');


// Configuració de Multer per guardar el ZIP temporalment
const upload = multer({ dest: 'temp_uploads/' });


router.post('/upload-dataset', upload.single('file'), async (req, res) => {
   try {
       if (!req.file || !req.body.gesto) {
           return res.status(400).json({ error: "Falten dades requerides: arxiu o nom del gest." });
       }


       const gesto = req.body.gesto;
       const zipPath = path.resolve(req.file.path);


       // --- RUTA ABSOLUTA CONFIGURADA EN TU DOCKER-COMPOSE ---
       // Según tu 'volumes', ./gesto está en /usr/src/gesto
       const baseProjectDir = '/usr/src/gesto/public/entrenament_signes';
       const extractPath = path.join(baseProjectDir, 'tutorial');       
       
       console.log(`Rebent fotos per al gest: '${gesto}'...`);
       
       // Verificación de seguridad para asegurar que el volumen está bien montado
       if (!fs.existsSync(baseProjectDir)) {
           console.error(`ERROR CRÍTICO: No se encuentra la ruta ${baseProjectDir} dentro del contenedor.`);
           return res.status(500).json({ error: "Error de configuración de carpetas en el servidor." });
       }


       // Descomprimir el ZIP
       await extract(zipPath, { dir: extractPath });


       // Esborrar l'arxiu ZIP temporal
       fs.unlinkSync(zipPath);
       console.log(`Fotos descomprimides correctament a ${extractPath}.`);


       // Respondre al frontend ràpidament
       res.json({ message: "Dataset rebut i descomprimit. L'entrenament ha començat en segon pla." });


       // Executar Python en segon pla
       console.log("Llançant procés d'entrenament amb Python...");
      
       // Usamos python3 que es el que instala tu Dockerfile de python:3.10-slim
       exec('python3 entrenar2.py', { cwd: baseProjectDir }, (error, stdout, stderr) => {
           if (error) {
               console.error(`Error durant l'entrenament: ${error.message}`);
               return;
           }
           if (stderr) {
               console.warn(`Avisos del procés de Python: ${stderr}`);
           }
           console.log(`Resultat de l'entrenament:\n${stdout}`);
           console.log("Procés finalitzat. Nou model llest per a la web.");
       });


   } catch (error) {
       console.error("Error processant el dataset:", error);
       res.status(500).json({ error: "Error intern del servidor processant el dataset." });
   }
});


module.exports = router;