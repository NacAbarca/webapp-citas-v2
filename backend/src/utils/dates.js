export function parseDMY(str) {
  if (!str) return null
  // Acepta DD-MM-YYYY o ISO string
  if (str.includes('T')) {
    // ISO → YYYY-MM-DD
    return str.split('T')[0]
  }
  if (str.includes('-') && str.length === 10) {
    const parts = str.split('-')
    if (parts[0].length === 2) {
      // DD-MM-YYYY → YYYY-MM-DD
      return `${parts[2]}-${parts[1]}-${parts[0]}`
    }
    // Ya es YYYY-MM-DD
    return str
  }
  return str
}

export function parseTime(str) {
  if (!str) return null
  // Acepta HH:MM o HH:MM:SS
  return str.substring(0, 5)
}
