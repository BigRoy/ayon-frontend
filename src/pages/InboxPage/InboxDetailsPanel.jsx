// mainly just a wrapper for data fetching

import { useMemo } from 'react'
import DetailsPanel from '@containers/DetailsPanel/DetailsPanel'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import DetailsPanelSlideOut from '@containers/DetailsPanel/DetailsPanelSlideOut/DetailsPanelSlideOut'

const InboxDetailsPanel = ({ messages = [], selected = [], projectsInfo = {} }) => {
  const selectedMessage = useMemo(() => {
    return messages.find((m) => m.activityId === selected[0]) || {}
  }, [messages, selected])

  const { projectName, entityType, entityId } = selectedMessage

  const { data: users = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })

  const projectInfo = projectsInfo[projectName] || {}

  if (!selected.length) return null

  return (
    <div className="inbox-details-panel">
      <DetailsPanel
        entities={[{ id: entityId, projectName, entityType: entityType }]}
        statusesOptions={projectInfo.statuses || []}
        tagsOptions={projectInfo.tags || []}
        projectUsers={users}
        activeProjectUsers={users}
        disabledProjectUsers={[]}
        projectsInfo={projectsInfo}
        projectNames={[projectName]}
        entityType={entityType}
        scope="inbox"
        style={{ boxShadow: 'none', borderRadius: 4, overflow: 'hidden' }}
      />
      <DetailsPanelSlideOut projectsInfo={projectsInfo} scope="inbox" />
    </div>
  )
}

export default InboxDetailsPanel
