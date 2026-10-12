/**
 * 比较函数定义
 * 返回值规则：
 * - < 0: a 排在 b 前面（升序）
 * - > 0: a 排在 b 后面
 * - 0: a 和 b 相对位置不变
 */
export type CompareFn<T> = (a: T, b: T) => number;

/**
 * 默认比较器（适用于 number, string 等原生支持大小比较的基本类型）
 */
function defaultCompare<T>(a: T, b: T): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * 原地冒泡排序（In-place Bubble Sort）
 *
 * 核心优化：
 * 1. 边界收缩（lastSwappedIndex）：记录每轮遍历最后一次发生交换的位置。
 *    该位置之后的元素在当前轮次已确认处于最终有序位置，下一轮只需扫描到该位置，大幅减少不必要的比较。
 * 2. 提前退出（Early Exit）：当某一轮未发生任何交换时（lastSwappedIndex === -1），
 *    说明剩余数组已完全有序，立即退出。
 *
 * 复杂度分析：
 * - 时间复杂度：
 *   - 最佳情况：O(n) （数组已完全有序，一轮遍历后立即退出）
 *   - 最坏情况：O(n^2) （数组完全逆序）
 *   - 平均情况：O(n^2)
 * - 空间复杂度：O(1) （原地修改数组，无额外堆内存分配）
 * - 稳定性：稳定排序（当元素相等时不进行交换，保留原有相对次序）
 *
 * @param arr 待排序的原数组（会被原地修改）
 * @param compareFn 自定义比较函数（默认升序）
 * @returns 原数组引用
 *
 * @example
 * ```ts
 * const numbers = [5, 2, 9, 1, 5, 6];
 * bubbleSort(numbers);
 * console.log(numbers); // [1, 2, 5, 5, 6, 9]
 * ```
 */
export function bubbleSort<T>(
  arr: T[],
  compareFn: CompareFn<T> = defaultCompare,
): T[] {
  const n = arr.length;
  if (n <= 1) return arr;

  let rightBound = n - 1;

  while (rightBound > 0) {
    let lastSwappedIndex = -1;

    for (let j = 0; j < rightBound; j++) {
      const current = arr[j]!;
      const next = arr[j + 1]!;

      if (compareFn(current, next) > 0) {
        // 交换相邻逆序元素
        arr[j] = next;
        arr[j + 1] = current;

        lastSwappedIndex = j;
      }
    }

    // 如果整轮遍历未发生任何交换，说明剩余部分已有序，提前结束
    if (lastSwappedIndex === -1) {
      break;
    }

    // 下一轮只需遍历到最后一次发生交换的位置
    rightBound = lastSwappedIndex;
  }

  return arr;
}

/**
 * 纯函数版本冒泡排序（不修改原数组，返回浅拷贝排序后的新数组）
 *
 * @param arr 待排序的只读数组
 * @param compareFn 自定义比较函数（默认升序）
 * @returns 排序后的新数组
 *
 * @example
 * ```ts
 * const original = [3, 1, 2];
 * const sorted = bubbleSortImmutable(original);
 * console.log(original); // [3, 1, 2]
 * console.log(sorted);   // [1, 2, 3]
 * ```
 */
export function bubbleSortImmutable<T>(
  arr: readonly T[],
  compareFn?: CompareFn<T>,
): T[] {
  return bubbleSort([...arr], compareFn);
}
