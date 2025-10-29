/**
 * 数组化
 * @param obj
 * @returns obj[]
 */
function arrayize<T>(obj?: T | T[]): T[] {
  if (!obj)
    return []
  return Array.isArray(obj) ? obj : [obj]
}

export default arrayize