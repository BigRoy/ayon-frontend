import React, { useEffect, useState } from 'react'
import { useGetProjectQuery } from '/src/services/project/getProject'
import DashboardPanelWrapper from '../DashboardPanelWrapper'
import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { format } from 'date-fns'
import { Button, SaveButton, Toolbar } from '@ynput/ayon-react-components'
import * as Styled from './ProjectDetails.styled'
import AttribForm from '/src/components/AttribForm/AttribForm'
import { useGetAnatomySchemaQuery } from '/src/services/anatomy/getAnatomy'
import { isEmpty, isEqual } from 'lodash'
import { useSelector } from 'react-redux'
import { useUpdateProjectMutation } from '/src/services/project/updateProject'
import { toast } from 'react-toastify'

const ProjectDetails = ({ projectName }) => {
  const isUser = useSelector((state) => state.user.data.isUser)

  // GET DATA
  const { data = {}, isFetching, isError } = useGetProjectQuery({ projectName })
  const { data: schema } = useGetAnatomySchemaQuery()
  const fields = schema?.definitions?.ProjectAttribModel?.properties

  // UPDATE DATA
  const [updateProject, { isLoading: isUpdating }] = useUpdateProjectMutation()

  const [editing, setEditing] = useState(false)

  const projectFormInit = {
    active: false,
    code: '',
    attrib: {},
  }

  // This is the start, used to compare changes
  const [initData, setInitData] = useState(projectFormInit)
  // form for project data
  const [projectForm, setProjectForm] = useState(projectFormInit)

  // when data has been loading, update the form
  useEffect(() => {
    if (!isFetching && !isEmpty(data)) {
      // update project form with only the fields we need from the projectForm init state
      const updatedProjectForm = { ...projectFormInit }
      for (const key in projectFormInit) {
        updatedProjectForm[key] = data[key]
      }
      setProjectForm(updatedProjectForm)
      setInitData(updatedProjectForm)
    }
  }, [data, isFetching])

  const { attrib = {}, active, code } = data

  const attribArray = []
  for (const key in fields) {
    let field = fields[key]
    let value = attrib[key]

    // if key has "Date" in it, convert to date
    if (field?.format === 'date-time' && value) {
      value = format(new Date(value), 'dd/MM/yyyy')
    }

    attribArray.push({
      name: field.title,
      value,
    })
  }

  attribArray.unshift({
    value: (
      <Styled.Active $isLoading={isFetching} $isActive={active}>
        {active ? 'active' : ' inactive'}
      </Styled.Active>
    ),
    name: 'Status',
  })

  const handleProjectChange = (field, value) => {
    const newProjectForm = { ...projectForm, attrib: { ...projectForm.attrib } }

    // check if field has any '.' in it
    const fieldSplit = field.split('.')
    if (fieldSplit.length > 1) {
      // update nested field
      const [key, subKey] = fieldSplit
      newProjectForm[key][subKey] = value
    } else {
      // update normal field
      newProjectForm[field] = value
    }

    setProjectForm(newProjectForm)
  }

  const handleAttribSubmit = async () => {
    try {
      const data = { ...projectForm }
      // validate dates inside attrib
      const attrib = { ...projectForm['attrib'] }
      for (const key in attrib) {
        const field = fields[key]
        let value = attrib[key]
        if (field?.format === 'date-time') {
          if (value) {
            value = new Date(value).toISOString() ?? null
          } else {
            value = null
          }
        }

        attrib[key] = value
      }

      await updateProject({ projectName, update: { ...data, attrib } }).unwrap()

      setEditing(false)
      toast.success('Project updated')
    } catch (error) {
      console.error(error)
      const message = error?.data?.detail
      toast.error('Failed to update project: ' + message)
    }
  }

  const hasChanges = !isEqual(initData, projectForm)

  return (
    <DashboardPanelWrapper
      title={
        !isFetching && (
          <Toolbar style={{ gap: 8 }}>
            <h1>{projectName}</h1>
            <Styled.Code>{code}</Styled.Code>
          </Toolbar>
        )
      }
      header={
        !isUser && (
          <Styled.Header>
            {!editing ? (
              <Button
                label="Edit"
                icon="edit"
                onClick={() => setEditing(true)}
                disabled={isFetching || isError}
              />
            ) : (
              <>
                <Button
                  label="Cancel"
                  icon="close"
                  onClick={() => setEditing(false)}
                  className="cancel"
                />
                <SaveButton
                  label="Save"
                  active={hasChanges}
                  saving={isUpdating}
                  onClick={handleAttribSubmit}
                />
              </>
            )}
          </Styled.Header>
        )
      }
      stylePanel={{ height: 'calc(100% - 8px)', flex: 1, overflow: 'hidden' }}
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <Styled.Thumbnail>
        <Thumbnail projectName={projectName} isLoading={isFetching} shimmer />
      </Styled.Thumbnail>
      {editing ? (
        <AttribForm
          form={projectForm}
          onChange={(field, value) => handleProjectChange(field, value)}
          fields={fields}
          isLoading={isFetching}
        />
      ) : (
        <AttributeTable
          projectAttrib={attribArray}
          style={{
            overflow: 'auto',
          }}
          isLoading={isFetching}
        />
      )}
    </DashboardPanelWrapper>
  )
}

export default ProjectDetails
