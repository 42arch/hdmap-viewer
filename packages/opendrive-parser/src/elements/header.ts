import type { RawHeader } from "../types/raw"

export default class Header {
  public revMajor?: string
  public revMinor?: string
  public name?: string
  public version?: string
  public date?: string
  public north?: number
  public south?: number
  public east?: number
  public west?: number
  public vendor?: string
  public geoReference?: string

  constructor(rawHeader: RawHeader) {
    this.revMajor = rawHeader.revMajor
    this.revMinor = rawHeader.revMinor
    this.name = rawHeader.name
    this.version = rawHeader.version
    this.date = rawHeader.date
    this.north = Number(rawHeader.north)
    this.south = Number(rawHeader.south)
    this.east = Number(rawHeader.east)
    this.west = Number(rawHeader.west)
    this.vendor = rawHeader.vendor

    this.geoReference = rawHeader.geoReference
  }
}