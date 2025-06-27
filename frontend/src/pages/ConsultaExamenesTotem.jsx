// src/pages/ConsultaExamenesTotem.jsx

import React, { useState } from 'react';
import { consultarResevaExamenes } from '../services/publicService';
import { enviarPDFPorCorreo } from '../services/emailService'; // Nuevo servicio
import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Spinner,
  Alert,
  Table,
  Modal,
  Card,
} from 'react-bootstrap';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ConsultaExamenesTotem.css';

const ConsultaExamenesTotem = () => {
  // Estados
  const [tipoUsuario, setTipoUsuario] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [emailCompleto, setEmailCompleto] = useState('');
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);

  // Función para seleccionar tipo de usuario
  const seleccionarTipoUsuario = (tipo) => {
    setTipoUsuario(tipo);
    setNombreUsuario('');
    setEmailCompleto('');
    setError(null);
    setMostrarResultados(false);
    setReservas([]);
  };

  // Función para manejar cambio en el input de usuario
  const handleUsuarioChange = (e) => {
    const valor = e.target.value;
    setNombreUsuario(valor);

    // Autocompletar email según tipo de usuario
    if (valor.trim()) {
      const dominio =
        tipoUsuario === 'docente' ? '@profesor.duoc.cl' : '@duocuc.cl';
      setEmailCompleto(valor + dominio);
    } else {
      setEmailCompleto('');
    }
  };

  // Función para realizar la búsqueda
  const handleBuscar = async () => {
    if (!nombreUsuario.trim()) {
      setError('Por favor, ingrese su nombre de usuario.');
      return;
    }

    setLoading(true);
    setError(null);
    setReservas([]);

    try {
      const data = await consultarResevaExamenes(emailCompleto, tipoUsuario);
      setReservas(data || []);
      setMostrarResultados(true);

      if (!data || data.length === 0) {
        setError('No se encontraron exámenes programados para este usuario.');
      }
    } catch (err) {
      setError(
        err.error ||
          err.details ||
          err.message ||
          'Error al buscar los exámenes. Verifique los datos o intente más tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para generar PDF
  const generarPDF = () => {
    if (!reservas || reservas.length === 0) {
      alert('No hay exámenes para generar PDF.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // HEADER CON COLORES INSTITUCIONALES
    // Fondo azul institucional para el header
    doc.setFillColor(0, 61, 122); // Color azul Duoc UC
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Título principal en blanco
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('DUOC UC', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestion de Examenes', pageWidth / 2, 25, {
      align: 'center',
    });

    doc.setFontSize(9);
    doc.text('Programacion Academica', pageWidth / 2, 35, { align: 'center' });

    // INFORMACIÓN DEL USUARIO
    doc.setTextColor(0, 0, 0); // Volver a negro
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    // Tipo de usuario
    const tipoTexto = tipoUsuario === 'docente' ? 'DOCENTE' : 'ESTUDIANTE';
    doc.text(`PERFIL: ${tipoTexto}`, 20, 60);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Email: ${emailCompleto}`, 20, 68);
    doc.text(
      `Fecha de consulta: ${new Date().toLocaleDateString('es-CL')}`,
      20,
      75
    );
    doc.text(
      `Hora de consulta: ${new Date().toLocaleTimeString('es-CL')}`,
      20,
      82
    );

    // Línea separadora
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 61, 122);
    doc.line(20, 90, pageWidth - 20, 90);

    // TÍTULO DE LA TABLA
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 61, 122);
    doc.text(`EXAMENES PROGRAMADOS (${reservas.length})`, 20, 100);

    // Definir columnas de la tabla
    const tableColumn = ['Fecha', 'Horario', 'Examen', 'Docente', 'Sala'];

    // Preparar filas de la tabla
    const tableRows = [];
    reservas.forEach((res, index) => {
      const rowData = [
        res.FECHA_RESERVA
          ? new Date(res.FECHA_RESERVA).toLocaleDateString('es-CL')
          : 'N/A',
        `${res.HORA_INICIO || 'N/A'} - ${res.HORA_FIN || 'N/A'}`,
        res.NOMBRE_EXAMEN || 'N/A',
        res.NOMBRE_DOCENTE || 'N/A',
        res.NOMBRE_SALA || 'N/A',
      ];

      tableRows.push(rowData);
    });

    // Crear tabla en PDF con estilos mejorados
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 108,
      styles: {
        fontSize: 8,
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      headStyles: {
        fillColor: [0, 61, 122], // Azul institucional
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250], // Gris muy claro para filas alternadas
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 }, // Fecha
        1: { halign: 'center', cellWidth: 30 }, // Horario
        2: { halign: 'left', cellWidth: 50 }, // Examen
        3: { halign: 'left', cellWidth: 35 }, // Docente
        4: { halign: 'center', cellWidth: 25 }, // Sala
      },
      margin: { left: 20, right: 20 },
      theme: 'grid',
    });

    // FOOTER
    const finalY = doc.lastAutoTable.finalY || 200;

    // Línea separadora inferior
    doc.setLineWidth(0.3);
    doc.setDrawColor(0, 61, 122);
    doc.line(20, finalY + 8, pageWidth - 20, finalY + 8);

    // Información del footer
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Duoc UC - Sistema de Gestion de Examenes Transversales',
      20,
      finalY + 15
    );
    doc.text(
      `Documento generado automaticamente el ${new Date().toLocaleDateString('es-CL')} a las ${new Date().toLocaleTimeString('es-CL')}`,
      20,
      finalY + 20
    );

    // Número de página
    doc.setTextColor(0, 61, 122);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('Pagina 1', pageWidth - 30, finalY + 15, { align: 'center' });

    return doc;
  };

  // Función para descargar PDF
  const descargarPDF = () => {
    const doc = generarPDF();
    doc.save(
      `examenes_${tipoUsuario}_${nombreUsuario}_${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  // Función para enviar PDF por email
  const enviarPDFPorEmail = async () => {
    setEnviandoEmail(true);
    try {
      const doc = generarPDF();
      const pdfBlob = doc.output('blob');

      // Llamar al servicio para enviar email
      await enviarPDFPorCorreo(emailCompleto, pdfBlob, tipoUsuario);

      setEmailEnviado(true);
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailEnviado(false);
      }, 3000);
    } catch (error) {
      setError('Error al enviar el PDF por correo. Intente nuevamente.');
    } finally {
      setEnviandoEmail(false);
    }
  };

  // Función para reiniciar la consulta
  const reiniciarConsulta = () => {
    setTipoUsuario('');
    setNombreUsuario('');
    setEmailCompleto('');
    setReservas([]);
    setError(null);
    setMostrarResultados(false);
    setShowEmailModal(false);
    setEmailEnviado(false);
  };

  return (
    <div className="totem-container">
      <Container fluid className="h-100">
        {/* Header con Logo */}
        <Row className="totem-header">
          <Col className="text-center">
            <img
              src="/images/logoduoc.svg.png"
              alt="Duoc UC"
              className="totem-logo"
            />
            <h1 className="totem-title">
              <i className="fas fa-university me-3"></i>
              Sistema de Gestión de Exámenes Transversales
            </h1>
            <p className="totem-subtitle">
              <i className="fas fa-calendar-alt me-2"></i>
              Consulta de Programación Académica
            </p>
          </Col>
        </Row>

        {/* Selección de Tipo de Usuario */}
        {!tipoUsuario && (
          <Row className="justify-content-center tipo-usuario-section">
            <Col md={10}>
              <h2 className="text-center mb-5">
                <i className="fas fa-user-check me-2"></i>
                Seleccione su perfil
              </h2>
              <Row className="justify-content-center">
                <Col md={5} className="mb-4">
                  <Card
                    className="tipo-usuario-card h-100"
                    onClick={() => seleccionarTipoUsuario('docente')}
                  >
                    <Card.Body className="text-center d-flex flex-column">
                      <div className="tipo-usuario-icon docente-icon">
                        <i className="fas fa-user-tie"></i>
                      </div>
                      <h3 className="mt-3">
                        <i className="fas fa-chalkboard-teacher me-2"></i>
                        Docente
                      </h3>
                      <p className="text-muted">
                        <i className="fas fa-clipboard-list me-1"></i>
                        Consultar exámenes asignados
                      </p>
                      <div className="mt-auto">
                        <span className="badge badge-docente">
                          <i className="fas fa-at me-1"></i>
                          profesor.duoc.cl
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={5} className="mb-4">
                  <Card
                    className="tipo-usuario-card h-100"
                    onClick={() => seleccionarTipoUsuario('alumno')}
                  >
                    <Card.Body className="text-center d-flex flex-column">
                      <div className="tipo-usuario-icon alumno-icon">
                        <i className="fas fa-user-graduate"></i>
                      </div>
                      <h3 className="mt-3">
                        <i className="fas fa-graduation-cap me-2"></i>
                        Estudiante
                      </h3>
                      <p className="text-muted">
                        <i className="fas fa-calendar-check me-1"></i>
                        Consultar mis exámenes
                      </p>
                      <div className="mt-auto">
                        <span className="badge badge-alumno">
                          <i className="fas fa-at me-1"></i>
                          duocuc.cl
                        </span>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        )}

        {/* Formulario de Búsqueda */}
        {tipoUsuario && !mostrarResultados && (
          <Row className="justify-content-center busqueda-section">
            <Col md={8}>
              <Card className="busqueda-card">
                <Card.Body>
                  <div className="text-center mb-4">
                    <div
                      className={`selected-tipo-icon ${tipoUsuario}-icon-small`}
                    >
                      <i
                        className={`fas ${tipoUsuario === 'docente' ? 'fa-user-tie' : 'fa-user-graduate'}`}
                      ></i>
                    </div>
                    <h3>
                      <i
                        className={`fas ${tipoUsuario === 'docente' ? 'fa-chalkboard-teacher' : 'fa-graduation-cap'} me-2`}
                      ></i>
                      {tipoUsuario === 'docente' ? 'Docente' : 'Estudiante'}
                    </h3>
                  </div>

                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleBuscar();
                    }}
                  >
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-totem">
                        <i className="fas fa-user me-2"></i>
                        Nombre de Usuario
                      </Form.Label>
                      <div className="input-group-totem">
                        <Form.Control
                          type="text"
                          placeholder="Ingrese su nombre de usuario"
                          value={nombreUsuario}
                          onChange={handleUsuarioChange}
                          className="input-totem"
                          autoFocus
                        />
                        <div className="input-suffix">
                          <i className="fas fa-at me-1"></i>
                          {tipoUsuario === 'docente'
                            ? 'profesor.duoc.cl'
                            : 'duocuc.cl'}
                        </div>
                      </div>
                      {emailCompleto && (
                        <div className="email-preview">
                          <i className="fas fa-envelope me-2"></i>
                          Email completo: <strong>{emailCompleto}</strong>
                        </div>
                      )}
                    </Form.Group>

                    {error && (
                      <Alert variant="danger" className="mb-4">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {error}
                      </Alert>
                    )}

                    <div className="text-center">
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={handleBuscar}
                        disabled={loading || !nombreUsuario.trim()}
                        className="btn-buscar-totem btn-totem btn-primary me-3"
                      >
                        {loading ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Buscando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-search me-2"></i>
                            Buscar Exámenes
                          </>
                        )}
                      </Button>

                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={reiniciarConsulta}
                        className="btn-volver-totem btn-totem btn-secondary"
                      >
                        <i className="fas fa-arrow-left me-2"></i>
                        Cambiar Perfil
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Resultados */}
        {mostrarResultados && (
          <Row className="resultados-section">
            <Col>
              <Card className="resultados-card">
                <Card.Header className="resultados-header">
                  <Row className="align-items-center">
                    <Col>
                      <h4 className="mb-0">
                        <i
                          className={`fas ${tipoUsuario === 'docente' ? 'fa-user-tie' : 'fa-user-graduate'} me-2`}
                        ></i>
                        Exámenes - {emailCompleto}
                      </h4>
                    </Col>
                    <Col xs="auto">
                      <Button
                        variant="secondary"
                        onClick={reiniciarConsulta}
                        className="btn-totem btn-secondary me-2"
                      >
                        <i className="fas fa-redo me-2"></i>
                        Nueva Consulta
                      </Button>
                    </Col>
                  </Row>
                </Card.Header>

                <Card.Body>
                  {error && (
                    <Alert variant="warning" className="mb-4">
                      <i className="fas fa-info-circle me-2"></i>
                      {error}
                    </Alert>
                  )}

                  {reservas.length > 0 && (
                    <>
                      <div className="text-center mb-4">
                        <Button
                          variant={
                            tipoUsuario === 'docente' ? 'warning' : 'success'
                          }
                          size="lg"
                          onClick={descargarPDF}
                          className={`btn-totem me-3 ${tipoUsuario === 'docente' ? 'btn-warning' : 'btn-success'}`}
                        >
                          <i className="fas fa-print me-2"></i>
                          Descargar PDF
                        </Button>

                        <Button
                          variant="info"
                          size="lg"
                          onClick={() => setShowEmailModal(true)}
                          className="btn-totem btn-info"
                        >
                          <i className="fas fa-envelope me-2"></i>
                          Enviar por Email
                        </Button>
                      </div>

                      <div className="table-responsive">
                        <Table
                          striped
                          bordered
                          hover
                          className="examenes-table"
                        >
                          <thead className="table-dark">
                            <tr>
                              <th>
                                <i className="fas fa-calendar me-2"></i>Fecha
                              </th>
                              <th>
                                <i className="fas fa-clock me-2"></i>Horario
                              </th>
                              <th>
                                <i className="fas fa-file-alt me-2"></i>Examen
                              </th>
                              <th>
                                <i className="fas fa-user me-2"></i>Docente
                              </th>
                              <th>
                                <i className="fas fa-door-open me-2"></i>Sala
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {reservas.map((reserva, index) => (
                              <tr key={reserva.ID_RESERVA || index}>
                                <td>
                                  {reserva.FECHA_RESERVA
                                    ? new Date(
                                        reserva.FECHA_RESERVA
                                      ).toLocaleDateString('es-CL')
                                    : 'N/A'}
                                </td>
                                <td>{`${reserva.HORA_INICIO || 'N/A'} - ${reserva.HORA_FIN || 'N/A'}`}</td>
                                <td className="fw-bold">
                                  {reserva.NOMBRE_EXAMEN || 'N/A'}
                                </td>
                                <td>{reserva.NOMBRE_DOCENTE || 'N/A'}</td>
                                <td>{reserva.NOMBRE_SALA || 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>

      {/* Modal para envío por email */}
      <Modal
        show={showEmailModal}
        onHide={() => setShowEmailModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-envelope me-2"></i>
            Enviar PDF por Email
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {emailEnviado ? (
            <div className="text-success">
              <i className="fas fa-check-circle fa-3x mb-3"></i>
              <h5>¡Email enviado exitosamente!</h5>
              <p>
                El PDF ha sido enviado a: <strong>{emailCompleto}</strong>
              </p>
            </div>
          ) : (
            <>
              <i className="fas fa-paper-plane fa-3x text-info mb-3"></i>
              <h5>¿Enviar PDF a su correo institucional?</h5>
              <p className="text-muted mb-4">
                Se enviará el PDF con la programación de exámenes a:
                <br />
                <strong>{emailCompleto}</strong>
              </p>

              <div className="d-grid gap-2">
                <Button
                  variant="success"
                  size="lg"
                  onClick={enviarPDFPorEmail}
                  disabled={enviandoEmail}
                  className="btn-totem"
                >
                  {enviandoEmail ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-2"></i>
                      Confirmar Envío
                    </>
                  )}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setShowEmailModal(false)}
                  disabled={enviandoEmail}
                  className="btn-totem"
                >
                  <i className="fas fa-times me-2"></i>
                  Cancelar
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ConsultaExamenesTotem;
