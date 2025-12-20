import proj4 from 'proj4'

proj4.defs('EPSG:4326', '+proj=longlat +datum=WGS84 +no_defs')

export function isValid(geoReference: string) {
  try {
    proj4(geoReference)
    return true
  }
  catch {
    return false
  }
}

export function xyToLngLat(xy: { x: number, y: number }, geoReference: string) {
  const sourceProj = geoReference
  const targetProj = 'EPSG:4326'

  const lnglat = proj4(sourceProj, targetProj, [xy.x, xy.y])
  return { lng: lnglat[0], lat: lnglat[1] }
}
