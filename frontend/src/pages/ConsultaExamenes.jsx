// src/pages/ConsultaExamenes.jsx

// Importaciones de React y hooks necesarios
import React, { useState } from 'react';
// Importación del servicio para consultar las reservas de exámenes.
// CONFIGURABLE: El endpoint y la lógica de este servicio se encuentran en 'src/services/publicService.js'.
import { consultarResevaExamenes } from '../services/publicService';
// Importaciones de componentes de React Bootstrap para la UI
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Spinner,
  Alert,
  Table,
} from 'react-bootstrap';
// Importación de jsPDF para la generación de documentos PDF
import jsPDF from 'jspdf';
// Importación del plugin jspdf-autotable para crear tablas fácilmente en el PDF
import autoTable from 'jspdf-autotable';

// Definición del componente funcional ConsultaExamenes
const ConsultaExamenes = () => {
  // --- ESTADOS DEL COMPONENTE ---
  // Estado para el tipo de usuario que realiza la consulta (alumno/docente). OPCIONES: 'alumno', 'docente'.
  const [tipoUsuario, setTipoUsuario] = useState('alumno');
  // Estado para el identificador del usuario (email).
  const [identificador, setIdentificador] = useState('');
  // Estado para almacenar el nombre/email del consultante, usado en el PDF.
  const [nombreConsultante, setNombreConsultante] = useState(''); // Para el PDF
  // Estado para almacenar las reservas de exámenes obtenidas de la API.
  const [reservas, setReservas] = useState([]);
  // Estado para controlar la visualización del spinner de carga.
  const [loading, setLoading] = useState(false);
  // Estado para almacenar mensajes de error.
  const [error, setError] = useState(null);
  // Estado para saber si ya se realizó una búsqueda (controla mensajes iniciales).
  const [searched, setSearched] = useState(false);

  // --- MANEJADOR DE BÚSQUEDA ---
  // Función asíncrona que se ejecuta al enviar el formulario de búsqueda.
  const handleSearch = async (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario (recargar la página).
    // Validación: si el identificador está vacío, muestra un error.
    if (!identificador.trim()) {
      setError('Por favor, ingrese su Email institucional.');
      setSearched(true);
      setReservas([]);
      return;
    }
    setLoading(true);
    setError(null);
    setReservas([]);
    setSearched(true);
    // Guarda el identificador actual para usarlo en el título del PDF.
    setNombreConsultante(identificador); // Guardar el identificador para el PDF
    try {
      // Llamada a la API para obtener las reservas.
      // CONFIGURABLE: La función `consultarResevaExamenes` y su lógica interna son configurables.
      const data = await consultarResevaExamenes(identificador, tipoUsuario);
      setReservas(data || []);
      // Si no hay datos, no se considera un error, simplemente no hay resultados.
      // El mensaje "No se encontraron reservas..." se maneja en la sección de renderizado.
      if (!data || data.length === 0) {
        // Si data es null o array vacío
        // No es un error de servidor, simplemente no hay resultados
        // El mensaje "No se encontraron reservas..." se manejará en el return
      }
    } catch (err) {
      // Manejo de errores de la API.
      setError(
        err.error ||
          err.details ||
          err.message ||
          'Error al buscar las reservas. Verifique los datos o intente más tarde.'
      );
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  // --- MANEJADOR DE IMPRESIÓN A PDF ---
  // Función que genera un PDF con todas las reservas visibles en la tabla.
  const handlePrintAllVisible = () => {
    // Validación: si no hay reservas, muestra una alerta y no continúa.
    if (!reservas || reservas.length === 0) {
      alert('No hay reservas para imprimir.');
      return;
    }

    const doc = new jsPDF();

    // --- CONFIGURACIÓN DEL CONTENIDO DEL PDF ---
    // Título Principal del PDF.
    // CONFIGURABLE: Texto del título, tamaño de fuente, tipo de fuente, alineación y posición.
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(
      'Programación de Examenes',
      doc.internal.pageSize.getWidth() / 2,
      22,
      { align: 'center' }
    );

    // Información del Usuario/Consulta en el PDF.
    // CONFIGURABLE: Textos, formato de fecha/hora, posición.
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Correo: ${nombreConsultante}`, 14, 35); // Usa el identificador guardado
    doc.text(
      `Usuario: ${tipoUsuario.charAt(0).toUpperCase() + tipoUsuario.slice(1)}`,
      14,
      42
    );
    doc.text(
      `Fecha de Emisión: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`,
      14,
      49
    );

    // Definir las columnas para la tabla en el PDF.
    // CONFIGURABLE: Nombres de las columnas y qué columnas mostrar.
    const tableColumn = [
      'Examen',
      //'Asignatura',
      //'Sección',
      'Fecha',
      'Horario',
      'Sala',
      //'Estado Reserva',
    ];
    if (tipoUsuario === 'docente') {
      // Columna adicional si el usuario es 'docente'.
      tableColumn.push('Confirmación Docente');
    }

    // Preparar las filas para la tabla en el PDF a partir de los datos de 'reservas'.
    const tableRows = [];
    // CONFIGURABLE: Qué datos de cada reserva se mapean a las columnas y cómo se formatean (ej. fechas).
    reservas.forEach((res) => {
      const rowData = [
        res.NOMBRE_EXAMEN || 'N/A',
        //res.NOMBRE_ASIGNATURA || 'N/A',
        //res.NOMBRE_SECCION || 'N/A',
        res.FECHA_RESERVA
          ? new Date(res.FECHA_RESERVA).toLocaleDateString('es-CL')
          : 'N/A',
        `${res.HORA_INICIO || 'N/A'} - ${res.HORA_FIN || 'N/A'}`,
        res.NOMBRE_SALA || 'N/A',
        //res.ESTADO_RESERVA || 'N/A',
      ];
      if (tipoUsuario === 'docente') {
        rowData.push(res.ESTADO_CONFIRMACION_DOCENTE || 'N/A');
      }
      tableRows.push(rowData);
    });

    // Uso de la función autoTable para generar la tabla en el PDF.
    // CONFIGURABLE: Todas las opciones de autoTable son configurables.
    autoTable(doc, {
      head: [tableColumn], // Encabezados de la tabla.
      body: tableRows, // Datos de la tabla.
      // Posición inicial (eje Y) de la tabla.
      startY: 60,
      // TEMA de la tabla. OPCIONES: 'striped', 'grid', 'plain'.
      theme: 'striped',
      // ESTILOS para la cabecera de la tabla.
      // CONFIGURABLE: Color de fondo, color de texto, estilo de fuente.
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      }, // Azul oscuro para cabecera
      // ESTILOS para filas alternas (si theme='striped').
      // CONFIGURABLE: Color de fondo.
      alternateRowStyles: { fillColor: [245, 245, 245] },
      // ESTILOS generales para las celdas de la tabla.
      // CONFIGURABLE: Fuente, tamaño de fuente, padding, alineación vertical.
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 2.5,
        valign: 'middle',
      },
      // ESTILOS específicos por columna.
      // CONFIGURABLE: Ancho de celda para cada columna (índice basado en 0).
      columnStyles: {
        // Ajustar ancho de columnas si es necesario
        0: { cellWidth: 40 }, // Examen
        1: { cellWidth: 40 }, // Asignatura
        // Ajusta las otras según necesites
      },
      // Función que se ejecuta después de dibujar cada página. Útil para añadir cabeceras/pies de página.
      // CONFIGURABLE: Contenido y estilo del pie de página.
      didDrawPage: function (data) {
        let footerStr = 'Página ' + doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        const pageHeight =
          doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.text(footerStr, data.settings.margin.left, pageHeight - 10);
      },
    });
    // Nombre del archivo PDF generado.
    // CONFIGURABLE: Formato del nombre del archivo.
    const fileName = `consulta_examenes_${nombreConsultante.replace(/[^a-zA-Z0-9]/g, '_') || 'usuario'}.pdf`;
    doc.save(fileName);
  };

  return (
    <Container
      fluid
      // --- ESTILOS DEL CONTENEDOR PRINCIPAL ---
      className="py-4"
      style={{
        maxWidth: '1200px',
        margin: 'auto',
        backgroundColor: '#fff',
        minHeight: '200vh',
        color: '#333',
      }}
    >
      {/* Sección del logo y título */}
      <div className="text-center mb-4">
        <img
          src="/images/logoduoc.svg.png"
          alt="Logo Duoc UC"
          style={{ height: '60px' }}
        />
        <h1 className="h3 mt-3" style={{ color: '#0033a0' }}>
          Consulta de Exámenes Programados
        </h1>{' '}
        {/* Color Duoc UC */}
      </div>

      {/* Formulario de búsqueda */}
      <Form
        onSubmit={handleSearch}
        className="mb-4 p-4 border rounded shadow-sm bg-light"
      >
        <Row className="align-items-end">
          {/* Campo para el identificador (Email) */}
          <Col md={5} className="mb-3 mb-md-0">
            <Form.Group controlId="identificadorInput">
              <Form.Label className="fw-bold">
                Identificador (Email Institucional)
              </Form.Label>
              <Form.Control
                type="email"
                placeholder="ejemplo@duocuc.cl"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                required
                className="form-control-lg"
              />
            </Form.Group>
          </Col>
          {/* Selección del tipo de usuario */}
          <Col md={4} className="mb-3 mb-md-0">
            <Form.Group controlId="tipoUsuarioRadio">
              <Form.Label className="fw-bold">Consultar como:</Form.Label>
              <div>
                <Form.Check
                  inline
                  type="radio"
                  label="Alumno"
                  name="tipoUsuario"
                  id="tipoAlumnoKiosko"
                  value="alumno"
                  checked={tipoUsuario === 'alumno'}
                  onChange={(e) => setTipoUsuario(e.target.value)}
                />
                <Form.Check
                  inline
                  type="radio"
                  label="Docente"
                  name="tipoUsuario"
                  id="tipoDocenteKiosko"
                  value="docente"
                  checked={tipoUsuario === 'docente'}
                  onChange={(e) => setTipoUsuario(e.target.value)}
                />
              </div>
            </Form.Group>
          </Col>
          {/* Botón de búsqueda */}
          <Col md={3} className="d-grid">
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              size="lg"
              style={{ backgroundColor: '#0033a0', borderColor: '#0033a0' }}
            >
              {loading ? (
                <Spinner as="span" animation="border" size="sm" />
              ) : (
                'Buscar'
              )}
            </Button>
          </Col>
        </Row>
      </Form>

      {/* Indicador de carga */}
      {loading && searched && (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Buscando...</p>
        </div>
      )}
      {error && (
        // Alerta para mostrar errores
        <Alert
          variant="danger"
          onClose={() => {
            setError(null);
            setSearched(false);
          }}
          dismissible
          className="mt-3"
        >
          {error}
        </Alert>
      )}

      {/* Mensaje si no se encontraron resultados y no hay error */}
      {!loading && searched && reservas.length === 0 && !error && (
        <Alert variant="info" className="mt-3">
          No se encontraron exámenes programados con los datos proporcionados.
        </Alert>
      )}

      {/* Sección para mostrar los resultados de la búsqueda si hay reservas */}
      {reservas.length > 0 && (
        <>
          <div className="d-flex justify-content-between align-items-center mt-4 mb-2">
            <h3 className="h5">Resultados de la Búsqueda:</h3>
            <Button
              variant="outline-primary"
              onClick={handlePrintAllVisible}
              disabled={loading}
            >
              <i className="bi bi-printer-fill me-2"></i>Imprimir Lista
            </Button>
          </div>
          {/* Tabla de resultados */}
          <Table bordered hover responsive size="sm" className="mt-2">
            <thead className="table-light">
              {/* Cabeceras de la tabla. CONFIGURABLE: Columnas a mostrar. */}
              <tr>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Examen</th>
                <th>Sala</th>
                <th>Estado Reserva</th>
                {tipoUsuario === 'docente' && <th>Confirmación Docente</th>}
              </tr>
            </thead>
            <tbody>
              {/* Mapeo de las reservas para crear las filas de la tabla. */}
              {reservas.map((res) => (
                <tr key={res.ID_RESERVA}>
                  <td>
                    {res.FECHA_RESERVA
                      ? new Date(res.FECHA_RESERVA).toLocaleDateString('es-CL')
                      : 'N/A'}
                  </td>
                  <td>{`${res.HORA_INICIO || 'N/A'} - ${res.HORA_FIN || 'N/A'}`}</td>
                  <td>{res.NOMBRE_EXAMEN || 'N/A'}</td>
                  <td>{res.NOMBRE_SALA || 'N/A'}</td>
                  <td>{res.ESTADO_RESERVA || 'N/A'}</td>
                  {tipoUsuario === 'docente' && (
                    <td>{res.ESTADO_CONFIRMACION_DOCENTE || 'N/A'}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}
    </Container>
  );
};

export default ConsultaExamenes;
