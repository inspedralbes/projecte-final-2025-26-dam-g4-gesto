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

        // Rutes relatives a l'estructura del projecte des de la carpeta routes
        const baseProjectDir = path.join(__dirname, '../../gesto/public/entrenament_signes');
        const extractPath = path.join(baseProjectDir, 'dataset');        
        console.log(`Rebent fotos per al gest: '${gesto}'...`);
        // Descomprimir el ZIP
        await extract(zipPath, { dir: extractPath });

        // Esborrar l'arxiu ZIP temporal
        fs.unlinkSync(zipPath);
        console.log(`Fotos descomprimides correctament a ${extractPath}.`);

        // Respondre al frontend ràpidament
        res.json({ message: "Dataset rebut i descomprimit. L'entrenament ha començat en segon pla." });

        // Executar Python en segon pla
        console.log("Llançant procés d'entrenament amb Python...");
        
        exec('python entrenar.py', { cwd: baseProjectDir }, (error, stdout, stderr) => {
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