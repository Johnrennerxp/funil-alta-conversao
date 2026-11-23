/**
 * Utilitário para compactação de imagens no cliente (HTML5 Canvas)
 * Garante que logos enviadas tenham menos de 150KB para serem armazenadas
 * com segurança diretamente no documento Firestore (plano Spark 100% gratuito).
 */
export async function compressImageToBase64(file, maxSizeBytes = 150 * 1024, maxDimension = 600) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.onload = () => {
        let { width, height } = img;

        // Redimensionar mantendo proporção
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Preencher com fundo transparente para PNG ou manter qualidade
        ctx.drawImage(img, 0, 0, width, height);

        // Tentar compressão gradual em JPEG/WebP
        let quality = 0.85;
        let base64 = canvas.toDataURL('image/jpeg', quality);

        // Se ainda for maior que o limite, reduz qualidade
        while (base64.length * 0.75 > maxSizeBytes && quality > 0.3) {
          quality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(base64);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
