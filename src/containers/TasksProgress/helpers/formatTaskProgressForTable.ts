import type { FolderType, Status } from '@api/rest/project'
import { GetTasksProgressResult, ProgressTask } from '@queries/tasksProgress/getTasksProgress'

export type TaskTypeRow = {
  name: string
  taskType: string
  tasks: ProgressTask[]
}

export type TaskTypeStatusBar = {
  [status: string]: number
}

// no _ means it's a task type
// _ is for permanent columns
// __ is for metadata fields

export type FolderRow = {
  __isParent: boolean
  __parentId?: string
  __folderKey: string
  _folder: string
  _parents: string[]
  _folderIcon?: string | null
  __folderType?: string
  __folderId: string
  __projectName: string
  _complete?: number
  [taskType: string]: TaskTypeRow | TaskTypeStatusBar | any
  // parent specific fields
  _taskCount?: number
  _folderCount?: number
  _completeFolders?: number[]
}

export const formatTaskProgressForTable = (
  data: GetTasksProgressResult,
  shownColumns: string[] = [],
  collapsedFolders: string[] = [],
  { folderTypes, statuses }: { folderTypes: FolderType[]; statuses: Status[] },
): FolderRow[] => {
  // TODO: try using a map instead of an array to easily lookup parent folders
  const rows = new Map<string, FolderRow>()

  data.forEach((folder) => {
    // add parent folder row

    const parent = folder.parent
    const parentKey = parent ? parent.id : undefined
    // check parent has not been added
    if (parent && parentKey && !rows.has(parentKey)) {
      //
      // add parent folder row
      const parentRow = {
        __isParent: true,
        __folderKey: parent.name,
        __folderId: parent.id,
        _folder: parent.label || parent.name,
        _parents: parent.parents,
        __projectName: folder.projectName,
        _folderCount: 0,
        _taskCount: 0,
        _completeFolders: [],
      }

      rows.set(parentKey, parentRow)
    }

    // add main folder row
    const row: FolderRow = {
      __isParent: false,
      __parentId: parentKey,
      __folderKey: folder.parents[folder.parents.length - 1] + folder.name, // used to sort the folders row
      _folder: folder.label || folder.name,
      _parents: folder.parents,
      _folderIcon: folderTypes.find((ft) => ft.name === folder.folderType)?.icon,
      __folderId: folder.id,
      __folderType: folder.folderType,
      __projectName: folder.projectName,
      _complete: 0,
    }

    // find the percentages of each task
    const taskFraction = 100 / folder.tasks.length

    // groups tasks by type
    folder.tasks
      .filter((t) => t.active)
      .forEach((task) => {
        const taskType = task.taskType

        // do not add if hidden
        if (!!shownColumns.length && !shownColumns.includes(taskType)) return

        if (!row[taskType]) {
          row[taskType] = {
            name: taskType,
            taskType,
            tasks: [],
          }
        }

        if (typeof row[taskType] === 'object' && !Array.isArray(row[taskType])) {
          // update tasks
          row[taskType].tasks.push(task)

          const updateCompleted = () => {
            const status = task.status
            const statusType = statuses.find((s) => s.name === status)
            const statusState = statusType?.state
            const completed = statusState === 'done'
            const toAdd = completed ? taskFraction : 0
            const newDone = (row._complete || 0) + toAdd
            // rounded to 1 decimal
            row._complete = newDone
          }

          updateCompleted()
        }
      })

    // get existing parent folder
    const parentFolder = parent && rows.get(parentKey || '')
    if (parentFolder) {
      const tasks = folder.tasks.filter((t) => t.active)
      // update number of folders and tasks
      parentFolder._folderCount = (parentFolder._folderCount || 0) + 1
      parentFolder._taskCount = (parentFolder._taskCount || 0) + tasks.length
      // add completed to parent folder completedFolders array
      // we do this so that later on we can calculate the actual percentage but we must loop through all folders first
      parentFolder._completeFolders?.push(row._complete || 0)

      // get all statuses for that folders (row) task types
      const taskTypeStatuses = tasks.reduce((acc, curr) => {
        // initialize task type status
        if (!acc[curr.taskType]) {
          acc[curr.taskType] = {
            [curr.status]: 0,
          }
        }

        // update task type status
        acc[curr.taskType][curr.status] = (acc[curr.taskType][curr.status] || 0) + 1

        return acc
      }, {} as { [taskType: string]: TaskTypeStatusBar })

      // update parent folder with statuses
      Object.entries(taskTypeStatuses).forEach(([taskType, status]) => {
        if (!parentFolder[taskType]) {
          parentFolder[taskType] = status
        } else {
          // merge statuses
          Object.entries(status).forEach(([statusName, count]) => {
            parentFolder[taskType][statusName] = (parentFolder[taskType][statusName] || 0) + count
          })
        }
      })
    }

    // add to rows
    rows.set(folder.id, row)
  })

  // loop through all parent folders and calculate the percentage done
  rows.forEach((row) => {
    if (row.__isParent) {
      const completedFolders = row._completeFolders || []
      const average =
        completedFolders.reduce((acc, curr) => acc + curr, 0) / completedFolders.length
      row._complete = average
    }
  })

  const rowsArray = Array.from(rows.values())

  // filter out collapsed folders
  let filteredRows = rowsArray
  if (collapsedFolders.length) {
    filteredRows = rowsArray.filter((row) => {
      const parent = row.__parentId
      return !collapsedFolders.includes(parent || '')
    })
  }

  return filteredRows
}