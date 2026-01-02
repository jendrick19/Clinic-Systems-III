// fileName: src/modules/platform/services/AuthService.js
const bcrypt = require('bcryptjs');
const db = require('../../../../database/models');
const { User } = db.modules.platform;
const { Professional, PeopleAttended } = db.modules.operative;
const { NotFoundError, BusinessLogicError } = require('../../../shared/errors/CustomErrors');

const loginByIdentifier = async (documentType, identifier, password) => {
  const identifierStr = String(identifier).trim().toUpperCase();

  // 1. Construir el Username exacto tal cual está en la base de datos Users
  let usernameToFind = identifierStr;
  
  if (documentType) {
    // Es un paciente, debemos agregar el prefijo según tu regla
    let prefix = '';
    const docTypeLower = documentType.toLowerCase();
    
    // Mapeo de prefijos actualizado
    if (docTypeLower === 'cedula') prefix = 'V'; // Venezolano
    else if (docTypeLower === 'extranjero') prefix = 'E'; // Extranjero
    else if (docTypeLower === 'rif') prefix = 'J'; // RIF (Jurídico es J por estándar, si prefieres R cámbialo aquí)
    else if (docTypeLower === 'pasaporte') prefix = 'P'; // Pasaporte
    else prefix = 'V'; // Default
    
    // Limpiamos si el usuario ya escribió el prefijo (ej: V-12345)
    // Eliminamos cualquier letra inicial seguida de guion o sin guion para quedarnos solo con el numero
    const cleanNumber = identifierStr.replace(/^[VEJPRG]-?|[VEJPRG]/, ''); 
    
    usernameToFind = `${prefix}${cleanNumber}`;
  } 
  // Si no hay documentType, asumimos que es Profesional y el username es el registro tal cual (ej: MPPS-123)

  console.log(`[Auth] Intentando login con usuario: ${usernameToFind}`);

  // 2. VALIDACIÓN ESTRICTA: Buscar SOLO en la tabla Users
  const user = await User.findOne({ where: { username: usernameToFind } });
  
  if (!user) {
    throw new NotFoundError(`Usuario no encontrado: ${usernameToFind}`);
  }

  if (!user.status) {
    throw new BusinessLogicError('El usuario está inactivo');
  }

  // 3. Verificar Contraseña
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new BusinessLogicError('Credenciales inválidas (contraseña incorrecta)');
  }

  // 4. Buscar Datos del Perfil (Paciente o Profesional)
  // Intentamos buscar primero como Profesional vinculado
  const professional = await Professional.findOne({ where: { userId: user.id } });
  
  if (professional) {
    return {
      type: 'admin',
      data: {
        id: professional.id,
        userId: user.id,
        nombre: `${professional.names} ${professional.surNames}`,
        email: professional.email,
        professionalRegister: professional.professionalRegister,
        specialty: professional.specialty,
        role: 'professional'
      },
    };
  }

  // Si no es profesional, buscamos como Paciente usando el número de documento
  // Extraemos el número del username (quitamos la primera letra: V123 -> 123)
  const docIdFromUser = usernameToFind.substring(1); 
  
  const person = await PeopleAttended.findOne({ 
    where: { 
      documentId: docIdFromUser 
    } 
  });

  if (person) {
    return {
      type: 'client',
      data: {
        id: person.id,
        userId: user.id,
        nombre: `${person.names} ${person.surNames}`,
        documentType: person.documentType,
        documentId: person.documentId,
        email: person.email,
        role: 'patient'
      },
    };
  }

  // Si llegamos aquí, existe el usuario pero no su perfil operativo
  throw new BusinessLogicError('Usuario autenticado pero sin perfil de paciente/médico asociado');
};

module.exports = {
  loginByIdentifier,
};