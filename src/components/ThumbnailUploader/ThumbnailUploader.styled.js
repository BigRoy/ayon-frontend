import { Button } from '@ynput/ayon-react-components'
import styled, { keyframes } from 'styled-components'

export const ThumbnailUploaderWrapper = styled.div`
  position: absolute;
  inset: 0;
  z-index: 900;

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  .bg {
    position: absolute;
    inset: 0;
    border-radius: var(--md-sys-border-radius-m);
    opacity: 0;
    border: 2px dashed var(--md-sys-color-outline);
    background-color: var(--md-sys-color-surface-container-lowest);
  }

  .icon.upload {
    user-select: none;
    pointer-events: none;
    opacity: 0;
    background-color: unset;
    scale: 0;

    transition: scale 0.2s, opacity 0.1s;
  }

  &:not(.isPortal) {
    &:hover {
      .icon.upload {
        scale: 1;
        opacity: 0;
      }
      .bg {
        opacity: ${({ $existingImage }) => ($existingImage ? 0.95 : 1)};
      }
    }
  }

  &.isPortal {
    .icon.upload {
      scale: 1;
      opacity: 1;
      font-size: 4rem;
    }
    .bg {
      opacity: ${({ $existingImage }) => ($existingImage ? 0.95 : 1)};
    }
  }

  &.isDragging {
    .icon.upload {
      scale: 1;
    }
  }

  &.isUploading {
    .bg {
      opacity: 1;
    }
    .icon.upload {
      display: none;
    }
  }

  &.isSuccess {
    .bg {
      opacity: 0;
    }
    .icon.upload {
      display: none;
    }
    &:hover {
      opacity: 0;
    }
  }

  &.isButton {
    align-items: flex-start;
    justify-content: flex-end;

    &:hover {
      .upload-button {
        opacity: 1;
      }
    }
  }
`

export const ThumbnailInput = styled.input`
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
`

export const UploadButton = styled(Button)`
  position: relative;
  height: 32px;
  width: 32px;
  margin-right: 4px;
  margin-top: 4px;
  overflow: hidden;

  opacity: 0;

  .edit {
    font-size: 1.4285rem;
    background-color: unset;
    cursor: pointer;
  }
`

export const ButtonInput = styled.input`
  position: absolute;
  inset: -40px;
  opacity: 0;
  cursor: pointer;
`

const FinishAnimation = keyframes`
    0% {
        scale: 0.8;
    }
    100% {
        scale: 1;
    }
`

export const ThumbnailUploading = styled.div`
  position: absolute;
  inset: 0;

  &.isSuccess {
    .preview {
      scale: 1;
      opacity: 1;
      animation: ${FinishAnimation} 0.2s ease forwards;
    }

    .progress {
      opacity: 0;
    }
  }
`

const PopInAnimation = keyframes`
    0% {
        scale: 0.45;
    }
    100% {
        scale: 0.7;
    }
    
`

export const UploadPreview = styled.img`
  position: absolute;
  inset: 0;
  border-radius: var(--border-radius-m);
  width: 100%;
  height: 100%;
  object-fit: contain;
  overflow: hidden;

  transform-origin: center;
  animation: ${PopInAnimation} 0.2s ease forwards;
  background-color: var(--md-sys-color-surface-container-lowest);
`

export const UploadError = styled.div`
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  border-radius: var(--border-radius-m);
  text-align: center;
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
`

export const UploadProgress = styled.div`
  position: absolute;
  bottom: 8px;
  left: 40px;
  right: 40px;
  height: 8px;
  border-radius: var(--border-radius-m);
  background-color: var(--md-sys-color-surface-container-high);

  /* after is the progress */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    border-radius: var(--border-radius-m);
    background-color: var(--md-sys-color-primary);
    transform: scaleX(${({ $progress }) => $progress});
    transform-origin: left;
    transition: transform 0.1s ease, opacity 0.1s ease;
  }
`

export const Close = styled(Button)`
  position: absolute;
  right: 4px;
  top: 4px;

  .icon {
    display: block;
    font-size: 1.4285rem;
    position: relative;
    background-color: unset;
  }
`
