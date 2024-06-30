import { useSelector } from 'react-redux'
import { InputSwitch, FormLayout, FormRow, Icon } from '@ynput/ayon-react-components'
import { SelectButton } from 'primereact/selectbutton'
import AccessGroupsDropdown from '@containers/AccessGroupsDropdown'
import { isEqual } from 'lodash'
import styled from 'styled-components'

const FormRowStyled = styled(FormRow)`
  .label {
    min-width: 160px;
  }
`

const NoteStyled = styled.span`
  margin: var(--padding-m) 0;
  padding: var(--padding-m);
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-secondary-container);

  gap: var(--base-gap-small);
  display: flex;
  align-items: center;
`

const UserAccessForm = ({ accessGroupsData, formData, onChange, disabled, selectedProjects }) => {
  const isUserAdmin = useSelector((state) => state.user.data.isAdmin)

  const userLevels = [
    { label: 'User', value: 'user' },
    { label: 'Manager', value: 'manager' },
  ]

  // only admins can
  if (isUserAdmin) {
    userLevels.push({ label: 'Admin', value: 'admin' })
    userLevels.push({ label: 'Service', value: 'service' })
  }

  const activeOptions = [
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ]

  const updateFormData = (key, value) => {
    onChange && onChange(key, value)
  }

  const isUser = formData?.userLevel === 'user'
  const isAdmin = formData?.userLevel === 'admin'

  const defaultAccessGroups = formData?.defaultAccessGroups

  // {user1: {project1: [accessGroup1, accessGroup2], project2: [accessGroup1, accessGroup2]}}
  const usersAccessGroups = formData?.accessGroups

  // merge accessGroups into one array based on the selectedProjects, check if there are mixed fields (one AG on one project, another AG on another project)
  const mergedAccessGroups = []
  // check if the AGs are the same for all projects on all users
  let allTheSame = true
  if (usersAccessGroups) {
    Object.values(usersAccessGroups).forEach((accessGroups, i) => {
      const projectAccessGroupsForUser = []

      selectedProjects?.forEach((projectName, i) => {
        const projectAccessGroups = accessGroups[projectName]

        // check if there is difference in AG between projects
        const allProjectsSame = i == 0 || isEqual(projectAccessGroupsForUser, projectAccessGroups)

        // set the allTheSame to false
        if (!allProjectsSame) allTheSame = false
        // we need to add any missing access groups to the projectAccessGroupsForUser
        projectAccessGroups?.forEach((accessGroup) => {
          if (!projectAccessGroupsForUser.includes(accessGroup)) {
            projectAccessGroupsForUser.push(accessGroup)
          }
        })
      })

      const allUsersSame = i === 0 || isEqual(mergedAccessGroups, projectAccessGroupsForUser)

      if (!allUsersSame) allTheSame = false

      // now merge the user's access groups into the mergedAccessGroups
      projectAccessGroupsForUser.forEach((accessGroup) => {
        if (!mergedAccessGroups.includes(accessGroup)) {
          mergedAccessGroups.push(accessGroup)
        }
      })
    })
  }

  const handleDefaultAccessGroupsChange = (value) => {
    updateFormData('defaultAccessGroups', value)
  }

  const handleProjectAccessGroupsChange = (value) => {
    const newUsersAccessGroups = { ...usersAccessGroups }

    Object.entries(usersAccessGroups).forEach(([userName, projects]) => {
      const newProjects = { ...projects }
      selectedProjects.forEach((projectName) => {
        // update the access groups for the selected projects
        newProjects[projectName] = value
      })
      // update the user's access groups by selected project
      newUsersAccessGroups[userName] = newProjects
    })

    updateFormData('accessGroups', newUsersAccessGroups)
  }

  return (
    <>
      <b>Access Control</b>
      <FormLayout>
        <FormRowStyled label="User active">
          <SelectButton
            unselectable={false}
            value={formData?.userActive}
            onChange={(e) => updateFormData('userActive', e.value)}
            options={activeOptions}
          />
        </FormRowStyled>

        <FormRowStyled label="Guest">
          <div
            data-tooltip={isAdmin ? 'Admins cannot be guests' : undefined}
            data-tooltip-delay={0}
            style={{ width: 'fit-content' }}
          >
            <InputSwitch
              checked={disabled || isAdmin ? false : formData?.isGuest}
              onChange={(e) => updateFormData('isGuest', e.target.checked)}
              disabled={disabled || isAdmin}
              style={{
                opacity: disabled ? 0.5 : 1,
              }}
            />
          </div>
        </FormRowStyled>

        <FormRowStyled label="Developer">
          <div
            data-tooltip={
              isUser
                ? 'Users cannot be developers'
                : 'Developers have access to enhanced tools and features.'
            }
            data-tooltip-delay={0}
            style={{ width: 'fit-content' }}
          >
            <InputSwitch
              checked={formData?.isDeveloper}
              onChange={(e) => updateFormData('isDeveloper', e.target.checked)}
              disabled={isUser}
              style={{
                opacity: disabled ? 0.5 : 1,
              }}
            />
          </div>
        </FormRowStyled>

        <FormRowStyled label="Access level">
          <SelectButton
            unselectable={false}
            value={formData?.userLevel}
            onChange={(e) => updateFormData('userLevel', e.value)}
            options={userLevels}
            disabled={disabled}
          />
        </FormRowStyled>

        {isUser ? (
          <FormRowStyled
            label={'New projects access'}
            data-tooltip={
              'When a new project is created, the user will be added to these access groups by default.'
            }
          >
            <AccessGroupsDropdown
              style={{ flexGrow: 1 }}
              selectedAccessGroups={defaultAccessGroups}
              setSelectedAccessGroups={handleDefaultAccessGroupsChange}
              placeholder={'Add access groups...'}
              isMultiple={formData._mixedFields?.includes('defaultAccessGroups')}
              accessGroups={accessGroupsData}
            />
          </FormRowStyled>
        ) : (
          <NoteStyled>
            <Icon icon="info" />
            Admins, managers and services have full access to all projects.
          </NoteStyled>
        )}
        {isUser && selectedProjects && (
          <FormRowStyled label={'Selected projects access'}>
            <AccessGroupsDropdown
              style={{ flexGrow: 1 }}
              selectedAccessGroups={mergedAccessGroups}
              setSelectedAccessGroups={handleProjectAccessGroupsChange}
              placeholder={'Add access groups...'}
              isMultiple={!allTheSame}
              accessGroups={accessGroupsData}
            />
          </FormRowStyled>
        )}
      </FormLayout>
    </>
  )
}

export default UserAccessForm
