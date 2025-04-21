import bcrypt from 'bcrypt';
// Mock temporal para simular la base de datos
const usuariosMock = [];
// Función para registrar un nuevo usuario
export const register = async (req, res) => {
  try {
    const { nombre, correo, contraseña, rol } = req.body;
    // Validar campos vacíos
    if (!nombre || !correo || !contraseña || !rol) {
      return res
        .status(400)
        .json({ error: 'Todos los campos son obligatorios' });
    }
    // Validar si el correo ya está registrado
    const usuarioExistente = usuariosMock.find(
      (usuario) => usuario.correo === correo
    );
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const contraseñaHasheada = await bcrypt.hash(contraseña, salt);
    // Crear usuario *SIMULADO
    const nuevoUsuario = {
      id: usuariosMock.length + 1,
      nombre,
      correo,
      contraseña: contraseñaHasheada,
      rol,
    };
    // Guardar usuario en la "base de datos" *SIMULADO
    usuariosMock.push(nuevoUsuario);
    //Retornar respuesta exitosa
    res.status(201).json({
      mensaje: 'Usuario registrado con éxito',
      usuario: { id: nuevoUsuario.id, correo, rol },
    });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
