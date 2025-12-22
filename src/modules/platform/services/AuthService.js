const professionalRepository = require('../../operative/repositories/ProfessionalRepository');
const peopleRepository = require('../../operative/repositories/PeopleRepository');
const { NotFoundError } = require('../../../shared/errors/CustomErrors');

/**
 * Busca un usuario por professionalRegister (odontólogos) o por documentType + documentId (pacientes)
 * @param {string} documentType - Tipo de documento (para pacientes) o null (para odontólogos)
 * @param {string} identifier - professionalRegister (para odontólogos) o documentId (para pacientes)
 * @returns {Promise<{type: 'admin'|'client', data: object}>}
 */
const loginByIdentifier = async (documentType, identifier) => {
  const identifierStr = String(identifier).trim().toUpperCase();
  
  // Si no hay documentType, es un odontólogo buscando por professionalRegister
  if (!documentType || documentType === '') {
    const professional = await professionalRepository.findByProfessionalRegister(identifierStr);
    
    if (professional && professional.status) {
      return {
        type: 'admin',
        data: {
          id: professional.id,
          userId: professional.userId,
          nombre: `${professional.names} ${professional.surNames}`,
          email: professional.email,
          professionalRegister: professional.professionalRegister,
          specialty: professional.specialty,
        },
      };
    }
    
    throw new NotFoundError('Odontólogo no encontrado con el registro profesional proporcionado');
  }

  // Si hay documentType, es un paciente buscando por documentType + documentId
  // Normalizar el tipo de documento
  const normalizedDocType = documentType.toLowerCase();
  const validDocTypes = ['cedula', 'rif', 'pasaporte', 'extranjero', 'otro'];
  
  if (!validDocTypes.includes(normalizedDocType)) {
    throw new NotFoundError('Tipo de documento inválido');
  }

  const person = await peopleRepository.findByDocument(normalizedDocType, identifierStr);
  
  if (person && person.status) {
    return {
      type: 'client',
      data: {
        id: person.id,
        nombre: `${person.names} ${person.surNames}`,
        documentType: person.documentType,
        documentId: person.documentId,
        email: person.email,
        phone: person.phone,
      },
    };
  }

  throw new NotFoundError('Paciente no encontrado con el documento proporcionado');
};

module.exports = {
  loginByIdentifier,
};
