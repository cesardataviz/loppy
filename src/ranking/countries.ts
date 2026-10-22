// País para el ranking: se adivina por la zona horaria del teléfono (sin pedir permisos)
// y la persona lo puede cambiar en su Perfil.

const CODES =
  'AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ ' +
  'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM ' +
  'FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM ' +
  'JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO ' +
  'MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT ' +
  'PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM ' +
  'TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'

// Zonas horarias más comunes entre quienes usan Loppy (Latinoamérica, España, EE. UU.…).
const TZ: Record<string, string> = {
  'America/Lima': 'PE', 'America/Bogota': 'CO', 'America/Guayaquil': 'EC', 'Pacific/Galapagos': 'EC',
  'America/Caracas': 'VE', 'America/La_Paz': 'BO', 'America/Santiago': 'CL', 'America/Punta_Arenas': 'CL',
  'Pacific/Easter': 'CL', 'America/Asuncion': 'PY', 'America/Montevideo': 'UY', 'America/Buenos_Aires': 'AR',
  'America/Cordoba': 'AR', 'America/Mendoza': 'AR', 'America/Mexico_City': 'MX', 'America/Cancun': 'MX',
  'America/Monterrey': 'MX', 'America/Merida': 'MX', 'America/Matamoros': 'MX', 'America/Chihuahua': 'MX',
  'America/Ciudad_Juarez': 'MX', 'America/Mazatlan': 'MX', 'America/Bahia_Banderas': 'MX',
  'America/Hermosillo': 'MX', 'America/Tijuana': 'MX', 'America/Guatemala': 'GT', 'America/El_Salvador': 'SV',
  'America/Tegucigalpa': 'HN', 'America/Managua': 'NI', 'America/Costa_Rica': 'CR', 'America/Panama': 'PA',
  'America/Havana': 'CU', 'America/Santo_Domingo': 'DO', 'America/Puerto_Rico': 'PR', 'Europe/Madrid': 'ES',
  'Atlantic/Canary': 'ES', 'Africa/Ceuta': 'ES', 'Africa/Malabo': 'GQ', 'America/Sao_Paulo': 'BR',
  'America/Manaus': 'BR', 'America/Fortaleza': 'BR', 'America/Recife': 'BR', 'America/Bahia': 'BR',
  'America/Belem': 'BR', 'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
  'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US', 'Pacific/Honolulu': 'US',
  'America/Detroit': 'US', 'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA', 'America/Halifax': 'CA', 'Europe/London': 'GB', 'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE', 'Europe/Rome': 'IT', 'Europe/Lisbon': 'PT', 'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Dublin': 'IE',
}

export function isCountry(code: string): boolean {
  return /^[A-Z]{2}$/.test(code) && CODES.includes(code)
}

/** Adivina el país: primero la zona horaria, luego la región del idioma (es-PE → PE). '' si no se sabe. */
export function detectCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
    if (TZ[tz]) return TZ[tz]
    if (tz.startsWith('America/Argentina/')) return 'AR'
    if (tz.startsWith('America/Indiana/') || tz.startsWith('America/Kentucky/')) return 'US'
  } catch {
    /* navegador sin Intl: se prueba con el idioma */
  }
  for (const lang of navigator.languages ?? [navigator.language]) {
    const region = lang.split('-')[1]?.toUpperCase() ?? ''
    if (isCountry(region)) return region
  }
  return ''
}

/** 'PE' → 🇵🇪 */
export function flag(code: string): string {
  if (!isCountry(code)) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

let names: Intl.DisplayNames | null = null

export function countryName(code: string): string {
  try {
    names ??= new Intl.DisplayNames(['es'], { type: 'region' })
    return names.of(code) ?? code
  } catch {
    return code
  }
}

/** Todos los países, ordenados por su nombre en español. */
export function allCountries(): { code: string; name: string }[] {
  return CODES.split(' ')
    .map((code) => ({ code, name: countryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}
