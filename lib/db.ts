// Re-export only the necessary Firebase database utilities
export { 
  getTenantDocuments, 
  getAllDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument, 
  getDocument,
  createBatch,
  commitBatch,
  addToBatch,
  updateInBatch,
  deleteInBatch,
  COLLECTIONS
} from './firebase/db';