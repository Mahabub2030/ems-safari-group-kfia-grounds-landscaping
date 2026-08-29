export interface RelatedDocument {
  docName: string;
  downloadUrl: string;
  imgUrl?: string;
  fileSize?: string;
  fileFormat?: string;
}

export type DocumentType = "invoice" | "receipt" | "contract";
export interface EmployeeDocument {
  srNo: number;
  docId: string;
  docName: string;
  docType: DocumentType;
  employeeName: string;
  employeeId: string;
  group?: string;
  iqamaNumber?: string;
  passportNumber?: string;
  issueDate: string;
  expiryDate?: string;
  fileSize: string;
  fileFormat: string;
  downloadUrl: string;
  imgUrl?: string;
  cvDoc?: RelatedDocument;
  jobOfferDoc?: RelatedDocument;
  otherDoc?: RelatedDocument;
}
