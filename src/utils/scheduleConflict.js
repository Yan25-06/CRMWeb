/**
 * Checks for scheduling conflicts (room overlap) between a new/edited item and existing items.
 * @param {Object} newItem - { id?, classId, dayOfWeek, startTime, endTime, room? }
 * @param {Array}  allItems - full list from getSchedule()
 * @param {Array}  classes  - full list from getClasses() for class name lookup
 * @returns {Array} conflict objects: { conflictingItem, conflictingClass, reason }
 */
export const checkConflicts = (newItem, allItems, classes = []) => {
  const conflicts = []
  if (!newItem.room?.trim()) return conflicts // no room = no room conflict

  const timeToMinutes = (t) => {
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const newStart = timeToMinutes(newItem.startTime)
  const newEnd   = timeToMinutes(newItem.endTime)

  for (const item of allItems) {
    // Skip self when editing
    if (item.id && item.id === newItem.id) continue
    // Must be same day + same non-empty room
    if (item.dayOfWeek !== newItem.dayOfWeek) continue
    if (!item.room?.trim() || item.room.trim().toLowerCase() !== newItem.room.trim().toLowerCase()) continue

    const itemStart = timeToMinutes(item.startTime)
    const itemEnd   = timeToMinutes(item.endTime)

    // Overlap: startA < endB && startB < endA
    if (newStart < itemEnd && itemStart < newEnd) {
      const conflictingClass = classes.find(c => c.id === item.classId)
      conflicts.push({
        conflictingItem: item,
        conflictingClass,
        reason: `Phòng "${newItem.room}" đã có lớp "${conflictingClass?.name || item.classId}" từ ${item.startTime}–${item.endTime}`,
      })
    }
  }

  return conflicts
}
