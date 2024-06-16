import { useManageInboxItemMutation } from '../../../services/inbox/updateInbox'
import { ManageInboxItemRequest } from '../../../types/restTypes'

type Config = {
  last: number
  isActive: boolean
  isImportant: boolean
}

const useUpdateInboxMessage = ({ last, isActive, isImportant }: Config) => {
  // update inbox message
  const [updateMessages] = useManageInboxItemMutation()

  const handleUpdateMessages = async (
    ids: NonNullable<ManageInboxItemRequest['ids']>,
    status: ManageInboxItemRequest['status'],
    projectName: ManageInboxItemRequest['projectName'],
    isActiveChange = false,
    isRead = false,
  ) => {
    if (ids.length > 0) {
      // cacheKeyArgs are not used in the patch but are used to match the cache key to a query (for optimistic updates)
      const cacheKeyArgs = {
        last,
        active: isActive,
        important: isImportant,
        isActiveChange,
        isRead,
      }
      // update the messages in the backend to toggle read status
      // we use optimistic updates inside updateMessages query
      try {
        await updateMessages({
          manageInboxItemRequest: { status: status, projectName: projectName, ids: ids },
          ...cacheKeyArgs,
        }).unwrap()
      } catch (error) {
        // console.error(error)
      }
    }
  }

  return handleUpdateMessages
}

export default useUpdateInboxMessage
