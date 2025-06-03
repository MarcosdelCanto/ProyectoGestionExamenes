// src/pages/ConsultaExamenes.jsx
import React, { useState } from 'react';
// Asegúrate que el nombre de la función importada sea el correcto de tu publicService.js
import { consultarResevaExamenes } from '../services/publicService';
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Changed this line

const ConsultaExamenes = () => {
  const [tipoUsuario, setTipoUsuario] = useState('alumno');
  const [identificador, setIdentificador] = useState('');
  const [nombreConsultante, setNombreConsultante] = useState(''); // Para el PDF
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
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
    setNombreConsultante(identificador); // Guardar el identificador para el PDF
    try {
      const data = await consultarResevaExamenes(identificador, tipoUsuario);
      setReservas(data || []);
      if (!data || data.length === 0) {
        // Si data es null o array vacío
        // No es un error de servidor, simplemente no hay resultados
        // El mensaje "No se encontraron reservas..." se manejará en el return
      }
    } catch (err) {
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

  const handlePrintAllVisible = () => {
    if (!reservas || reservas.length === 0) {
      alert('No hay reservas para imprimir.');
      return;
    }

    const doc = new jsPDF();

    // Título Principal del PDF
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(
      'Comprobante de Exámenes Programados',
      doc.internal.pageSize.getWidth() / 2,
      22,
      { align: 'center' }
    );

    // Información del Usuario/Consulta
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Consulta para: ${nombreConsultante}`, 14, 35); // Usa el identificador guardado
    doc.text(
      `Tipo de Usuario: ${tipoUsuario.charAt(0).toUpperCase() + tipoUsuario.slice(1)}`,
      14,
      42
    );
    doc.text(
      `Fecha de Emisión: ${new Date().toLocaleDateString('es-CL')} ${new Date().toLocaleTimeString('es-CL')}`,
      14,
      49
    );

    // Definir las columnas para la tabla en el PDF
    const tableColumn = [
      'Examen',
      'Asignatura',
      'Sección',
      'Fecha',
      'Horario',
      'Sala',
      'Estado Reserva',
    ];
    if (tipoUsuario === 'docente') {
      tableColumn.push('Confirmación Docente');
    }

    // Definir las filas para la tabla en el PDF
    const tableRows = [];
    reservas.forEach((res) => {
      const rowData = [
        res.NOMBRE_EXAMEN || 'N/A',
        res.NOMBRE_ASIGNATURA || 'N/A',
        res.NOMBRE_SECCION || 'N/A',
        res.FECHA_RESERVA
          ? new Date(res.FECHA_RESERVA).toLocaleDateString('es-CL')
          : 'N/A',
        `${res.HORA_INICIO || 'N/A'} - ${res.HORA_FIN || 'N/A'}`,
        res.NOMBRE_SALA || 'N/A',
        res.ESTADO_RESERVA || 'N/A',
      ];
      if (tipoUsuario === 'docente') {
        rowData.push(res.ESTADO_CONFIRMACION_DOCENTE || 'N/A');
      }
      tableRows.push(rowData);
    });

    // Use the direct autoTable function call
    autoTable(doc, {
      head: [tableColumn], // Pass tableColumn as an array within 'head'
      body: tableRows, // Pass tableRows directly to 'body'
      // The rest of your options remain the same
      startY: 60,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      }, // Azul oscuro para cabecera
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 2.5,
        valign: 'middle',
      },
      columnStyles: {
        // Ajustar ancho de columnas si es necesario
        0: { cellWidth: 40 }, // Examen
        1: { cellWidth: 40 }, // Asignatura
        // Ajusta las otras según necesites
      },
      didDrawPage: function (data) {
        let footerStr = 'Página ' + doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        const pageHeight =
          doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.text(footerStr, data.settings.margin.left, pageHeight - 10);
      },
    });

    const fileName = `consulta_examenes_${nombreConsultante.replace(/[^a-zA-Z0-9]/g, '_') || 'usuario'}.pdf`;
    doc.save(fileName);
  };

  return (
    <Container
      fluid
      className="py-4"
      style={{
        maxWidth: '900px',
        margin: 'auto',
        backgroundColor: '#fff',
        minHeight: '100vh',
        color: '#333',
      }}
    >
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

      <Form
        onSubmit={handleSearch}
        className="mb-4 p-4 border rounded shadow-sm bg-light"
      >
        <Row className="align-items-end">
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

      {loading && searched && (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Buscando...</p>
        </div>
      )}
      {error && (
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

      {!loading && searched && reservas.length === 0 && !error && (
        <Alert variant="info" className="mt-3">
          No se encontraron exámenes programados con los datos proporcionados.
        </Alert>
      )}

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
          <Table striped bordered hover responsive size="sm" className="mt-2">
            <thead className="table-light">
              <tr>
                <th>Examen</th>
                <th>Asignatura</th>
                <th>Sección</th>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Sala</th>
                <th>Estado Reserva</th>
                {tipoUsuario === 'docente' && <th>Confirmación Docente</th>}
                {/* Columna de imprimir individual eliminada */}
              </tr>
            </thead>
            <tbody>
              {reservas.map((res) => (
                <tr key={res.ID_RESERVA}>
                  <td>{res.NOMBRE_EXAMEN || 'N/A'}</td>
                  <td>{res.NOMBRE_ASIGNATURA || 'N/A'}</td>
                  <td>{res.NOMBRE_SECCION || 'N/A'}</td>
                  <td>
                    {res.FECHA_RESERVA
                      ? new Date(res.FECHA_RESERVA).toLocaleDateString('es-CL')
                      : 'N/A'}
                  </td>
                  <td>{`${res.HORA_INICIO || 'N/A'} - ${res.HORA_FIN || 'N/A'}`}</td>
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
