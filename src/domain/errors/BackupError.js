/** El archivo elegido no es una copia de seguridad de Pato utilizable. */
export class InvalidBackupError extends Error {
  constructor(reason) {
    super(reason)
    this.name = 'InvalidBackupError'
  }
}
