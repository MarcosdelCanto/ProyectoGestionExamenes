import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import Layout from '../components/Layout';
import {
  clearLoginBackgroundConfig,
  getLoginBackgroundConfig,
  setLoginBackgroundConfig,
} from '../utils/loginBackgroundConfig';

const LoginBackgroundConfigPage = () => {
  const initialConfig = useMemo(() => getLoginBackgroundConfig(), []);
  const [imageUrl, setImageUrl] = useState(initialConfig.imageUrl || '');
  const [overlayOpacity, setOverlayOpacity] = useState(
    initialConfig.overlayOpacity ?? 35
  );
  const [cardColor, setCardColor] = useState(
    initialConfig.cardColor || '#ffffff'
  );
  const [cardOpacity, setCardOpacity] = useState(
    initialConfig.cardOpacity ?? 98
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const hexToRgba = (hex, alpha) => {
    const normalized = /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : '#ffffff';
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const estimateDataUrlBytes = (dataUrl) => {
    if (typeof dataUrl !== 'string' || !dataUrl.includes(',')) return 0;
    const base64 = dataUrl.split(',')[1] || '';
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
  };

  const compressImageSource = (source, targetBytes = 380 * 1024) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = () =>
        reject(new Error('La imagen seleccionada es inválida.'));
      img.onload = () => {
        const widths = [1600, 1280, 1024, 900, 768, 640, 520];
        const qualities = [0.78, 0.68, 0.58, 0.5, 0.42, 0.35, 0.28];

        let bestData = '';
        let bestSize = Number.MAX_SAFE_INTEGER;

        for (const targetWidth of widths) {
          const ratio = img.width > targetWidth ? targetWidth / img.width : 1;
          const width = Math.max(1, Math.round(img.width * ratio));
          const height = Math.max(1, Math.round(img.height * ratio));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.drawImage(img, 0, 0, width, height);

          for (const quality of qualities) {
            const candidate = canvas.toDataURL('image/jpeg', quality);
            const bytes = estimateDataUrlBytes(candidate);

            if (bytes < bestSize) {
              bestData = candidate;
              bestSize = bytes;
            }

            if (bytes <= targetBytes) {
              resolve(candidate);
              return;
            }
          }
        }

        resolve(bestData);
      };
      img.src = source;
    });

  const fileToCompressedDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.onload = () => {
        const source = typeof reader.result === 'string' ? reader.result : '';
        compressImageSource(source, 380 * 1024)
          .then(resolve)
          .catch(reject);
      };
      reader.readAsDataURL(file);
    });

  const previewStyle = imageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, ${
          overlayOpacity / 100
        }), rgba(0, 0, 0, ${overlayOpacity / 100})), url('${imageUrl}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {
        background:
          'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)',
      };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen válido.');
      return;
    }

    try {
      const compressed = await fileToCompressedDataUrl(file);
      setImageUrl(compressed);
      setError('');
      const kb = Math.round(estimateDataUrlBytes(compressed) / 1024);
      setMessage(`Imagen optimizada (${kb} KB) y lista para guardar.`);
    } catch (uploadError) {
      setError(uploadError.message || 'No se pudo cargar la imagen.');
    }
  };

  const handleSave = async () => {
    try {
      setLoginBackgroundConfig({
        imageUrl,
        overlayOpacity,
        cardColor,
        cardOpacity,
      });
      setMessage('Configuración guardada correctamente.');
      setError('');
    } catch (saveError) {
      if (
        saveError?.code === 'LOGIN_BG_QUOTA' &&
        typeof imageUrl === 'string' &&
        imageUrl.startsWith('data:image/')
      ) {
        try {
          const ultraCompressed = await compressImageSource(
            imageUrl,
            220 * 1024
          );
          setImageUrl(ultraCompressed);
          setLoginBackgroundConfig({
            imageUrl: ultraCompressed,
            overlayOpacity,
            cardColor,
            cardOpacity,
          });
          const kb = Math.round(estimateDataUrlBytes(ultraCompressed) / 1024);
          setMessage(
            `Se aplicó compresión adicional (${kb} KB) y se guardó correctamente.`
          );
          setError('');
          return;
        } catch {
          // Si falla la segunda compresión, cae al error general de abajo.
        }
      }

      setError(
        saveError.message ||
          'No se pudo guardar la configuración del login en este navegador.'
      );
    }
  };

  const handleReset = () => {
    clearLoginBackgroundConfig();
    setImageUrl('');
    setOverlayOpacity(35);
    setCardColor('#ffffff');
    setCardOpacity(98);
    setMessage('Configuración restablecida al estilo por defecto.');
    setError('');
  };

  return (
    <Layout>
      <div className="container-fluid pt-4">
        <h2 className="display-6 mb-3">
          <i className="bi bi-image-fill me-2" />
          Configuración de Fondo de Login
        </h2>
        <p className="text-muted mb-4">
          Define la imagen de fondo y el nivel de transparencia para la página
          de inicio de sesión.
        </p>

        {message && (
          <Alert variant="success" dismissible onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Row className="g-4">
          <Col lg={6}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>URL de la imagen</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Cargar imagen desde archivo</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    Transparencia de capa oscura: {overlayOpacity}%
                  </Form.Label>
                  <Form.Range
                    min={0}
                    max={90}
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Color de la tarjeta de login</Form.Label>
                  <Form.Control
                    type="color"
                    value={cardColor}
                    onChange={(e) => setCardColor(e.target.value)}
                    style={{ width: '80px', height: '40px' }}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    Transparencia de la tarjeta: {cardOpacity}%
                  </Form.Label>
                  <Form.Range
                    min={20}
                    max={100}
                    value={cardOpacity}
                    onChange={(e) => setCardOpacity(Number(e.target.value))}
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="primary" onClick={handleSave}>
                    Guardar configuración
                  </Button>
                  <Button variant="outline-secondary" onClick={handleReset}>
                    Restaurar por defecto
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={6}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title className="mb-3">Vista previa</Card.Title>
                <div
                  className="rounded border d-flex align-items-center justify-content-center"
                  style={{
                    minHeight: '280px',
                    ...previewStyle,
                  }}
                >
                  <div
                    className="rounded shadow-sm p-3 text-center"
                    style={{
                      width: '80%',
                      maxWidth: '320px',
                      backgroundColor: hexToRgba(cardColor, cardOpacity / 100),
                    }}
                  >
                    <strong>Iniciar Sesión</strong>
                    <div className="small text-muted mt-1">Preview</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Layout>
  );
};

export default LoginBackgroundConfigPage;
