import { Button } from "@/components/ui/button";
import {
  DataTable,
  type Column,
  type FilterOption,
} from "@/components/ui/DataTable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Briefcase,
  Building2,
  Download,
  FileText,
  Pencil,
  Plus,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export interface MockEmployee {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  idNumber: string;
  employeeId: string;
  dacoId?: string | null;
  group: string;
  joiningDate: string;
  nationality: string;
  companyName: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED" | string;
  workLocation?: string;
  remark?: string;
  updatedAt?: string;
}

const MOCK_DATA: MockEmployee[] = [
  {
    "_id": "6a40b233a377d5283b7c44a1",
    "name": "Shoeib Abou Zied Mahmoud Awad",
    "email": "shoeib.awad@example.com",
    "phoneNumber": "+966 50 000 0001",
    "jobTitle": "Manager - Landscaping",
    "idNumber": "2254394725",
    "employeeId": "67621",
    "dacoId": "DMM-011-0198",
    "group": "Administrative / Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Egyptian",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a2",
    "name": "Abdullah Aldarweesh",
    "email": "abdullah.aldarweesh@example.com",
    "phoneNumber": "+966 50 000 0002",
    "jobTitle": "Manager - Ground",
    "idNumber": "1068924107",
    "employeeId": "67666",
    "dacoId": "DMM-011-0230",
    "group": "Administrative / Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a3",
    "name": "Reda Abdelmaged",
    "email": "reda.abdelmaged@example.com",
    "phoneNumber": "+966 50 000 0003",
    "jobTitle": "Engineer",
    "idNumber": "2503732816",
    "employeeId": "67574",
    "dacoId": "DMM-011-0453",
    "group": "Administrative / Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Egyptian",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a4",
    "name": "Mohamed Elsayed",
    "email": "mohamed.elsayed@example.com",
    "phoneNumber": "+966 50 000 0004",
    "jobTitle": "Engineer",
    "idNumber": "2485302786",
    "employeeId": "67608",
    "dacoId": null,
    "group": "Administrative / Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Egyptian",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a5",
    "name": "Afrazier Nassal",
    "email": "afrazier.nassal@example.com",
    "phoneNumber": "+966 50 000 0005",
    "jobTitle": "Engineer",
    "idNumber": "2483842916",
    "employeeId": "68168",
    "dacoId": null,
    "group": "Administrative / Management",
    "joiningDate": "2000-01-07T00:00:00.000Z",
    "nationality": "Filipino",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a6",
    "name": "Alex Garcia Garcia",
    "email": "alex.garcia@example.com",
    "phoneNumber": "+966 50 000 0006",
    "jobTitle": "Engineer",
    "idNumber": "2489688859",
    "employeeId": "67620",
    "dacoId": null,
    "group": "Administrative / Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Filipino",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a7",
    "name": "mohna alkhaldi",
    "email": "mohna.alkhaldi@example.com",
    "phoneNumber": "+966 50 000 0007",
    "jobTitle": "Administrator",
    "idNumber": "1092119575",
    "employeeId": "67524",
    "dacoId": null,
    "group": "Administrative / Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a8",
    "name": "Faisal alawathim",
    "email": "faisal.alawathim@example.com",
    "phoneNumber": "+966 50 000 0008",
    "jobTitle": "Supervisor",
    "idNumber": "1103804520",
    "employeeId": "67449",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-06-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Safari",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a9",
    "name": "Sher Shah",
    "email": "sher.shah@example.com",
    "phoneNumber": "+966 50 000 0009",
    "jobTitle": "Administrator",
    "idNumber": "2443400342",
    "employeeId": "65947",
    "dacoId": null,
    "group": "Administrative / Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a10",
    "name": "Eman AlNasser",
    "email": "eman.alnasser@safari.com.sa",
    "phoneNumber": "+966 50 123 4567",
    "jobTitle": "Administrator",
    "idNumber": "1063800229",
    "employeeId": "67712",
    "dacoId": null,
    "group": "Administrative / Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a11",
    "name": "Mahabub Alam",
    "email": "mahabub.alam@example.com",
    "phoneNumber": "+966 50 000 0011",
    "jobTitle": "Administrator",
    "idNumber": "2515496525",
    "employeeId": "67592",
    "dacoId": "DMM-011-0266",
    "group": "Administrative / Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a12",
    "name": "ALI ALMAHASNAH",
    "email": "ali.almahasnah@example.com",
    "phoneNumber": "+966 50 000 0012",
    "jobTitle": "Supervisor",
    "idNumber": "1103136923",
    "employeeId": "67706",
    "dacoId": "DMM-011-0196",
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a13",
    "name": "Nawaf Saeed Alghamgi",
    "email": "nawaf.alghamgi@example.com",
    "phoneNumber": "+966 50 000 0013",
    "jobTitle": "Safety Supervisor",
    "idNumber": "1098719253",
    "employeeId": "67940",
    "dacoId": "DMM-010-8678",
    "group": "Roads and Grounds",
    "joiningDate": "2026-05-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Safari",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a14",
    "name": "Asma Ibrahim",
    "email": "asma.ibrahim@example.com",
    "phoneNumber": "+966 50 000 0014",
    "jobTitle": "Supervisor",
    "idNumber": "1078602875",
    "employeeId": "67972",
    "dacoId": "DMM-011-1667",
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a15",
    "name": "Assauduzzamman",
    "email": "assauduzzamman@example.com",
    "phoneNumber": "+966 50 000 0015",
    "jobTitle": "Supervisor",
    "idNumber": "2237075912",
    "employeeId": "65959",
    "dacoId": "DMM-010-9406",
    "group": "Irrigation",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a16",
    "name": "Ali alhaddad",
    "email": "ali.alhaddad@example.com",
    "phoneNumber": "+966 50 000 0016",
    "jobTitle": "Supervisor",
    "idNumber": "1031410424",
    "employeeId": "68506",
    "dacoId": null,
    "group": "Fleet Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a17",
    "name": "Antonio Jr Enario",
    "email": "antonio.enario@example.com",
    "phoneNumber": "+966 50 000 0017",
    "jobTitle": "Supervisor",
    "idNumber": "2393912742",
    "employeeId": "67951",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Filipino",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a18",
    "name": "Mohamad Jinnat",
    "email": "mohamad.jinnat@example.com",
    "phoneNumber": "+966 50 000 0018",
    "jobTitle": "Supervisor",
    "idNumber": "2182413589",
    "employeeId": "67630",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a19",
    "name": "ALAMIN MIAH",
    "email": "alamin.miah@example.com",
    "phoneNumber": "+966 50 000 0019",
    "jobTitle": "Supervisor",
    "idNumber": "2496398013",
    "employeeId": "67623",
    "dacoId": null,
    "group": "Street light",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a20",
    "name": "BAKIR RIFAEY",
    "email": "bakir.rifaey@example.com",
    "phoneNumber": "+966 50 000 0020",
    "jobTitle": "Supervisor",
    "idNumber": "2253768424",
    "employeeId": "67918",
    "dacoId": "DMM-010-9427",
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Egyptian",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a21",
    "name": "MRAN SABJI FAROSH",
    "email": "mran.farosh@example.com",
    "phoneNumber": "+966 50 000 0021",
    "jobTitle": "Supervisor",
    "idNumber": "2251498545",
    "employeeId": "67566",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a22",
    "name": "Saeed Ahmed Hkohar",
    "email": "saeed.hkohar@example.com",
    "phoneNumber": "+966 50 000 0022",
    "jobTitle": "Supervisor",
    "idNumber": "2364018263",
    "employeeId": "68507",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a23",
    "name": "YAZAN ABU OBAYD",
    "email": "yazan.obayd@example.com",
    "phoneNumber": "+966 50 000 0023",
    "jobTitle": "Supervisor",
    "idNumber": "2117833687",
    "employeeId": "68508",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Jordanian",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a24",
    "name": "MD JOYNAL",
    "email": "md.joynal@example.com",
    "phoneNumber": "+966 50 000 0024",
    "jobTitle": "Technician",
    "idNumber": "2523627400",
    "employeeId": "67356",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a25",
    "name": "Hussain Saleh Alyosef",
    "email": "hussain.alyosef@example.com",
    "phoneNumber": "+966 50 000 0025",
    "jobTitle": "DRIVER HD",
    "idNumber": "1028504395",
    "employeeId": "67415",
    "dacoId": "DMM-011-1205",
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a26",
    "name": "ABDUL SALAM",
    "email": "abdul.salam@example.com",
    "phoneNumber": "+966 50 000 0026",
    "jobTitle": "Technician",
    "idNumber": "2312904465",
    "employeeId": "65577",
    "dacoId": "DMM-011-0625",
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a27",
    "name": "Mohhamad Hasan ali Abarar",
    "email": "mohamad.abarar@example.com",
    "phoneNumber": "+966 50 000 0027",
    "jobTitle": "Supervisor",
    "idNumber": "AB045647",
    "employeeId": "68568",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a28",
    "name": "SALAH UDDIN CHOWDRY",
    "email": "salah.chowdry@example.com",
    "phoneNumber": "+966 50 000 0028",
    "jobTitle": "Supervisor",
    "idNumber": "2495724003",
    "employeeId": "68574",
    "dacoId": null,
    "group": "Pest Control",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a29",
    "name": "Hridoy Miah",
    "email": "hridoy.miah@example.com",
    "phoneNumber": "+966 50 000 0029",
    "jobTitle": "DRIVER HD",
    "idNumber": "2476545252",
    "employeeId": "68563",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a30",
    "name": "Adil Mohammed Habib",
    "email": "adil.habib@example.com",
    "phoneNumber": "+966 50 000 0030",
    "jobTitle": "DRIVER HD",
    "idNumber": "2526223470",
    "employeeId": "68564",
    "dacoId": null,
    "group": "Street light",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a31",
    "name": "BILLAL",
    "email": "billal@example.com",
    "phoneNumber": "+966 50 000 0031",
    "jobTitle": "DRIVER HD",
    "idNumber": "2182500070",
    "employeeId": "68565",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a32",
    "name": "MONAYEM HOSSAN",
    "email": "monayem.hossan@example.com",
    "phoneNumber": "+966 50 000 0032",
    "jobTitle": "DRIVER HD",
    "idNumber": "2493550483",
    "employeeId": "68566",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE"
  },
  {
    "_id": "6a40b233a377d5283b7c44a33",
    "name": "Shafiqul Islam",
    "email": "shafiqul.islam@example.com",
    "phoneNumber": "+966 50 000 0033",
    "jobTitle": "DRIVER HD",
    "idNumber": "2231024064",
    "employeeId": "68567",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a34",
    "name": "KOBIR ALI",
    "email": "kobir.ali@example.com",
    "phoneNumber": "+966 50 000 0034",
    "jobTitle": "DRIVER HD",
    "idNumber": "2495831253",
    "employeeId": "68571",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a35",
    "name": "Shadat Hossan",
    "email": "shadat.hossan@example.com",
    "phoneNumber": "+966 50 000 0035",
    "jobTitle": "DRIVER HD",
    "idNumber": "2234812275",
    "employeeId": "68572",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a36",
    "name": "Sonam Pashang",
    "email": "sonam.pashang@example.com",
    "phoneNumber": "+966 50 000 0036",
    "jobTitle": "Technician",
    "idNumber": "2363702099",
    "employeeId": "68578",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Nepali",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a37",
    "name": "Almubarak Anwar",
    "email": "almubarak.anwar@example.com",
    "phoneNumber": "+966 50 000 0037",
    "jobTitle": "Technician",
    "idNumber": "1059685774",
    "employeeId": "68580",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a38",
    "name": "ALI ABDUL HADI",
    "email": "ali.abdul.hadi@example.com",
    "phoneNumber": "+966 50 000 0038",
    "jobTitle": "Technician",
    "idNumber": "1030471211",
    "employeeId": "68540",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a39",
    "name": "Mohammad Safi Idris",
    "email": "mohammad.safi.idris@example.com",
    "phoneNumber": "+966 50 000 0039",
    "jobTitle": "Technician",
    "idNumber": "2510919497",
    "employeeId": "68573",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Sudani",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a40",
    "name": "Muhammad Wasid Sayed",
    "email": "muhammad.wasid.sayed@example.com",
    "phoneNumber": "+966 50 000 0040",
    "jobTitle": "Technician",
    "idNumber": "2383739907",
    "employeeId": "68569",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a41",
    "name": "MD Sohag",
    "email": "md.sohag@example.com",
    "phoneNumber": "+966 50 000 0041",
    "jobTitle": "labor",
    "idNumber": "2523266126",
    "employeeId": "67490",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a42",
    "name": "MOHAMMED MUSLIM",
    "email": "mohammed.muslim@example.com",
    "phoneNumber": "+966 50 000 0042",
    "jobTitle": "labor",
    "idNumber": "2255145613",
    "employeeId": "68576",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a43",
    "name": "Gufran Warish Ali Kureshi",
    "email": "gufran.warish.ali.kureshi@example.com",
    "phoneNumber": "+966 50 000 0043",
    "jobTitle": "labor",
    "idNumber": "2568659672",
    "employeeId": "68541",
    "dacoId": null,
    "group": "Fleet Management",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a44",
    "name": "Harun Mohammad",
    "email": "harun.mohammad@example.com",
    "phoneNumber": "+966 50 000 0044",
    "jobTitle": "labor",
    "idNumber": "2516224769",
    "employeeId": "68542",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a45",
    "name": "Shahbaz Khan Banaras Khan",
    "email": "shahbaz.khan.banaras.khan@example.com",
    "phoneNumber": "+966 50 000 0045",
    "jobTitle": "labor",
    "idNumber": "2345076778",
    "employeeId": "68543",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a46",
    "name": "Coyle Kay",
    "email": "coyle.kay@example.com",
    "phoneNumber": "+966 50 000 0046",
    "jobTitle": "labor",
    "idNumber": "2396566198",
    "employeeId": "68544",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Nepali",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a47",
    "name": "Mofiz Nayeb Ali",
    "email": "mofiz.nayeb.ali@example.com",
    "phoneNumber": "+966 50 000 0047",
    "jobTitle": "labor",
    "idNumber": "2237076050",
    "employeeId": "68545",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a48",
    "name": "Shukur Mohd Ali",
    "email": "shukur.mohd.ali@example.com",
    "phoneNumber": "+966 50 000 0048",
    "jobTitle": "labor",
    "idNumber": "2237074196",
    "employeeId": "68546",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a49",
    "name": "Sirajul Islam",
    "email": "sirajul.islam@example.com",
    "phoneNumber": "+966 50 000 0049",
    "jobTitle": "labor",
    "idNumber": "2488997889",
    "employeeId": "68547",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a50",
    "name": "Amir Hossain",
    "email": "amir.hossain@example.com",
    "phoneNumber": "+966 50 000 0050",
    "jobTitle": "labor",
    "idNumber": "2508658503",
    "employeeId": "68549",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a51",
    "name": "MAZIBUR RAHMAN",
    "email": "mazibur.rahman@example.com",
    "phoneNumber": "+966 50 000 0051",
    "jobTitle": "labor",
    "idNumber": "2495728608",
    "employeeId": "68560",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a52",
    "name": "SIFAT DEWAN",
    "email": "sifat.dewan@example.com",
    "phoneNumber": "+966 50 000 0052",
    "jobTitle": "labor",
    "idNumber": "2547451399",
    "employeeId": "68561",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a53",
    "name": "ASHARFUL ISLAM",
    "email": "asharful.islam@example.com",
    "phoneNumber": "+966 50 000 0053",
    "jobTitle": "labor",
    "idNumber": "2547721387",
    "employeeId": "68570",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a54",
    "name": "Masom",
    "email": "masom@example.com",
    "phoneNumber": "+966 50 000 0054",
    "jobTitle": "labor",
    "idNumber": "2495729275",
    "employeeId": "67492",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a55",
    "name": "MD.Firoz Ali",
    "email": "md.firoz.ali@example.com",
    "phoneNumber": "+966 50 000 0055",
    "jobTitle": "labor",
    "idNumber": "2509642860",
    "employeeId": "68577",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a56",
    "name": "Abu Kamal",
    "email": "abu.kamal@example.com",
    "phoneNumber": "+966 50 000 0056",
    "jobTitle": "labor",
    "idNumber": "2509143570",
    "employeeId": "68548",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a57",
    "name": "Azizul Haque",
    "email": "azizul.haque@example.com",
    "phoneNumber": "+966 50 000 0057",
    "jobTitle": "labor",
    "idNumber": "2508426216",
    "employeeId": "68550",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a58",
    "name": "Khalilur Rahman",
    "email": "khalilur.rahman@example.com",
    "phoneNumber": "+966 50 000 0058",
    "jobTitle": "labor",
    "idNumber": "2509443277",
    "employeeId": "68551",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a59",
    "name": "MD MOSTAFA KAMAL",
    "email": "md.mostafa.kamal@example.com",
    "phoneNumber": "+966 50 000 0059",
    "jobTitle": "labor",
    "idNumber": "2515581342",
    "employeeId": "68552",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a60",
    "name": "MOHAMMAD FARUQ AHMED",
    "email": "mohammad.faruq.ahmed@example.com",
    "phoneNumber": "+966 50 000 0060",
    "jobTitle": "labor",
    "idNumber": "2515192462",
    "employeeId": "68553",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a61",
    "name": "MD FARUQ MIAH",
    "email": "md.faruq.miah@example.com",
    "phoneNumber": "+966 50 000 0061",
    "jobTitle": "labor",
    "idNumber": "2507667182",
    "employeeId": "68554",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a62",
    "name": "Rafiq Robiul",
    "email": "rafiq.robiul@example.com",
    "phoneNumber": "+966 50 000 0062",
    "jobTitle": "labor",
    "idNumber": "2556727580",
    "employeeId": "68555",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a63",
    "name": "RANA ABDUL GAFUR",
    "email": "rana.abdul.gafur@example.com",
    "phoneNumber": "+966 50 000 0063",
    "jobTitle": "labor",
    "idNumber": "2518057126",
    "employeeId": "68556",
    "dacoId": null,
    "group": "Fleet Management",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a64",
    "name": "SADDAM HOSSAIN",
    "email": "saddam.hossain@example.com",
    "phoneNumber": "+966 50 000 0064",
    "jobTitle": "labor",
    "idNumber": "2515706832",
    "employeeId": "68557",
    "dacoId": null,
    "group": "Fleet Management",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a65",
    "name": "Shorov Miah",
    "email": "shorov.miah@example.com",
    "phoneNumber": "+966 50 000 0065",
    "jobTitle": "labor",
    "idNumber": "2497311643",
    "employeeId": "68559",
    "dacoId": null,
    "group": "Fleet Management",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a66",
    "name": "Main Uddin",
    "email": "main.uddin@example.com",
    "phoneNumber": "+966 50 000 0066",
    "jobTitle": "labor",
    "idNumber": "2514099734",
    "employeeId": "68562",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a67",
    "name": "Danilo Revila",
    "email": "danilo.revila@example.com",
    "phoneNumber": "+966 50 000 0067",
    "jobTitle": "Technician",
    "idNumber": "2270349554",
    "employeeId": "68073",
    "dacoId": "DMM-011-0454",
    "group": "Fleet Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Filipino",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a68",
    "name": "Robert morales",
    "email": "robert.morales@example.com",
    "phoneNumber": "+966 50 000 0068",
    "jobTitle": "Technician",
    "idNumber": "2259560106",
    "employeeId": "68074",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Filipino",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a69",
    "name": "Mozah Farss Aldossary",
    "email": "mozah.farss.aldossary@example.com",
    "phoneNumber": "+966 50 000 0069",
    "jobTitle": "Technician",
    "idNumber": "1028689220",
    "employeeId": "68144",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a70",
    "name": "Shafioue Hossain",
    "email": "shafioue.hossain@example.com",
    "phoneNumber": "+966 50 000 0070",
    "jobTitle": "Technician",
    "idNumber": "2184317804",
    "employeeId": "67634",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a71",
    "name": "Javed Fateh Muhammad",
    "email": "javed.fateh.muhammad@example.com",
    "phoneNumber": "+966 50 000 0071",
    "jobTitle": "Technician",
    "idNumber": "2334029580",
    "employeeId": "68090",
    "dacoId": "DMM-011-0286",
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a72",
    "name": "Abdul Jabbar Mohammad",
    "email": "abdul.jabbar.mohammad@example.com",
    "phoneNumber": "+966 50 000 0072",
    "jobTitle": "Technician",
    "idNumber": "2381603584",
    "employeeId": "68509",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a73",
    "name": "Mahadi Hassan",
    "email": "mahadi.hassan@example.com",
    "phoneNumber": "+966 50 000 0073",
    "jobTitle": "Technician",
    "idNumber": "1114777830",
    "employeeId": "68103",
    "dacoId": "DMM-011-0283",
    "group": "Irrigation",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a74",
    "name": "ZAKEER HUSSAIN A",
    "email": "zakeer.hussain.a@example.com",
    "phoneNumber": "+966 50 000 0074",
    "jobTitle": "Technician",
    "idNumber": "2397587276",
    "employeeId": "65960",
    "dacoId": "DMM-011-0522",
    "group": "Irrigation",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a75",
    "name": "Mohammad Aslam Mohammad Juhar",
    "email": "mohammad.aslam.mohammad.juhar@example.com",
    "phoneNumber": "+966 50 000 0075",
    "jobTitle": "Technician",
    "idNumber": "2338250380",
    "employeeId": "67728",
    "dacoId": "DMM-011-0510",
    "group": "Irrigation",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a76",
    "name": "Julio Jr Corpuz Doria",
    "email": "julio.jr.corpuz.doria@example.com",
    "phoneNumber": "+966 50 000 0076",
    "jobTitle": "Technician",
    "idNumber": "2272779600",
    "employeeId": "67723",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Filipino",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a77",
    "name": "MOHAMMAD LUQMAN",
    "email": "mohammad.luqman@example.com",
    "phoneNumber": "+966 50 000 0077",
    "jobTitle": "Technician",
    "idNumber": "2268099096",
    "employeeId": "65651",
    "dacoId": "DMM-010-9675",
    "group": "Irrigation",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a78",
    "name": "Hussain Alzayer",
    "email": "hussain.alzayer@example.com",
    "phoneNumber": "+966 50 000 0078",
    "jobTitle": "Technician",
    "idNumber": "1085981445",
    "employeeId": "67957",
    "dacoId": "DMM-011-1204",
    "group": "Fleet Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a79",
    "name": "Mir Muhammad Ali Syed",
    "email": "mir.muhammad.ali.syed@example.com",
    "phoneNumber": "+966 50 000 0079",
    "jobTitle": "Technician",
    "idNumber": "2527652719",
    "employeeId": "67752",
    "dacoId": null,
    "group": "Fleet Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a80",
    "name": "ABDELMAGED MOHAMED",
    "email": "abdelmaged.mohamed@example.com",
    "phoneNumber": "+966 50 000 0080",
    "jobTitle": "Technician",
    "idNumber": "2530838354",
    "employeeId": "65914",
    "dacoId": "DMM-011-0282",
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Egyptian",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a81",
    "name": "ARNULFO LAURON",
    "email": "arnulfo.lauron@example.com",
    "phoneNumber": "+966 50 000 0081",
    "jobTitle": "Technician",
    "idNumber": "2268207699",
    "employeeId": "67549",
    "dacoId": "DMM-011-0504",
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Filipino",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a82",
    "name": "MD MOHAMMADOL HASAN",
    "email": "md.mohammadol.hasan@example.com",
    "phoneNumber": "+966 50 000 0082",
    "jobTitle": "Technician",
    "idNumber": "2495831188",
    "employeeId": "65917",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a83",
    "name": "MD Mahfoz Miah",
    "email": "md.mahfoz.miah@example.com",
    "phoneNumber": "+966 50 000 0083",
    "jobTitle": "Technician",
    "idNumber": "2589026653",
    "employeeId": "67641",
    "dacoId": null,
    "group": "Street light",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a84",
    "name": "Bipal Mondal Madan",
    "email": "bipal.mondal.madan@example.com",
    "phoneNumber": "+966 50 000 0084",
    "jobTitle": "Technician",
    "idNumber": "2424962989",
    "employeeId": "67044",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a85",
    "name": "DALWAR UDDIN",
    "email": "dalwar.uddin@example.com",
    "phoneNumber": "+966 50 000 0085",
    "jobTitle": "Technician",
    "idNumber": "2195631219",
    "employeeId": "65553",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a86",
    "name": "ALAWI ADNAN AL FALFAL",
    "email": "alawi.adnan.al.falfal@example.com",
    "phoneNumber": "+966 50 000 0086",
    "jobTitle": "Technician",
    "idNumber": "1014293904",
    "employeeId": "65812",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a87",
    "name": "Ahsan Ulla Moksed Ali",
    "email": "ahsan.ulla.moksed.ali@example.com",
    "phoneNumber": "+966 50 000 0087",
    "jobTitle": "Technician",
    "idNumber": "2182562435",
    "employeeId": "65948",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a88",
    "name": "SALMAN BIN ALI",
    "email": "salman.bin.ali@example.com",
    "phoneNumber": "+966 50 000 0088",
    "jobTitle": "Technician",
    "idNumber": "1060806096",
    "employeeId": "67436",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a89",
    "name": "Muhammmad Nasir Abdelmadgid",
    "email": "muhammmad.nasir.abdelmadgid@example.com",
    "phoneNumber": "+966 50 000 0089",
    "jobTitle": "Technician",
    "idNumber": "2571230149",
    "employeeId": "67834",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Egyptian",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": "safari"
  },
  {
    "_id": "6a40b233a377d5283b7c44a90",
    "name": "Moustafa Kamel",
    "email": "moustafa.kamel@example.com",
    "phoneNumber": "+966 50 000 0090",
    "jobTitle": "Technician",
    "idNumber": "2470358843",
    "employeeId": "68820",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Egyptian",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a91",
    "name": "MUSTAFA AL MUBARAK",
    "email": "mustafa.al.mubarak@example.com",
    "phoneNumber": "+966 50 000 0091",
    "jobTitle": "Technician",
    "idNumber": "1045951728",
    "employeeId": "65986",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a92",
    "name": "Ali Hussain Al Hamgan",
    "email": "ali.hussain.al.hamgan@example.com",
    "phoneNumber": "+966 50 000 0092",
    "jobTitle": "Administrator",
    "idNumber": "1007068537",
    "employeeId": "67715",
    "dacoId": "DMM-011-0779",
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a93",
    "name": "NURE ALAM",
    "email": "nure.alam@example.com",
    "phoneNumber": "+966 50 000 0093",
    "jobTitle": "labor",
    "idNumber": "2495724110",
    "employeeId": "68154",
    "dacoId": "DMM-011-0291",
    "group": "Street light",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a94",
    "name": "MD RAKIBUL",
    "email": "md.rakibul@example.com",
    "phoneNumber": "+966 50 000 0094",
    "jobTitle": "labor",
    "idNumber": "2601438373",
    "employeeId": "62561",
    "dacoId": null,
    "group": "Street light",
    "joiningDate": "2026-05-13T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a95",
    "name": "MOHAMMAD ALAMIN MIAH",
    "email": "mohammad.alamin.miah@example.com",
    "phoneNumber": "+966 50 000 0095",
    "jobTitle": "labor",
    "idNumber": "2484839572",
    "employeeId": "65559",
    "dacoId": "DMM-011-0517",
    "group": "Irrigation",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a96",
    "name": "MANNAN PRODHAN",
    "email": "mannan.prodhan@example.com",
    "phoneNumber": "+966 50 000 0096",
    "jobTitle": "labor",
    "idNumber": "2495724227",
    "employeeId": "65558",
    "dacoId": "DMM-010-9420",
    "group": "Irrigation",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a97",
    "name": "Habibur Rohman",
    "email": "habibur.rohman@example.com",
    "phoneNumber": "+966 50 000 0097",
    "jobTitle": "labor",
    "idNumber": "2555932330",
    "employeeId": "67464",
    "dacoId": null,
    "group": "Fleet Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a98",
    "name": "Kazi Menhaj Ahmed",
    "email": "kazi.menhaj.ahmed@example.com",
    "phoneNumber": "+966 50 000 0098",
    "jobTitle": "Supervisor",
    "idNumber": "2150142210",
    "employeeId": "29643",
    "dacoId": null,
    "group": "Fleet Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a99",
    "name": "Sathish Kumar",
    "email": "sathish.kumar@example.com",
    "phoneNumber": "+966 50 000 0099",
    "jobTitle": "labor",
    "idNumber": "2090958691",
    "employeeId": "29547",
    "dacoId": null,
    "group": "Fleet Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a100",
    "name": "Azam Khan Shabbir",
    "email": "azam.khan.shabbir@example.com",
    "phoneNumber": "+966 50 000 0100",
    "jobTitle": "labor",
    "idNumber": "2231109204",
    "employeeId": "2755",
    "dacoId": null,
    "group": "Fleet Management",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a101",
    "name": "Mohammad Alauddin Awawar Ali",
    "email": "mohammad.alauddin.awawar.ali@example.com",
    "phoneNumber": "+966 50 000 0101",
    "jobTitle": "labor",
    "idNumber": "2636524171",
    "employeeId": "67920",
    "dacoId": "DMM-011-6380",
    "group": "Fleet Management",
    "joiningDate": "2026-05-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a102",
    "name": "MATHAI K.K.",
    "email": "mathai.k.k.@example.com",
    "phoneNumber": "+966 50 000 0102",
    "jobTitle": "labor",
    "idNumber": "2064697911",
    "employeeId": "29623",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a103",
    "name": "MOHAMMAD JAVEED",
    "email": "mohammad.javeed@example.com",
    "phoneNumber": "+966 50 000 0103",
    "jobTitle": "labor",
    "idNumber": "2633482894",
    "employeeId": "67819",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a104",
    "name": "AMIT KUMAR",
    "email": "amit.kumar@example.com",
    "phoneNumber": "+966 50 000 0104",
    "jobTitle": "labor",
    "idNumber": "2636512499",
    "employeeId": "67840",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a105",
    "name": "MOHAMMAD ASIF KHAN",
    "email": "mohammad.asif.khan@example.com",
    "phoneNumber": "+966 50 000 0105",
    "jobTitle": "labor",
    "idNumber": "2633479940",
    "employeeId": "67828",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a106",
    "name": "MOHAMMAD ALI SHERI",
    "email": "mohammad.ali.sheri@example.com",
    "phoneNumber": "+966 50 000 0106",
    "jobTitle": "labor",
    "idNumber": "2634519484",
    "employeeId": "67818",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a107",
    "name": "MOHAMMAD RIZWAN",
    "email": "mohammad.rizwan@example.com",
    "phoneNumber": "+966 50 000 0107",
    "jobTitle": "labor",
    "idNumber": "2269027336",
    "employeeId": "67595",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a108",
    "name": "RAMDAS",
    "email": "ramdas@example.com",
    "phoneNumber": "+966 50 000 0108",
    "jobTitle": "labor",
    "idNumber": "2293717423",
    "employeeId": "67536",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a109",
    "name": "FIROZ ALAM MOFIZ",
    "email": "firoz.alam.mofiz@example.com",
    "phoneNumber": "+966 50 000 0109",
    "jobTitle": "labor",
    "idNumber": "2495870822",
    "employeeId": "65551",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a110",
    "name": "MD Mukles",
    "email": "md.mukles@example.com",
    "phoneNumber": "+966 50 000 0110",
    "jobTitle": "labor",
    "idNumber": "2549825939",
    "employeeId": "67491",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a111",
    "name": "Fahad Mia",
    "email": "fahad.mia@example.com",
    "phoneNumber": "+966 50 000 0111",
    "jobTitle": "Labor",
    "idNumber": "2531962963",
    "employeeId": "67643",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a112",
    "name": "Lal Miah Messer",
    "email": "lal.miah.messer@example.com",
    "phoneNumber": "+966 50 000 0112",
    "jobTitle": "Technician",
    "idNumber": "2237342916",
    "employeeId": "67753",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a113",
    "name": "Imamul",
    "email": "imamul@example.com",
    "phoneNumber": "+966 50 000 0113",
    "jobTitle": "Labor",
    "idNumber": "2508426612",
    "employeeId": "67463",
    "dacoId": "DMM-011-0502",
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a114",
    "name": "Salim",
    "email": "salim@example.com",
    "phoneNumber": "+966 50 000 0114",
    "jobTitle": "Labor",
    "idNumber": "2508433832",
    "employeeId": "67479",
    "dacoId": "DMM-011-0446",
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a115",
    "name": "MD HOSSAIN",
    "email": "md.hossain@example.com",
    "phoneNumber": "+966 50 000 0115",
    "jobTitle": "labor",
    "idNumber": "2495831162",
    "employeeId": "65578",
    "dacoId": "DMM-011-1200",
    "group": "Street light",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a116",
    "name": "ABUL HOSSAIN",
    "email": "abul.hossain@example.com",
    "phoneNumber": "+966 50 000 0116",
    "jobTitle": "Labor",
    "idNumber": "2518057142",
    "employeeId": "65576",
    "dacoId": "DMM-011-1313",
    "group": "Street light",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a117",
    "name": "Robiul",
    "email": "robiul@example.com",
    "phoneNumber": "+966 50 000 0117",
    "jobTitle": "Labor",
    "idNumber": "2495725018",
    "employeeId": "67551",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-25T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a118",
    "name": "Ahsan Bundu",
    "email": "ahsan.bundu@example.com",
    "phoneNumber": "+966 50 000 0118",
    "jobTitle": "labor",
    "idNumber": "2545542009",
    "employeeId": "67365",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a119",
    "name": "IRSHAD AHMAD",
    "email": "irshad.ahmad@example.com",
    "phoneNumber": "+966 50 000 0119",
    "jobTitle": "labor",
    "idNumber": "2547944518",
    "employeeId": "67462",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a120",
    "name": "Qadis Shakeel",
    "email": "qadis.shakeel@example.com",
    "phoneNumber": "+966 50 000 0120",
    "jobTitle": "labor",
    "idNumber": "2633479593",
    "employeeId": "67869",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-20T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a121",
    "name": "Shankar Krishnappa",
    "email": "shankar.krishnappa@example.com",
    "phoneNumber": "+966 50 000 0121",
    "jobTitle": "labor",
    "idNumber": "263522639",
    "employeeId": "67931",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-20T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a122",
    "name": "Mohammed mosim",
    "email": "mohammed.mosim@example.com",
    "phoneNumber": "+966 50 000 0122",
    "jobTitle": "labor",
    "idNumber": "2636524395",
    "employeeId": "67855",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-20T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a123",
    "name": "Ghulam Qaiser",
    "email": "ghulam.qaiser@example.com",
    "phoneNumber": "+966 50 000 0123",
    "jobTitle": "labor",
    "idNumber": "BV4911123",
    "employeeId": "68503",
    "dacoId": "DMM-010-8410",
    "group": "Irrigation",
    "joiningDate": "2026-04-20T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a124",
    "name": "MD Roky Hossin",
    "email": "md.roky.hossin@example.com",
    "phoneNumber": "+966 50 000 0124",
    "jobTitle": "labor",
    "idNumber": "2495729028",
    "employeeId": "67042",
    "dacoId": null,
    "group": "Pest Control",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a125",
    "name": "Mojammel Hossain Saikat",
    "email": "mojammel.hossain.saikat@example.com",
    "phoneNumber": "+966 50 000 0125",
    "jobTitle": "labor",
    "idNumber": "A20139723",
    "employeeId": "66974",
    "dacoId": "DMM-010-8383",
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a126",
    "name": "Saiful Md Jafor",
    "email": "saiful.md.jafor@example.com",
    "phoneNumber": "+966 50 000 0126",
    "jobTitle": "labor",
    "idNumber": "2521601324",
    "employeeId": "67394",
    "dacoId": "DMM-011-0511",
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a127",
    "name": "Razib Bepery",
    "email": "razib.bepery@example.com",
    "phoneNumber": "+966 50 000 0127",
    "jobTitle": "labor",
    "idNumber": "2507724652",
    "employeeId": "67354",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a128",
    "name": "MD Jakir Hossen",
    "email": "md.jakir.hossen@example.com",
    "phoneNumber": "+966 50 000 0128",
    "jobTitle": "labor",
    "idNumber": "2523931562",
    "employeeId": "67041",
    "dacoId": "DMM-011-0501",
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a129",
    "name": "Mohammad Alamin Mia",
    "email": "mohammad.alamin.mia@example.com",
    "phoneNumber": "+966 50 000 0129",
    "jobTitle": "labor",
    "idNumber": "2510120526",
    "employeeId": "67466",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a130",
    "name": "Salim Siddiqur",
    "email": "salim.siddiqur@example.com",
    "phoneNumber": "+966 50 000 0130",
    "jobTitle": "labor",
    "idNumber": "2494139062",
    "employeeId": "67353",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a131",
    "name": "MD Sohag Mia",
    "email": "md.sohag.mia@example.com",
    "phoneNumber": "+966 50 000 0131",
    "jobTitle": "labor",
    "idNumber": "2498313234",
    "employeeId": "67407",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a132",
    "name": "Jomsid Ali",
    "email": "jomsid.ali@example.com",
    "phoneNumber": "+966 50 000 0132",
    "jobTitle": "labor",
    "idNumber": "2596861993",
    "employeeId": "68769",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a133",
    "name": "Md Assadullah",
    "email": "md.assadullah@example.com",
    "phoneNumber": "+966 50 000 0133",
    "jobTitle": "labor",
    "idNumber": "2628025633",
    "employeeId": "68755",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a134",
    "name": "Md Hiro Mia",
    "email": "md.hiro.mia@example.com",
    "phoneNumber": "+966 50 000 0134",
    "jobTitle": "labor",
    "idNumber": "2629001708",
    "employeeId": "68756",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a135",
    "name": "Jisu Das",
    "email": "jisu.das@example.com",
    "phoneNumber": "+966 50 000 0135",
    "jobTitle": "labor",
    "idNumber": "2625321316",
    "employeeId": "68824",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a136",
    "name": "Anowar Hossain",
    "email": "anowar.hossain@example.com",
    "phoneNumber": "+966 50 000 0136",
    "jobTitle": "labor",
    "idNumber": "2631852494",
    "employeeId": "68765",
    "dacoId": null,
    "group": "Nursery",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a137",
    "name": "MD ARIFUL ISALM",
    "email": "md.ariful.isalm@example.com",
    "phoneNumber": "+966 50 000 0137",
    "jobTitle": "labor",
    "idNumber": "2511128486",
    "employeeId": "68504",
    "dacoId": null,
    "group": "Street light",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a138",
    "name": "Dinesh Bhar",
    "email": "dinesh.bhar@example.com",
    "phoneNumber": "+966 50 000 0138",
    "jobTitle": "labor",
    "idNumber": "2630496079",
    "employeeId": "68757",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a139",
    "name": "Zaj Miah",
    "email": "zaj.miah@example.com",
    "phoneNumber": "+966 50 000 0139",
    "jobTitle": "labor",
    "idNumber": "2518754243",
    "employeeId": "67433",
    "dacoId": "DMM-011-0512",
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a140",
    "name": "Mohammad Mitun",
    "email": "mohammad.mitun@example.com",
    "phoneNumber": "+966 50 000 0140",
    "jobTitle": "labor",
    "idNumber": "2508425903",
    "employeeId": "67442",
    "dacoId": "DMM-011-0624",
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a141",
    "name": "Jakirul Islam",
    "email": "jakirul.islam@example.com",
    "phoneNumber": "+966 50 000 0141",
    "jobTitle": "labor",
    "idNumber": "2532075823",
    "employeeId": "67333",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a142",
    "name": "Faruk Mia",
    "email": "faruk.mia@example.com",
    "phoneNumber": "+966 50 000 0142",
    "jobTitle": "labor",
    "idNumber": "2508426042",
    "employeeId": "67393",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a143",
    "name": "Mohammad Hossain",
    "email": "mohammad.hossain@example.com",
    "phoneNumber": "+966 50 000 0143",
    "jobTitle": "labor",
    "idNumber": "2495729556",
    "employeeId": "67343",
    "dacoId": "DMM-011-6733",
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a144",
    "name": "Rajib Mia",
    "email": "rajib.mia@example.com",
    "phoneNumber": "+966 50 000 0144",
    "jobTitle": "labor",
    "idNumber": "2532076003",
    "employeeId": "67350",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a145",
    "name": "MD Biplop Mia",
    "email": "md.biplop.mia@example.com",
    "phoneNumber": "+966 50 000 0145",
    "jobTitle": "labor",
    "idNumber": "2532076185",
    "employeeId": "67358",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a146",
    "name": "Sohel mia",
    "email": "sohel.mia@example.com",
    "phoneNumber": "+966 50 000 0146",
    "jobTitle": "labor",
    "idNumber": "2628262038",
    "employeeId": "68754",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a147",
    "name": "MD Faruk Mia",
    "email": "md.faruk.mia@example.com",
    "phoneNumber": "+966 50 000 0147",
    "jobTitle": "labor",
    "idNumber": "2495723666",
    "employeeId": "67351",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a148",
    "name": "Shahmeraj Miah",
    "email": "shahmeraj.miah@example.com",
    "phoneNumber": "+966 50 000 0148",
    "jobTitle": "labor",
    "idNumber": "2495723708",
    "employeeId": "67342",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a149",
    "name": "Kajol Soltan",
    "email": "kajol.soltan@example.com",
    "phoneNumber": "+966 50 000 0149",
    "jobTitle": "labor",
    "idNumber": "2513346292",
    "employeeId": "67344",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a150",
    "name": "MD Saiful",
    "email": "md.saiful@example.com",
    "phoneNumber": "+966 50 000 0150",
    "jobTitle": "labor",
    "idNumber": "2500807702",
    "employeeId": "67431",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a151",
    "name": "Semul Hossain",
    "email": "semul.hossain@example.com",
    "phoneNumber": "+966 50 000 0151",
    "jobTitle": "labor",
    "idNumber": "2495723849",
    "employeeId": "67352",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a152",
    "name": "Krishna Bind Nanda Bind",
    "email": "krishna.bind.nanda.bind@example.com",
    "phoneNumber": "+966 50 000 0152",
    "jobTitle": "labor",
    "idNumber": "2485304162",
    "employeeId": "67481",
    "dacoId": "DMM-011-0620",
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a153",
    "name": "MD Numan Mia",
    "email": "md.numan.mia@example.com",
    "phoneNumber": "+966 50 000 0153",
    "jobTitle": "labor",
    "idNumber": "2526230780",
    "employeeId": "67434",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a154",
    "name": "Muhammad Tayyeb",
    "email": "muhammad.tayyeb@example.com",
    "phoneNumber": "+966 50 000 0154",
    "jobTitle": "labor",
    "idNumber": "2523147565",
    "employeeId": "67552",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a155",
    "name": "MD Jahidur Rahman",
    "email": "md.jahidur.rahman@example.com",
    "phoneNumber": "+966 50 000 0155",
    "jobTitle": "labor",
    "idNumber": "2576353243",
    "employeeId": "68766",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a156",
    "name": "MD Shemal Miah",
    "email": "md.shemal.miah@example.com",
    "phoneNumber": "+966 50 000 0156",
    "jobTitle": "labor",
    "idNumber": "2624202632",
    "employeeId": "68762",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a157",
    "name": "Md Juwel Isalm",
    "email": "md.juwel.isalm@example.com",
    "phoneNumber": "+966 50 000 0157",
    "jobTitle": "labor",
    "idNumber": "2428049825",
    "employeeId": "67361",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a158",
    "name": "Raju Ray",
    "email": "raju.ray@example.com",
    "phoneNumber": "+966 50 000 0158",
    "jobTitle": "labor",
    "idNumber": "2630496145",
    "employeeId": "68759",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a159",
    "name": "Muneeb Usman",
    "email": "muneeb.usman@example.com",
    "phoneNumber": "+966 50 000 0159",
    "jobTitle": "labor",
    "idNumber": "2633481094",
    "employeeId": "67868",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a160",
    "name": "MD Iqabal Hasan",
    "email": "md.iqabal.hasan@example.com",
    "phoneNumber": "+966 50 000 0160",
    "jobTitle": "labor",
    "idNumber": "2627978048",
    "employeeId": "68763",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a161",
    "name": "Saelim Ali Ahmed",
    "email": "saelim.ali.ahmed@example.com",
    "phoneNumber": "+966 50 000 0161",
    "jobTitle": "labor",
    "idNumber": "2488041803",
    "employeeId": "68767",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a162",
    "name": "Bijoy Roy",
    "email": "bijoy.roy@example.com",
    "phoneNumber": "+966 50 000 0162",
    "jobTitle": "labor",
    "idNumber": "2630495691",
    "employeeId": "68758",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a163",
    "name": "Sanjoy Roy",
    "email": "sanjoy.roy@example.com",
    "phoneNumber": "+966 50 000 0163",
    "jobTitle": "labor",
    "idNumber": "2630495659",
    "employeeId": "68760",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a164",
    "name": "Sabuj",
    "email": "sabuj@example.com",
    "phoneNumber": "+966 50 000 0164",
    "jobTitle": "labor",
    "idNumber": "2631190523",
    "employeeId": "68733",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a165",
    "name": "MD yashin",
    "email": "md.yashin@example.com",
    "phoneNumber": "+966 50 000 0165",
    "jobTitle": "labor",
    "idNumber": "2631190739",
    "employeeId": "68731",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a166",
    "name": "MD salim",
    "email": "md.salim@example.com",
    "phoneNumber": "+966 50 000 0166",
    "jobTitle": "labor",
    "idNumber": "2596870424",
    "employeeId": "68730",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a167",
    "name": "MD Iqbal",
    "email": "md.iqbal@example.com",
    "phoneNumber": "+966 50 000 0167",
    "jobTitle": "labor",
    "idNumber": "2574986515",
    "employeeId": "68764",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a168",
    "name": "Shahin Miha",
    "email": "shahin.miha@example.com",
    "phoneNumber": "+966 50 000 0168",
    "jobTitle": "labor",
    "idNumber": "2629852829",
    "employeeId": "68737",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a169",
    "name": "Nazmul Hasan",
    "email": "nazmul.hasan@example.com",
    "phoneNumber": "+966 50 000 0169",
    "jobTitle": "labor",
    "idNumber": "2633996943",
    "employeeId": "69336",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-06-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a170",
    "name": "Waskoroni",
    "email": "waskoroni@example.com",
    "phoneNumber": "+966 50 000 0170",
    "jobTitle": "labor",
    "idNumber": "2627145473",
    "employeeId": "68740",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a171",
    "name": "MD Sumon",
    "email": "md.sumon@example.com",
    "phoneNumber": "+966 50 000 0171",
    "jobTitle": "labor",
    "idNumber": "2630239016",
    "employeeId": "68742",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a172",
    "name": "MD Saiful Islam",
    "email": "md.saiful.islam@example.com",
    "phoneNumber": "+966 50 000 0172",
    "jobTitle": "labor",
    "idNumber": "2629534708",
    "employeeId": "68729",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a173",
    "name": "Asa Pramanik",
    "email": "asa.pramanik@example.com",
    "phoneNumber": "+966 50 000 0173",
    "jobTitle": "labor",
    "idNumber": "2631316235",
    "employeeId": "68745",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a174",
    "name": "MD Anowar Shek",
    "email": "md.anowar.shek@example.com",
    "phoneNumber": "+966 50 000 0174",
    "jobTitle": "labor",
    "idNumber": "2630239180",
    "employeeId": "68738",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a175",
    "name": "MD Alam Miha",
    "email": "md.alam.miha@example.com",
    "phoneNumber": "+966 50 000 0175",
    "jobTitle": "labor",
    "idNumber": "2630239149",
    "employeeId": "68739",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a176",
    "name": "MD Hassan",
    "email": "md.hassan@example.com",
    "phoneNumber": "+966 50 000 0176",
    "jobTitle": "labor",
    "idNumber": "2626474189",
    "employeeId": "68750",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a177",
    "name": "MD Mohar Ali",
    "email": "md.mohar.ali@example.com",
    "phoneNumber": "+966 50 000 0177",
    "jobTitle": "labor",
    "idNumber": "2630238950",
    "employeeId": "68748",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a178",
    "name": "MD Forid Ali",
    "email": "md.forid.ali@example.com",
    "phoneNumber": "+966 50 000 0178",
    "jobTitle": "labor",
    "idNumber": "2631189491",
    "employeeId": "68732",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-20T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a179",
    "name": "MD Robiul Islam",
    "email": "md.robiul.islam@example.com",
    "phoneNumber": "+966 50 000 0179",
    "jobTitle": "labor",
    "idNumber": "2629501038",
    "employeeId": "68743",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-20T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a180",
    "name": "Muhammad Shabir Hassan",
    "email": "muhammad.shabir.hassan@example.com",
    "phoneNumber": "+966 50 000 0180",
    "jobTitle": "labor",
    "idNumber": "OZ6808782",
    "employeeId": "N/A",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-07-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a181",
    "name": "MD Rayhan Shek",
    "email": "md.rayhan.shek@example.com",
    "phoneNumber": "+966 50 000 0181",
    "jobTitle": "labor",
    "idNumber": "2632041766",
    "employeeId": "68744",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-20T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a182",
    "name": "Zeeshan Hussain Shah",
    "email": "zeeshan.hussain.shah@example.com",
    "phoneNumber": "+966 50 000 0182",
    "jobTitle": "labor",
    "idNumber": "2636518140",
    "employeeId": "68753",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a183",
    "name": "Saefarz Ahemd",
    "email": "saefarz.ahemd@example.com",
    "phoneNumber": "+966 50 000 0183",
    "jobTitle": "labor",
    "idNumber": "X6097991",
    "employeeId": "67858",
    "dacoId": "DMM-010-9478",
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a184",
    "name": "Md Anower Sheik",
    "email": "md.anower.sheik@example.com",
    "phoneNumber": "+966 50 000 0184",
    "jobTitle": "labor",
    "idNumber": "2622199970",
    "employeeId": "68790",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a185",
    "name": "MD Mahfuz Sawker",
    "email": "md.mahfuz.sawker@example.com",
    "phoneNumber": "+966 50 000 0185",
    "jobTitle": "labor",
    "idNumber": "2628909059",
    "employeeId": "68774",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a186",
    "name": "Razibul Haque",
    "email": "razibul.haque@example.com",
    "phoneNumber": "+966 50 000 0186",
    "jobTitle": "labor",
    "idNumber": "2628079457",
    "employeeId": "68746",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a187",
    "name": "Rasel Molla",
    "email": "rasel.molla@example.com",
    "phoneNumber": "+966 50 000 0187",
    "jobTitle": "labor",
    "idNumber": "2623866262",
    "employeeId": "68781",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a188",
    "name": "Sojal Akkash",
    "email": "sojal.akkash@example.com",
    "phoneNumber": "+966 50 000 0188",
    "jobTitle": "labor",
    "idNumber": "2622316319",
    "employeeId": "68801",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-22T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a189",
    "name": "Umar Daraz Khan",
    "email": "umar.daraz.khan@example.com",
    "phoneNumber": "+966 50 000 0189",
    "jobTitle": "labor",
    "idNumber": "2589367313",
    "employeeId": "69200",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a190",
    "name": "MD Sohel Miah",
    "email": "md.sohel.miah@example.com",
    "phoneNumber": "+966 50 000 0190",
    "jobTitle": "labor",
    "idNumber": "2519950931",
    "employeeId": "68802",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Transfer Pending"
  },
  {
    "_id": "6a40b233a377d5283b7c44a191",
    "name": "Sojib haque miah",
    "email": "sojib.haque.miah@example.com",
    "phoneNumber": "+966 50 000 0191",
    "jobTitle": "labor",
    "idNumber": "2615719156",
    "employeeId": "67742",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a192",
    "name": "Muhammmad Tahir Younas",
    "email": "muhammmad.tahir.younas@example.com",
    "phoneNumber": "+966 50 000 0192",
    "jobTitle": "Technician",
    "idNumber": "2626108019",
    "employeeId": "65028",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a193",
    "name": "MD Uzzal",
    "email": "md.uzzal@example.com",
    "phoneNumber": "+966 50 000 0193",
    "jobTitle": "labor",
    "idNumber": "2631196967",
    "employeeId": "68793",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a194",
    "name": "Ismail Uddin",
    "email": "ismail.uddin@example.com",
    "phoneNumber": "+966 50 000 0194",
    "jobTitle": "labor",
    "idNumber": "2626890988",
    "employeeId": "68785",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a195",
    "name": "Mojibor Rahaman",
    "email": "mojibor.rahaman@example.com",
    "phoneNumber": "+966 50 000 0195",
    "jobTitle": "labor",
    "idNumber": "2631190846",
    "employeeId": "68735",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a196",
    "name": "Imran miah",
    "email": "imran.miah@example.com",
    "phoneNumber": "+966 50 000 0196",
    "jobTitle": "labor",
    "idNumber": "2608329096",
    "employeeId": "67743",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a197",
    "name": "Mohammad Namdim",
    "email": "mohammad.namdim@example.com",
    "phoneNumber": "+966 50 000 0197",
    "jobTitle": "labor",
    "idNumber": "2637191046",
    "employeeId": "69257",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-05-09T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a198",
    "name": "Mohammad Shahidullah",
    "email": "mohammad.shahidullah@example.com",
    "phoneNumber": "+966 50 000 0198",
    "jobTitle": "labor",
    "idNumber": "2602776177",
    "employeeId": "68794",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a199",
    "name": "MD Abu Musa",
    "email": "md.abu.musa@example.com",
    "phoneNumber": "+966 50 000 0199",
    "jobTitle": "labor",
    "idNumber": "2599721814",
    "employeeId": "68795",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a200",
    "name": "Masdur Rhaman",
    "email": "masdur.rhaman@example.com",
    "phoneNumber": "+966 50 000 0200",
    "jobTitle": "labor",
    "idNumber": "2482796352",
    "employeeId": "68537",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": "Complted"
  },
  {
    "_id": "6a40b233a377d5283b7c44a201",
    "name": "Asad Khan",
    "email": "asad.khan@example.com",
    "phoneNumber": "+966 50 000 0201",
    "jobTitle": "labor",
    "idNumber": "2549811186",
    "employeeId": "68590",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-05-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a202",
    "name": "Atif liaqt",
    "email": "atif.liaqt@example.com",
    "phoneNumber": "+966 50 000 0202",
    "jobTitle": "labor",
    "idNumber": "2628920460",
    "employeeId": "69204",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-05-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a203",
    "name": "MD Suman",
    "email": "md.suman@example.com",
    "phoneNumber": "+966 50 000 0203",
    "jobTitle": "labor",
    "idNumber": "2622835896",
    "employeeId": "68768",
    "dacoId": null,
    "group": "Irrigation",
    "joiningDate": "2026-05-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a204",
    "name": "Mohd Sakib",
    "email": "mohd.sakib@example.com",
    "phoneNumber": "+966 50 000 0204",
    "jobTitle": "labor",
    "idNumber": "I0412142",
    "employeeId": "N/A",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-06-14T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a205",
    "name": "Ali Aimuzayan",
    "email": "ali.aimuzayan@example.com",
    "phoneNumber": "+966 50 000 0205",
    "jobTitle": "Technician",
    "idNumber": "1052320213",
    "employeeId": "68151",
    "dacoId": null,
    "group": "Roads and Grounds",
    "joiningDate": "2026-07-15T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a206",
    "name": "Moneer Abdulhadi M Al Nasser",
    "email": "moneer.abdulhadi.m.al.nasser@example.com",
    "phoneNumber": "+966 50 000 0206",
    "jobTitle": "Supervisor",
    "idNumber": "1010625711",
    "employeeId": "67941",
    "dacoId": null,
    "group": "Administrative / Management",
    "joiningDate": "2026-05-01T00:00:00.000Z",
    "nationality": "Saudi",
    "companyName": "Nabatat",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a207",
    "name": "Md Nazrul Islam",
    "email": "md.nazrul.islam@example.com",
    "phoneNumber": "+966 50 000 0207",
    "jobTitle": "labor",
    "idNumber": "2591632092",
    "employeeId": "60501",
    "dacoId": "DMM-010-6393",
    "group": "Landscaping",
    "joiningDate": "2026-04-15T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a208",
    "name": "MD Manik",
    "email": "md.manik@example.com",
    "phoneNumber": "+966 50 000 0208",
    "jobTitle": "labor",
    "idNumber": "2621807839",
    "employeeId": "68752",
    "dacoId": null,
    "group": "Landscaping",
    "joiningDate": "2026-04-20T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a209",
    "name": "Rasel Mia",
    "email": "rasel.mia@example.com",
    "phoneNumber": "+966 50 000 0209",
    "jobTitle": "labor",
    "idNumber": "2613525845",
    "employeeId": "52889",
    "dacoId": null,
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a210",
    "name": "Md Delear Hosen",
    "email": "md.delear.hosen@example.com",
    "phoneNumber": "+966 50 000 0210",
    "jobTitle": "labor",
    "idNumber": "2598519292",
    "employeeId": "52888",
    "dacoId": "DMM-010-7348",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a211",
    "name": "Abul Kasem",
    "email": "abul.kasem@example.com",
    "phoneNumber": "+966 50 000 0211",
    "jobTitle": "labor",
    "idNumber": "2616610081",
    "employeeId": "52679",
    "dacoId": "DMM-010-7588",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a212",
    "name": "Kazi Majharul Islam",
    "email": "kazi.majharul.islam@example.com",
    "phoneNumber": "+966 50 000 0212",
    "jobTitle": "labor",
    "idNumber": "2623338098",
    "employeeId": "52900",
    "dacoId": "DMM-010-6920",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a213",
    "name": "MD Sohildul",
    "email": "md.sohildul@example.com",
    "phoneNumber": "+966 50 000 0213",
    "jobTitle": "labor",
    "idNumber": "2609558776",
    "employeeId": "52617",
    "dacoId": "DMM-010-6979",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a214",
    "name": "Osman Gani",
    "email": "osman.gani@example.com",
    "phoneNumber": "+966 50 000 0214",
    "jobTitle": "labor",
    "idNumber": "2617410143",
    "employeeId": "52680",
    "dacoId": "DMM-010-7445",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a215",
    "name": "Md Tuhin Miah",
    "email": "md.tuhin.miah@example.com",
    "phoneNumber": "+966 50 000 0215",
    "jobTitle": "labor",
    "idNumber": "2613529888",
    "employeeId": "69211",
    "dacoId": "DMM-010-6921",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a216",
    "name": "Md Shamin Hossain",
    "email": "md.shamin.hossain@example.com",
    "phoneNumber": "+966 50 000 0216",
    "jobTitle": "labor",
    "idNumber": "2621517172",
    "employeeId": "52895",
    "dacoId": "DMM-010-7117",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a217",
    "name": "Shawon Joynal Miah",
    "email": "shawon.joynal.miah@example.com",
    "phoneNumber": "+966 50 000 0217",
    "jobTitle": "labor",
    "idNumber": "2600988691",
    "employeeId": "52887",
    "dacoId": "DMM-010-6922",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a218",
    "name": "Md Bayzid",
    "email": "md.bayzid@example.com",
    "phoneNumber": "+966 50 000 0218",
    "jobTitle": "labor",
    "idNumber": "2605965405",
    "employeeId": "52899",
    "dacoId": "DMM-010-7346",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a219",
    "name": "Md Obaidul Haque",
    "email": "md.obaidul.haque@example.com",
    "phoneNumber": "+966 50 000 0219",
    "jobTitle": "labor",
    "idNumber": "2601066596",
    "employeeId": "52892",
    "dacoId": "DMM-010-7347",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a220",
    "name": "Solaiman Molla",
    "email": "solaiman.molla@example.com",
    "phoneNumber": "+966 50 000 0220",
    "jobTitle": "labor",
    "idNumber": "2627727072",
    "employeeId": "52893",
    "dacoId": null,
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a221",
    "name": "Amro Amin",
    "email": "amro.amin@example.com",
    "phoneNumber": "+966 50 000 0221",
    "jobTitle": "labor",
    "idNumber": "2551812098",
    "employeeId": "49603",
    "dacoId": "DMM-010-6253",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Egyptian",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a222",
    "name": "Muhammad Jamal Khalid",
    "email": "muhammad.jamal.khalid@example.com",
    "phoneNumber": "+966 50 000 0222",
    "jobTitle": "labor",
    "idNumber": "2588521498",
    "employeeId": "49601",
    "dacoId": "DMM-010-6919",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Pakistani",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a223",
    "name": "Md Rana Miah",
    "email": "md.rana.miah@example.com",
    "phoneNumber": "+966 50 000 0223",
    "jobTitle": "labor",
    "idNumber": "2622865711",
    "employeeId": "52809",
    "dacoId": "DMM-010-6923",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a224",
    "name": "Deepak Kumar Sitak Singh",
    "email": "deepak.kumar.sitak.singh@example.com",
    "phoneNumber": "+966 50 000 0224",
    "jobTitle": "labor",
    "idNumber": "2598689442",
    "employeeId": "N/A",
    "dacoId": "DMM-010-7448",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a225",
    "name": "Amarjeet Singh",
    "email": "amarjeet.singh@example.com",
    "phoneNumber": "+966 50 000 0225",
    "jobTitle": "labor",
    "idNumber": "2598689186",
    "employeeId": "69212",
    "dacoId": "DMM-010-7444",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a226",
    "name": "Sujon Mia",
    "email": "sujon.mia@example.com",
    "phoneNumber": "+966 50 000 0226",
    "jobTitle": "labor",
    "idNumber": "2471809810",
    "employeeId": "52850",
    "dacoId": null,
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Bangladeshi",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a227",
    "name": "Pawan Shreeram",
    "email": "pawan.shreeram@example.com",
    "phoneNumber": "+966 50 000 0227",
    "jobTitle": "labor",
    "idNumber": "2586471076",
    "employeeId": "52849",
    "dacoId": "DMM-010-6263",
    "group": "Ecopower",
    "joiningDate": "2026-04-01T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a228",
    "name": "Abdul Razzak",
    "email": "abdul.razzak@example.com",
    "phoneNumber": "+966 50 000 0228",
    "jobTitle": "labor",
    "idNumber": "2591104647",
    "employeeId": "52285",
    "dacoId": "DMM-010-6240",
    "group": "Ecopower",
    "joiningDate": "2026-06-08T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  },
  {
    "_id": "6a40b233a377d5283b7c44a229",
    "name": "MD Hossain",
    "email": "md.hossain@example.com",
    "phoneNumber": "+966 50 000 0229",
    "jobTitle": "labor",
    "idNumber": "2504247822",
    "employeeId": "N/A",
    "dacoId": null,
    "group": "Ecopower",
    "joiningDate": "2026-06-08T00:00:00.000Z",
    "nationality": "Indian",
    "companyName": "Safari",
    "status": "ACTIVE",
    "remark": ""
  }

]

const statusBadge: Record<string, string> = {
  ACTIVE:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  ON_LEAVE:
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  TERMINATED:
    "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20",
  INACTIVE:
    "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

const statusFilterOptions: FilterOption[] = [
  { label: "Active", value: "ACTIVE" },
  { label: "On Leave", value: "ON_LEAVE" },
  { label: "Terminated", value: "TERMINATED" },
  { label: "Inactive", value: "INACTIVE" },
];

export default function Employees() {
  const canEdit = true;
  const [employees, setEmployees] = useState<MockEmployee[]>(MOCK_DATA);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<MockEmployee | null>(
    null
  );

  const [form, setForm] = useState<Partial<MockEmployee>>({
    name: "",
    email: "",
    phoneNumber: "",
    jobTitle: "labor",
    employeeId: "",
    idNumber: "",
    dacoId: "",
    group: "Landscaping",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "ACTIVE",
    workLocation: "",
    remark: "",
  });

  // Extract unique departments/groups
  const groupOptions = useMemo(() => {
    const uniqueGroups = Array.from(
      new Set(employees.map((e) => e.group).filter(Boolean))
    );
    return uniqueGroups.map((g) => ({ label: g, value: g }));
  }, [employees]);

  // Extract unique positions/job titles
  const positionOptions = useMemo(() => {
    const uniquePositions = Array.from(
      new Set(employees.map((e) => e.jobTitle).filter(Boolean))
    );
    return uniquePositions.map((p) => ({ label: p, value: p }));
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const q = search.toLowerCase();
      const matchSearch =
        e.name.toLowerCase().includes(q) ||
        (e.email && e.email.toLowerCase().includes(q)) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.idNumber.includes(q) ||
        (e.dacoId && e.dacoId.toLowerCase().includes(q)) ||
        e.jobTitle.toLowerCase().includes(q) ||
        e.group.toLowerCase().includes(q) ||
        e.companyName.toLowerCase().includes(q);

      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      const matchGroup = groupFilter === "all" || e.group === groupFilter;
      const matchPosition =
        positionFilter === "all" || e.jobTitle === positionFilter;

      return matchSearch && matchStatus && matchGroup && matchPosition;
    });
  }, [employees, search, statusFilter, groupFilter, positionFilter]);

  const paginated = useMemo(() => {
    if (pageSize === 0) return filtered;
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  const openAdd = () => {
    setEditingEmployee(null);
    setForm({
      name: "",
      email: "",
      phoneNumber: "",
      jobTitle: "labor",
      employeeId: "",
      idNumber: "",
      dacoId: "",
      group: "Landscaping",
      nationality: "Bangladeshi",
      companyName: "Nabatat",
      status: "ACTIVE",
      workLocation: "",
      remark: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (emp: MockEmployee) => {
    setEditingEmployee(emp);
    setForm({ ...emp });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name?.trim() || !form.employeeId?.trim()) {
      toast.error("Name and Employee ID are required");
      return;
    }

    if (editingEmployee) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp._id === editingEmployee._id
            ? ({
                ...emp,
                ...form,
                updatedAt: new Date().toISOString(),
              } as MockEmployee)
            : emp
        )
      );
      toast.success("Employee updated successfully");
    } else {
      const newEmp: MockEmployee = {
        ...(form as MockEmployee),
        _id: String(Date.now()),
        joiningDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEmployees((prev) => [newEmp, ...prev]);
      toast.success("Employee added successfully");
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp._id !== id));
    toast.success("Employee record deleted");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((e) => ({
        "Employee ID": e.employeeId,
        "ID/Iqama": e.idNumber,
        "DACO ID": e.dacoId || "",
        Name: e.name,
        Email: e.email || "",
        Phone: e.phoneNumber || "",
        Position: e.jobTitle,
        Department: e.group,
        Company: e.companyName,
        Nationality: e.nationality,
        Status: e.status,
        Remark: e.remark || "",
        "Joining Date": e.joiningDate
          ? new Date(e.joiningDate).toLocaleDateString()
          : "",
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "employees_list.xlsx");
    toast.success("Excel sheet downloaded");
  };

  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(15);
    doc.text("Employee Directory Report", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [
        [
          "Emp ID",
          "ID/Iqama",
          "DACO ID",
          "Name",
          "Position",
          "Department",
          "Company",
          "Status",
          "Remark",
        ],
      ],
      body: filtered.map((e) => [
        e.employeeId,
        e.idNumber,
        e.dacoId || "—",
        e.name,
        e.jobTitle,
        e.group,
        e.companyName,
        e.status,
        e.remark || "—",
      ]),
      styles: { fontSize: 8 },
    });
    doc.save("employees_report.pdf");
    toast.success("PDF report downloaded");
  };

  const columns: Column<MockEmployee>[] = [
    {
      key: "sr",
      label: "#",
      render: (_r, i) => (
        <span className="text-xs text-muted-foreground font-mono">
          {pageSize === 0 ? i + 1 : (page - 1) * pageSize + i + 1}
        </span>
      ),
    },
    {
      key: "employeeId",
      label: "Emp ID / Iqama",
      render: (emp) => (
        <div>
          <p className="font-semibold text-xs text-primary">{emp.employeeId}</p>
          <p className="text-[11px] text-muted-foreground font-mono">
            {emp.idNumber}
          </p>
        </div>
      ),
    },
    {
      key: "name",
      label: "Employee",
      render: (emp) => (
        <div className="flex items-center gap-2.5 min-w-[170px]">
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-xs border border-primary/20">
            {emp.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <p className="font-medium text-xs leading-none text-foreground">
              {emp.name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-1">
              {emp.email || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "jobTitle",
      label: "Position / Role",
      render: (emp) => (
        <div className="flex items-center gap-1.5 min-w-[130px]">
          <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-semibold text-foreground bg-accent/50 px-2 py-0.5 rounded-md border border-accent">
            {emp.jobTitle}
          </span>
        </div>
      ),
    },
    {
      key: "group",
      label: "Department",
      render: (emp) => (
        <div className="min-w-[130px]">
          <p className="text-xs font-medium text-foreground">{emp.group}</p>
        </div>
      ),
    },
    {
      key: "companyName",
      label: "Company",
      render: (emp) => (
        <div className="flex items-center gap-1.5 min-w-[120px]">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium">{emp.companyName}</span>
        </div>
      ),
    },
    {
      key: "nationality",
      label: "Nationality",
      render: (emp) => (
        <span className="text-xs font-medium">{emp.nationality}</span>
      ),
    },
    {
      key: "remark",
      label: "Remark",
      render: (emp) => (
        <span className="text-xs text-muted-foreground italic truncate max-w-[140px] block">
          {emp.remark || "—"}
        </span>
      ),
    },
    {
      key: "joiningDate",
      label: "Joining Date",
      render: (emp) => (
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {emp.joiningDate
            ? new Date(emp.joiningDate).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (emp) => (
        <span
          className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold inline-block text-center ${
            statusBadge[emp.status] || "bg-slate-100 text-slate-700"
          }`}
        >
          {emp.status}
        </span>
      ),
    },
    ...(canEdit
      ? ([
          {
            key: "actions",
            label: "Actions",
            className:
              "text-right sticky right-0 bg-background/95 backdrop-blur-sm z-10",
            render: (emp: MockEmployee) => (
              <div
                className="flex items-center justify-end gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => openEdit(emp)}
                  className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(emp._id)}
                  className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ),
          },
        ] as Column<MockEmployee>[])
      : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 p-4 md:p-6"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Employee Directory
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {filtered.length}
            </span>{" "}
            recorded employees
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 border rounded-xl shadow-sm">
        {/* Rows Per Page */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="0">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filters Section */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Position Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              Position:
            </span>
            <Select
              value={positionFilter}
              onValueChange={(v) => {
                setPositionFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs w-[160px]">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {positionOptions.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              Department:
            </span>
            <Select
              value={groupFilter}
              onValueChange={(v) => {
                setGroupFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs w-[170px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {groupOptions.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="border rounded-xl shadow-sm bg-card overflow-hidden">
        <div className="w-full overflow-x-auto">
          <DataTable<MockEmployee>
            data={paginated}
            columns={columns}
            rowKey={(e) => e._id}
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="Search Name, ID, Iqama, Position, Group..."
            filterValue={statusFilter}
            onFilterChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
            filterOptions={statusFilterOptions}
            filterPlaceholder="All Statuses"
            page={page}
            pageSize={pageSize === 0 ? filtered.length || 1 : pageSize}
            total={filtered.length}
            onPageChange={setPage}
            emptyMessage="No matching employee records found"
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportExcel}
                  className="h-8 text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportPDF}
                  className="h-8 text-xs"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> PDF
                </Button>
                {canEdit && (
                  <Button
                    size="sm"
                    onClick={openAdd}
                    className="h-8 text-xs bg-primary"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Employee
                  </Button>
                )}
              </div>
            }
          />
        </div>
      </div>

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "Edit Employee Record" : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Full Name *
                </label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Shafiqul Islam"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Email
                </label>
                <Input
                  value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  type="email"
                  placeholder="shafiqul@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Employee ID *
                </label>
                <Input
                  value={form.employeeId || ""}
                  onChange={(e) =>
                    setForm({ ...form, employeeId: e.target.value })
                  }
                  placeholder="68567"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  ID / Iqama Number
                </label>
                <Input
                  value={form.idNumber || ""}
                  onChange={(e) =>
                    setForm({ ...form, idNumber: e.target.value })
                  }
                  placeholder="2231024064"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  DACO ID
                </label>
                <Input
                  value={form.dacoId || ""}
                  onChange={(e) => setForm({ ...form, dacoId: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Position / Job Title
                </label>
                <Input
                  value={form.jobTitle || ""}
                  onChange={(e) =>
                    setForm({ ...form, jobTitle: e.target.value })
                  }
                  placeholder="e.g. DRIVER HD, Technician, labor"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Department / Group
                </label>
                <Input
                  value={form.group || ""}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                  placeholder="e.g. Landscaping, Irrigation"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Company Name
                </label>
                <Input
                  value={form.companyName || ""}
                  onChange={(e) =>
                    setForm({ ...form, companyName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Phone Number
                </label>
                <Input
                  value={form.phoneNumber || ""}
                  onChange={(e) =>
                    setForm({ ...form, phoneNumber: e.target.value })
                  }
                  placeholder="+966 50 000 0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Nationality
                </label>
                <Input
                  value={form.nationality || ""}
                  onChange={(e) =>
                    setForm({ ...form, nationality: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Work Location
                </label>
                <Input
                  value={form.workLocation || ""}
                  onChange={(e) =>
                    setForm({ ...form, workLocation: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Status
                </label>
                <Select
                  value={form.status || "ACTIVE"}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="ON_LEAVE">ON_LEAVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                    <SelectItem value="TERMINATED">TERMINATED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="font-medium text-muted-foreground mb-1 block">
                Remark
              </label>
              <Input
                value={form.remark || ""}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                placeholder="Optional remark..."
              />
            </div>

            <Button onClick={handleSave} className="w-full mt-3 bg-primary">
              <UserCheck className="h-4 w-4 mr-1.5" />
              {editingEmployee ? "Update Employee" : "Save Employee"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
