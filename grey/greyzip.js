const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const JSZip = require('jszip');

const outputDir = path.join(__dirname, './greyImages'); // Chemin vers le dossier contenant les images converties
const compressedImagesDir = path.join(__dirname, './compressedImages'); // Dossier temporaire pour stocker les images compressées

if (!fs.existsSync(compressedImagesDir)) {
    fs.mkdirSync(compressedImagesDir);
}

const files = fs.readdirSync(outputDir); // Lire le contenu du dossier

// Fonction pour diviser les fichiers en sous-groupes
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

// Fonction pour compresser et ajouter une image au ZIP
async function compressAndAddImage(zip, file) {
    const inputPath = path.join(outputDir, file);
    const outputPath = path.join(compressedImagesDir, file);

    // Compresser l'image ici avec sharp
    await sharp(inputPath)
        .jpeg({ quality: 65 }) // Ajustez selon le format d'image et le niveau de compression désiré
        .toFile(outputPath);

    // Ajouter l'image compressée au ZIP
    zip.file(file, fs.readFileSync(outputPath));
}

// Diviser les fichiers en groupes de 2500
const fileGroups = chunkArray(files, 2500);

fileGroups.forEach((group, index) => {
    const zip = new JSZip();
    const startNum = index * 2500;
    const endNum = startNum + group.length - 1;
    const zipName = `Images_${startNum}-${endNum}.zip`;

    // Préparez les promesses pour la compression des images
    const compressionPromises = group.map(file => compressAndAddImage(zip, file));

    // Attendre que toutes les images soient compressées et ajoutées au ZIP
    Promise.all(compressionPromises).then(() => {
        // Générer le ZIP et l'enregistrer
        zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
            .pipe(fs.createWriteStream(path.join(__dirname, zipName)))
            .on('finish', function () {
                console.log(`${zipName} a été créé.`);
            });
    });
});
