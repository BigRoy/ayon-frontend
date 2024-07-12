export type Summary = {
  activityId?: string
  sourceFileId?: string
  targetFileId?: string
  versionId?: string
}

import { ReviewableModel, ReviewableProcessingStatus, VersionReviewablesModel } from '@/api/rest'

// UPDATE GetReviewablesForVersionApiResponse to include the new processing type
// Define a type alias for Processing to extend it correctly
interface Processing extends ReviewableProcessingStatus {
  progress?: number
}

// Extend UpdatedReviewable with the new Processing type
export interface ReviewableResponse extends Omit<ReviewableModel, 'processing'> {
  processing: Processing // Use the new Processing type here
}

// Extend the main response interface
export interface GetReviewablesResponse extends Omit<VersionReviewablesModel, 'reviewables'> {
  reviewables?: ReviewableResponse[] // Use the updated reviewable type
}

type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> & U[keyof U]

export type GetViewerReviewablesParams = AtLeastOne<{
  productId: string
  taskId: string
  folderId: string
}> & {
  projectName: string
}
