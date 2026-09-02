import 'fake-indexeddb/auto'

// jsdom valida createObjectURL contra su propio Blob, y fake-indexeddb devuelve
// el Blob del clon estructurado. En navegador real no hay conflicto; aquí se
// sustituye por un stub porque jsdom tampoco resuelve object URLs de verdad.
let objectUrlCounter = 0
URL.createObjectURL = () => `blob:pato/${(objectUrlCounter += 1)}`
URL.revokeObjectURL = () => {}
