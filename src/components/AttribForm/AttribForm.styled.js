import styled from 'styled-components'

export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  overflow: auto;
  padding: 1px;
`

export const Row = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  position: relative;
  padding: 1px;

  align-items: center;
  justify-content: space-between;

  input,
  .dropdown button {
    min-width: 170px;
    max-width: 170px;
  }
`

export const Field = styled.div`
  overflow: hidden;
  max-width: 200px;
  padding: 1px;
  margin: -1px;
`
