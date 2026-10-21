// ^ adjust this import path to wherever you keep the EmployeeDocument /
// DocumentType / RelatedDocument types (see previous fix).

import type { EmployeeDocument } from "@/pages/Documents/EmployeeDocuments";

export const documents: EmployeeDocument[] = [
  {
    docId: "DOC-PASS-001",
    docName: "Shoeib_Abou_Zied_Mahmoud_Awad_Passport.pdf",
    docType: "Passport",
    employeeName: "Shoeib Abou Zied Mahmoud Awad",
    employeeId: "EMP-67621",
    group: "Administrative / Management",
    passportNumber: "2254394725",
    issueDate: "2026-04-01",
    expiryDate: "2036-04-01",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl: "",
    imgUrl: "",
    cvDoc: {
      docName: "N/A",
      downloadUrl: "N/A",
      imgUrl: "",
    },
    jobOfferDoc: {
      docName: "N/A",
      downloadUrl: "N/A",
      imgUrl: "N/A",
    },
    otherDoc: {
      docName: "N/A",
      downloadUrl: "N/A",
      imgUrl: "N/A",
    },
  },
  {
    docId: "DOC-PASS-002",
    docName: "Abdullah_Aldarweesh_Passport.pdf",
    docType: "Passport",
    employeeName: "Abdullah Aldarweesh",
    employeeId: "EMP-67666",
    group: "Administrative / Management",
    passportNumber: "1068924107",
    issueDate: "2026-04-01",
    expiryDate: "2036-04-01",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    imgUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=60",
    cvDoc: {
      docName: "Abdullah_Aldarweesh_CV.pdf",
      downloadUrl:
        "https://drive.google.com/file/d/1PCYeAD5UYAZdpb2t86tIcLEXB6EstwGp/view?usp=sharing",
      imgUrl:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60",
    },
    jobOfferDoc: {
      docName: "Abdullah_Aldarweesh_Job_Offer.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60",
    },
    otherDoc: {
      docName: "Abdullah_Aldarweesh_Degree.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60",
    },
  }


];
