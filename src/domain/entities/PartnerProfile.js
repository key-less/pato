/**
 * Perfil de una persona de la pareja (datos básicos y gustos).
 * Hay dos perfiles: índice 0 = uno, índice 1 = el otro.
 */
export function createPartnerProfile({
  id,
  nombre = '',
  apellido = '',
  fechaNacimiento = '',
  colorFavorito = '',
  comidaFavorita = '',
  loQueMasLeEncantaDelOtro = '',
  lugarFavorito = '',
  deporteFavorito = '',
  queLosHaceUnicos = '',
  profilePhotoUrl = '',
}) {
  return {
    id: id ?? `profile-${Date.now()}`,
    nombre,
    apellido,
    fechaNacimiento,
    colorFavorito,
    comidaFavorita,
    loQueMasLeEncantaDelOtro,
    lugarFavorito,
    deporteFavorito,
    queLosHaceUnicos,
    profilePhotoUrl,
  }
}
