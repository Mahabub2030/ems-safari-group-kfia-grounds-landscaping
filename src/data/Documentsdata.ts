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
  },
  {
    docId: "DOC-PASS-003",
    docName: "Reda_Abdelmaged_Passport.pdf",
    docType: "Passport",
    employeeName: "Reda Abdelmaged",
    employeeId: "EMP-67574",
    group: "Administrative / Management",
    passportNumber: "2503732816",
    issueDate: "2026-04-01",
    expiryDate: "2036-04-01",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    imgUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=60",
    cvDoc: {
      docName: "Reda_Abdelmaged_CV.pdf",
      downloadUrl:
        "https://drive.google.com/file/d/1PCYeAD5UYAZdpb2t86tIcLEXB6EstwGp/view?usp=sharing",
      imgUrl:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60",
    },
    jobOfferDoc: {
      docName: "Reda_Abdelmaged_Job_Offer.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60",
    },
    otherDoc: {
      docName: "Reda_Abdelmaged_Degree.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60",
    },
  },
  {
    docId: "DOC-PASS-004",
    docName: "Mohamed_Elsayed_Passport.pdf",
    docType: "Passport",
    employeeName: "Mohamed Elsayed",
    employeeId: "EMP-67608",
    group: "Administrative / Management",
    passportNumber: "2485302786",
    issueDate: "2026-04-01",
    expiryDate: "2036-04-01",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    imgUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=60",
    cvDoc: {
      docName: "Mohamed_Elsayed_CV.pdf",
      downloadUrl:
        "https://drive.google.com/file/d/1PCYeAD5UYAZdpb2t86tIcLEXB6EstwGp/view?usp=sharing",
      imgUrl:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60",
    },
    jobOfferDoc: {
      docName: "Mohamed_Elsayed_Job_Offer.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60",
    },
    otherDoc: {
      docName: "Mohamed_Elsayed_Degree.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60",
    },
  },
  {
    docId: "DOC-PASS-005",
    docName: "Afrazier_Nassal_Passport.pdf",
    docType: "Passport",
    employeeName: "Afrazier Nassal",
    employeeId: "EMP-68168",
    group: "Administrative / Management",
    passportNumber: "2483842916",
    issueDate: "2000-01-07",
    expiryDate: "2010-01-07",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    imgUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=60",
    cvDoc: {
      docName: "Afrazier_Nassal_CV.pdf",
      downloadUrl:
        "https://drive.google.com/file/d/1PCYeAD5UYAZdpb2t86tIcLEXB6EstwGp/view?usp=sharing",
      imgUrl:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60",
    },
    jobOfferDoc: {
      docName: "Afrazier_Nassal_Job_Offer.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60",
    },
    otherDoc: {
      docName: "Afrazier_Nassal_Degree.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60",
    },
  },
  {
    docId: "DOC-PASS-006",
    docName: "Alex_Garcia_Garcia_Passport.pdf",
    docType: "Passport",
    employeeName: "Alex Garcia Garcia",
    employeeId: "EMP-67620",
    group: "Administrative / Management",
    passportNumber: "2489688859",
    issueDate: "2026-04-01",
    expiryDate: "2036-04-01",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    imgUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=60",
    cvDoc: {
      docName: "Alex_Garcia_Garcia_CV.pdf",
      downloadUrl:
        "https://drive.google.com/file/d/1PCYeAD5UYAZdpb2t86tIcLEXB6EstwGp/view?usp=sharing",
      imgUrl:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60",
    },
    jobOfferDoc: {
      docName: "Alex_Garcia_Garcia_Job_Offer.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60",
    },
    otherDoc: {
      docName: "Alex_Garcia_Garcia_Degree.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60",
    },
  },
  {
    docId: "DOC-PASS-007",
    docName: "mohna_alkhaldi_Passport.pdf",
    docType: "Passport",
    employeeName: "mohna alkhaldi",
    employeeId: "EMP-67524",
    group: "Administrative / Management",
    passportNumber: "1092119575",
    issueDate: "2026-04-01",
    expiryDate: "2036-04-01",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    imgUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=60",
    cvDoc: {
      docName: "mohna_alkhaldi_CV.pdf",
      downloadUrl:
        "https://drive.google.com/file/d/1PCYeAD5UYAZdpb2t86tIcLEXB6EstwGp/view?usp=sharing",
      imgUrl:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60",
    },
    jobOfferDoc: {
      docName: "mohna_alkhaldi_Job_Offer.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60",
    },
    otherDoc: {
      docName: "mohna_alkhaldi_Degree.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60",
    },
  },
  {
    docId: "DOC-PASS-008",
    docName: "Sher_Shah_Passport.pdf",
    docType: "Passport",
    employeeName: "Sher Shah",
    employeeId: "EMP-65947",
    group: "Administrative / Management",
    passportNumber: "2443400342",
    issueDate: "2026-04-01",
    expiryDate: "2036-04-01",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    imgUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=60",
    cvDoc: {
      docName: "Sher_Shah_CV.pdf",
      downloadUrl:
        "https://drive.google.com/file/d/1PCYeAD5UYAZdpb2t86tIcLEXB6EstwGp/view?usp=sharing",
      imgUrl:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60",
    },
    jobOfferDoc: {
      docName: "Sher_Shah_Job_Offer.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60",
    },
    otherDoc: {
      docName: "Sher_Shah_Degree.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60",
    },
  },
  {
    docId: "DOC-PASS-009",
    docName: "Eman_AlNasser_Passport.pdf",
    docType: "Passport",
    employeeName: "Eman AlNasser",
    employeeId: "EMP-67712",
    group: "Administrative / Management",
    passportNumber: "1063800229",
    issueDate: "2026-04-01",
    expiryDate: "2036-04-01",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    imgUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=60",
    cvDoc: {
      docName: "Eman_AlNasser_CV.pdf",
      downloadUrl:
        "https://drive.google.com/file/d/1PCYeAD5UYAZdpb2t86tIcLEXB6EstwGp/view?usp=sharing",
      imgUrl:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60",
    },
    jobOfferDoc: {
      docName: "Eman_AlNasser_Job_Offer.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60",
    },
    otherDoc: {
      docName: "Eman_AlNasser_Degree.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60",
    },
  },
  {
    docId: "DOC-PASS-010",
    docName: "Mahabub_Alam_Passport.pdf",
    docType: "Passport",
    employeeName: "Mahabub Alam",
    employeeId: "EMP-67592",
    group: "Administrative / Management",
    passportNumber: "2515496525",
    issueDate: "2026-04-01",
    expiryDate: "2036-04-01",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    imgUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=60",
    cvDoc: {
      docName: "Mahabub_Alam_CV.pdf",
      downloadUrl:
        "https://drive.google.com/file/d/1PCYeAD5UYAZdpb2t86tIcLEXB6EstwGp/view?usp=sharing",
      imgUrl:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60",
    },
    jobOfferDoc: {
      docName: "Mahabub_Alam_Job_Offer.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60",
    },
    otherDoc: {
      docName: "Mahabub_Alam_Degree.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60",
    },
  },
  {
    docId: "DOC-PASS-011",
    docName: "Moneer_Abdulhadi_M_Al_Nasser_Passport.pdf",
    docType: "Passport",
    employeeName: "Moneer Abdulhadi M Al Nasser",
    employeeId: "EMP-67941",
    group: "Administrative / Management",
    passportNumber: "1010625711",
    issueDate: "2026-05-01",
    expiryDate: "2036-05-01",
    fileSize: "2.4 MB",
    fileFormat: "PDF",
    downloadUrl:
      "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    imgUrl:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=60",
    cvDoc: {
      docName: "Moneer_Abdulhadi_M_Al_Nasser_CV.pdf",
      downloadUrl:
        "https://drive.google.com/file/d/1PCYeAD5UYAZdpb2t86tIcLEXB6EstwGp/view?usp=sharing",
      imgUrl:
        "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60",
    },
    jobOfferDoc: {
      docName: "Moneer_Abdulhadi_M_Al_Nasser_Job_Offer.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60",
    },
    otherDoc: {
      docName: "Moneer_Abdulhadi_M_Al_Nasser_Degree.pdf",
      downloadUrl:
        "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      imgUrl:
        "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60",
    },
  },
];
