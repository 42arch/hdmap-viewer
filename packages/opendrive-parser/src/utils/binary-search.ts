export default function binarySearch(arr: number[], target: number): number {
  let low = 0
  let high = arr.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (arr[mid] <= target) {
      low = mid + 1
    }
    else {
      high = mid - 1
    }
  }

  // 返回使 arr[idx] <= target 的最大 idx
  return Math.max(0, high)
}
