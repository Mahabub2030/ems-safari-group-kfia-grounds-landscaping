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
  Building2,
  Download,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export interface MockDocumentExpiry {
  slNo: number;
  name: string;
  email?: string;
  status: string;
  employeeId: string;
  designation: string;
  idNumber: string; // Iqama / National ID
  dacoId?: string;
  group: string;
  companyName: string;
  iqamaExpiryDate?: string; // ISO String YYYY-MM-DD or Hijri string
  dacoExpiryDate?: string; // ISO String YYYY-MM-DD
  workLocation?: string;
  nationality: string;
  remark?: string;
  medicalInsurance?: string;
}

const MOCK_EXPIRY_DATA: MockDocumentExpiry[] = [
  {
    slNo: 4,
    name: "Afrazier Nassal",
    designation: "Engineer",
    idNumber: "2483842916",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68168",
    dacoId: "",
    group: "Administrative / Management",
    dacoExpiryDate: "2000-01-07",
    nationality: "Filipino",
    companyName: "Nabatat",
  },
  {
    slNo: 5,
    name: "Alex Garcia Garcia",
    designation: "Engineer",
    idNumber: "2489688859",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "67620",
    dacoId: "",
    group: "Administrative / Management",
    dacoExpiryDate: "2026-04-01",
    nationality: "Filipino",
    companyName: "Nabatat",
  },
  {
    slNo: 6,
    name: "Sher Shah",
    designation: "Administrator",
    idNumber: "2443400342",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "65947",
    dacoId: "",
    group: "Administrative / Management",
    dacoExpiryDate: "2026-04-01",
    nationality: "Pakistani",
    companyName: "Nabatat",
  },
  {
    slNo: 7,
    name: "Mahabub Alam",
    designation: "Administrator",
    idNumber: "2515496525",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "67592",
    dacoId: "DMM-011-0266",
    group: "Administrative / Management",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 8,
    name: "Assauduzamman",
    designation: "Supervisor",
    idNumber: "2237075912",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "65959",
    dacoId: "DMM-010-9406",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 9,
    name: "Antonio Jr Enario",
    designation: "Supervisor",
    idNumber: "2393912742",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "67951",
    dacoId: "",
    group: "Nursery",
    dacoExpiryDate: "2026-04-01",
    nationality: "Filipino",
    companyName: "Nabatat",
  },
  {
    slNo: 10,
    name: "Mohamad Jinnat",
    designation: "Supervisor",
    idNumber: "2182413589",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "67630",
    dacoId: "",
    group: "Nursery",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 11,
    name: "ALAMIN MIAH",
    designation: "Supervisor",
    idNumber: "2496398013",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "67623",
    dacoId: "",
    group: "Street light",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 12,
    name: "BAKIR RIFAEY",
    designation: "Supervisor",
    idNumber: "2253768424",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "67918",
    dacoId: "DMM-010-9427",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-01",
    nationality: "Egyptian",
    companyName: "Nabatat",
  },
  {
    slNo: 13,
    name: "IMRAN SABJI FAROSH",
    designation: "Supervisor",
    idNumber: "2251498545",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "67566",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    companyName: "Nabatat",
  },
  {
    slNo: 14,
    name: "Saeed Ahmed Hkohar",
    designation: "Supervisor",
    idNumber: "2364018263",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68507",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-01",
    nationality: "Pakistani",
    companyName: "Nabatat",
  },
  {
    slNo: 15,
    name: "YAZAN ABU OBAYD",
    designation: "Supervisor",
    idNumber: "2117833687",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68508",
    dacoId: "",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-01",
    nationality: "Jordanian",
    companyName: "Nabatat",
  },
  {
    slNo: 16,
    name: "MD JOYNAL",
    designation: "Technician",
    idNumber: "2523627400",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "67356",
    dacoId: "",
    group: "Nursery",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 17,
    name: "ABDUL SALAM",
    designation: "Technician",
    idNumber: "2312904465",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "65577",
    dacoId: "DMM-011-0625",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    companyName: "Nabatat",
  },
  {
    slNo: 18,
    name: "Mohhamad Hasan ali Abarar",
    designation: "Supervisor",
    idNumber: "AB045647",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68568",
    dacoId: "",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-15",
    nationality: "Indian",
    companyName: "Nabatat",
  },
  {
    slNo: 19,
    name: "SALAH UDDIN CHOWDRY",
    designation: "Supervisor",
    idNumber: "2495724003",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68574",
    dacoId: "",
    group: "Pest Control",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 20,
    name: "Hridoy Miah",
    designation: "DRIVER HD",
    idNumber: "2476545252",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68563",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 21,
    name: "Adil Mohammed Habib",
    designation: "DRIVER HD",
    idNumber: "2526223470",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68564",
    dacoId: "",
    group: "Street light",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    companyName: "Nabatat",
  },
  {
    slNo: 22,
    name: "BILLAL",
    designation: "DRIVER HD",
    idNumber: "2182500070",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68565",
    dacoId: "",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 23,
    name: "MONAYEM HOSSAN",
    designation: "DRIVER HD",
    idNumber: "2493550483",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68566",
    dacoId: "",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 24,
    name: "Shafiqul Islam",
    designation: "DRIVER HD",
    idNumber: "2231024064",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68567",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 25,
    name: "KOBIR ALI",
    designation: "DRIVER HD",
    idNumber: "2495831253",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68571",
    dacoId: "",
    group: "Nursery",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 26,
    name: "Shadat Hossan",
    designation: "DRIVER HD",
    idNumber: "2234812275",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68572",
    dacoId: "",
    group: "Nursery",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 27,
    name: "Sonam Pashang",
    designation: "Technician",
    idNumber: "2363702099",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68578",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-01",
    nationality: "Nepali",
    companyName: "Nabatat",
  },
  {
    slNo: 28,
    name: "Mohammad Safi Idris",
    designation: "Technician",
    idNumber: "2510919437",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68573",
    dacoId: "",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-15",
    nationality: "Sudani",
    companyName: "Nabatat",
  },
  {
    slNo: 29,
    name: "Muhammad Wasid Sayed",
    designation: "Technician",
    idNumber: "2383739907",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68569",
    dacoId: "",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-15",
    nationality: "Indian",
    companyName: "Nabatat",
  },
  {
    slNo: 30,
    name: "MD Sohag",
    designation: "labor",
    idNumber: "2523266126",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "67490",
    dacoId: "",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 31,
    name: "MOHAMMED MUSLIM",
    designation: "labor",
    idNumber: "2255145613",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68576",
    dacoId: "",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-15",
    nationality: "Indian",
    companyName: "Nabatat",
  },
  {
    slNo: 32,
    name: "Gufran Warish Ali Kureshi",
    designation: "labor",
    idNumber: "2568659672",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68541",
    dacoId: "",
    group: "Fleet Management",
    dacoExpiryDate: "2026-04-15",
    nationality: "Indian",
    companyName: "Nabatat",
  },
  {
    slNo: 33,
    name: "Harun Mohammad",
    designation: "labor",
    idNumber: "2516224769",
    iqamaExpiryDate: "",
    status: "Active",
    medicalInsurance: "",
    employeeId: "68542",
    dacoId: "",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
  },
  {
    slNo: 34,
    name: "Shahbaz Khan Banaras Khan",
    designation: "labor",
    idNumber: "2345076778",
    employeeId: "68543",
    dacoId: "",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-15",
    nationality: "Pakistani",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 35,
    name: "Coyle Kay",
    designation: "labor",
    idNumber: "2396566198",
    employeeId: "68544",
    dacoId: "",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-15",
    nationality: "Nepali",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 36,
    name: "Mofiz Nayeb Ali",
    designation: "labor",
    idNumber: "2237076050",
    employeeId: "68545",
    dacoId: "",
    group: "Nursery",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 37,
    name: "Shukur Mohd Ali",
    designation: "labor",
    idNumber: "2237074196",
    employeeId: "68546",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 38,
    name: "Sirajul Islam",
    designation: "labor",
    idNumber: "2488997889",
    employeeId: "68547",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 39,
    name: "Amir Hossain",
    designation: "labor",
    idNumber: "2508658503",
    employeeId: "68549",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 40,
    name: "MAZIBUR RAHMAN",
    designation: "labor",
    idNumber: "2495728608",
    employeeId: "68560",
    dacoId: "",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 41,
    name: "SIFAT DEWAN",
    designation: "labor",
    idNumber: "2547451399",
    employeeId: "68561",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 42,
    name: "ASHARFUL ISLAM",
    designation: "labor",
    idNumber: "2547721387",
    employeeId: "68570",
    dacoId: "",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 43,
    name: "Masom",
    designation: "labor",
    idNumber: "2495729275",
    employeeId: "67492",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 44,
    name: "MD.Firoz Ali",
    designation: "labor",
    idNumber: "2509642860",
    employeeId: "68577",
    dacoId: "",
    group: "Nursery",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 45,
    name: "Abu Kamal",
    designation: "labor",
    idNumber: "2509143570",
    employeeId: "68548",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 46,
    name: "Azizul Haque",
    designation: "labor",
    idNumber: "2508426216",
    employeeId: "68550",
    dacoId: "",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 47,
    name: "Khalilur Rahman",
    designation: "labor",
    idNumber: "2509443277",
    employeeId: "68551",
    dacoId: "",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 48,
    name: "MD MOSTAFA KAMAL",
    designation: "labor",
    idNumber: "2515581342",
    employeeId: "68552",
    dacoId: "",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 49,
    name: "MOHAMMAD FARUQ AHMED",
    designation: "labor",
    idNumber: "2515192462",
    employeeId: "68553",
    dacoId: "",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 50,
    name: "MD FARUQ MIAH",
    designation: "labor",
    idNumber: "2507667182",
    employeeId: "68554",
    dacoId: "",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 51,
    name: "Rafiq Robiul",
    designation: "labor",
    idNumber: "2556727580",
    employeeId: "68555",
    dacoId: "",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 52,
    name: "RANA ABDUL GAFUR",
    designation: "labor",
    idNumber: "2518057126",
    employeeId: "68556",
    dacoId: "",
    group: "Fleet Management",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 53,
    name: "SADDAM HOSSAIN",
    designation: "labor",
    idNumber: "2515706832",
    employeeId: "68557",
    dacoId: "",
    group: "Fleet Management",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 54,
    name: "Shorov Miah",
    designation: "labor",
    idNumber: "2497311643",
    employeeId: "68559",
    dacoId: "",
    group: "Fleet Management",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 55,
    name: "Main Uddin",
    designation: "labor",
    idNumber: "2514099734",
    employeeId: "68562",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 56,
    name: "Danilo Revila",
    designation: "Technician",
    idNumber: "2270349554",
    employeeId: "68073",
    dacoId: "DMM-011-0454",
    group: "Fleet Management",
    dacoExpiryDate: "2026-04-01",
    nationality: "Filipino",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 57,
    name: "Robert morales",
    designation: "Technician",
    idNumber: "2259560106",
    employeeId: "68074",
    dacoId: "",
    group: "Nursery",
    dacoExpiryDate: "2026-04-01",
    nationality: "Filipino",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 58,
    name: "Shafioue Hossain",
    designation: "Technician",
    idNumber: "2184317804",
    employeeId: "67634",
    dacoId: "",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 59,
    name: "Javed Fateh Muhammad",
    designation: "Technician",
    idNumber: "2334029580",
    employeeId: "68090",
    dacoId: "DMM-011-0286",
    group: "Landscaping",
    dacoExpiryDate: "2026-04-01",
    nationality: "Pakistani",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 60,
    name: "Abdul Jabbar Mohammad",
    designation: "Technician",
    idNumber: "2381603584",
    employeeId: "68509",
    dacoId: "",
    group: "Roads and Grounds",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 61,
    name: "ZAKEER HUSSAIN",
    designation: "Technician",
    idNumber: "2397587276",
    employeeId: "65960",
    dacoId: "DMM-011-0522",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 62,
    name: "Mohammad Aslam Mohammad Juhar",
    designation: "Technician",
    idNumber: "2338250380",
    employeeId: "67728",
    dacoId: "DMM-011-0510",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 63,
    name: "Julio Jr Corpuz Doria",
    designation: "Technician",
    idNumber: "2272779600",
    employeeId: "67723",
    dacoId: "",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-01",
    nationality: "Filipino",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 64,
    name: "MOHAMMAD LUQMAN",
    designation: "Technician",
    idNumber: "2268099096",
    employeeId: "65651",
    dacoId: "DMM-010-9675",
    group: "Irrigation",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    companyName: "Nabatat",
    status: "Active",
    iqamaExpiryDate: "",
    medicalInsurance: "",
  },
  {
    slNo: 65,
    name: "Mir Muhammad Ali Syed",
    status: "Active",
    employeeId: "67752",
    designation: "Technician",
    idNumber: "2527652719",
    dacoId: "",
    group: "Fleet Management",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    medicalInsurance: "",
  },
  {
    slNo: 66,
    name: "ABDELMAGED MOHAMED",
    status: "Active",
    employeeId: "65914",
    designation: "Technician",
    idNumber: "2530838354",
    dacoId: "DMM-011-0282",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Egyptian",
    medicalInsurance: "",
  },
  {
    slNo: 67,
    name: "ARNULFO LAURON",
    status: "Active",
    employeeId: "67549",
    designation: "Technician",
    idNumber: "2268207699",
    dacoId: "DMM-011-0504",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Filipino",
    medicalInsurance: "",
  },
  {
    slNo: 68,
    name: "MD MOHAMMADOL HASAN",
    status: "Active",
    employeeId: "65917",
    designation: "Technician",
    idNumber: "2495831188",
    dacoId: "",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 69,
    name: "MD Mahfoz Miah",
    status: "Active",
    employeeId: "67641",
    designation: "Technician",
    idNumber: "2589026653",
    dacoId: "",
    group: "Street light",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 70,
    name: "Bipal Mondal Madan",
    status: "Active",
    employeeId: "67044",
    designation: "Technician",
    idNumber: "2424962989",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    medicalInsurance: "",
  },
  {
    slNo: 71,
    name: "DALWAR UDDIN",
    status: "Active",
    employeeId: "65553",
    designation: "Technician",
    idNumber: "2195631219",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 72,
    name: "Ahsan Ulla Moksed Ali",
    status: "Active",
    employeeId: "65948",
    designation: "Technician",
    idNumber: "2182562435",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 73,
    name: "Muhammmad Nasir Abdelmadgid",
    status: "Active",
    employeeId: "67834",
    designation: "Technician",
    idNumber: "2571230149",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Egyptian",
    medicalInsurance: "",
  },
  {
    slNo: 74,
    name: "Moustafa Kamel",
    status: "Active",
    employeeId: "68820",
    designation: "Technician",
    idNumber: "2470358843",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Egyptian",
    medicalInsurance: "",
  },
  {
    slNo: 75,
    name: "NURE ALAM",
    status: "Active",
    employeeId: "68154",
    designation: "labor",
    idNumber: "2495724110",
    dacoId: "DMM-011-0291",
    group: "Street light",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 76,
    name: "MD RAKIBUL",
    status: "Active",
    employeeId: "62561",
    designation: "labor",
    idNumber: "2601438373",
    dacoId: "",
    group: "Street light",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-05-13",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 77,
    name: "MOHAMMAD ALAMIN MIAH",
    status: "Active",
    employeeId: "65559",
    designation: "labor",
    idNumber: "2484839572",
    dacoId: "DMM-011-0517",
    group: "Irrigation",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 78,
    name: "MANNAN PRODHAN",
    status: "Active",
    employeeId: "65558",
    designation: "labor",
    idNumber: "2495724227",
    dacoId: "DMM-010-9420",
    group: "Irrigation",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 79,
    name: "Habibur Rohman",
    status: "Active",
    employeeId: "67464",
    designation: "labor",
    idNumber: "2555932330",
    dacoId: "",
    group: "Fleet Management",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 80,
    name: "Kazi Menhaj Ahmed",
    status: "Active",
    employeeId: "29643",
    designation: "Supervisor",
    idNumber: "2150142210",
    dacoId: "",
    group: "Fleet Management",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    medicalInsurance: "",
  },
  {
    slNo: 81,
    name: "Sathish Kumar",
    status: "Active",
    employeeId: "29547",
    designation: "labor",
    idNumber: "2090958691",
    dacoId: "",
    group: "Fleet Management",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    medicalInsurance: "",
  },
  {
    slNo: 82,
    name: "Azam Khan Shabbir",
    status: "Active",
    employeeId: "2755",
    designation: "labor",
    idNumber: "2231109204",
    dacoId: "",
    group: "Fleet Management",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    medicalInsurance: "",
  },
  {
    slNo: 83,
    name: "Mohammad Alauddin Awawar Ali",
    status: "Active",
    employeeId: "67920",
    designation: "labor",
    idNumber: "2636524171",
    dacoId: "DMM-011-6380",
    group: "Fleet Management",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-05-01",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 84,
    name: "MATHAI K.K.",
    status: "Active",
    employeeId: "29623",
    designation: "labor",
    idNumber: "2064697911",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 85,
    name: "MOHAMMAD JAVEED",
    status: "Active",
    employeeId: "67819",
    designation: "labor",
    idNumber: "2633482894",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 86,
    name: "AMIT KUMAR",
    status: "Active",
    employeeId: "67840",
    designation: "labor",
    idNumber: "2636512499",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 87,
    name: "MOHAMMAD ASIF KHAN",
    status: "Emergency Vacation",
    employeeId: "67828",
    designation: "labor",
    idNumber: "2633479940",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 88,
    name: "MOHAMMAD ALI SHERI",
    status: "Active",
    employeeId: "67818",
    designation: "labor",
    idNumber: "2634519484",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 89,
    name: "MOHAMMAD RIZWAN",
    status: "Active",
    employeeId: "67595",
    designation: "labor",
    idNumber: "2269027336",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 90,
    name: "RAMDAS",
    status: "Active",
    employeeId: "67536",
    designation: "labor",
    idNumber: "2293717423",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 91,
    name: "FIROZ ALAM MOFIZ",
    status: "Active",
    employeeId: "65551",
    designation: "labor",
    idNumber: "2495870822",
    dacoId: "",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 92,
    name: "MD Mukles",
    status: "Active",
    employeeId: "67491",
    designation: "labor",
    idNumber: "2549825939",
    dacoId: "",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 93,
    name: "Fahad Mia",
    status: "Active",
    employeeId: "67643",
    designation: "Labor",
    idNumber: "2531962963",
    dacoId: "",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 94,
    name: "Lal Miah Messer",
    status: "Active",
    employeeId: "67753",
    designation: "Technician",
    idNumber: "2237342916",
    dacoId: "",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 95,
    name: "Imamul",
    status: "Active",
    employeeId: "67463",
    designation: "Labor",
    idNumber: "2508426612",
    dacoId: "DMM-011-0502",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 96,
    name: "Salim",
    status: "Active",
    employeeId: "67479",
    designation: "Labor",
    idNumber: "2508433832",
    dacoId: "DMM-011-0446",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 97,
    name: "MD HOSSAIN",
    status: "Active",
    employeeId: "65578",
    designation: "labor",
    idNumber: "2495831162",
    dacoId: "DMM-011-1200",
    group: "Street light",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 98,
    name: "ABUL HOSSAIN",
    status: "Active",
    employeeId: "65576",
    designation: "Labor",
    idNumber: "2518057142",
    dacoId: "DMM-011-1313",
    group: "Street light",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 99,
    name: "Robiul",
    status: "Active",
    employeeId: "67551",
    designation: "Labor",
    idNumber: "2495725018",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-25",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 100,
    name: "Ahsan Bundu",
    status: "Active",
    employeeId: "67365",
    designation: "labor",
    idNumber: "2545542009",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    medicalInsurance: "",
  },
  {
    slNo: 101,
    name: "IRSHAD AHMAD",
    status: "Active",
    employeeId: "67462",
    designation: "labor",
    idNumber: "2547944518",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 102,
    name: "Qadis Shakeel",
    status: "Active",
    employeeId: "67869",
    designation: "labor",
    idNumber: "2633479593",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-20",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 103,
    name: "Shankar Krishnappa",
    status: "Active",
    employeeId: "67931",
    designation: "labor",
    idNumber: "263522639",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-20",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 104,
    name: "Mohammed mosim",
    status: "Active",
    employeeId: "67855",
    designation: "labor",
    idNumber: "2636524395",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-20",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 105,
    name: "Ghulam Qaiser",
    status: "Active",
    employeeId: "68503",
    designation: "labor",
    idNumber: "BV4911123",
    dacoId: "DMM-010-8410",
    group: "Irrigation",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-20",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 106,
    name: "MD Roky Hossin",
    status: "Active",
    employeeId: "67042",
    designation: "labor",
    idNumber: "2495729028",
    dacoId: "",
    group: "Pest Control",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 107,
    name: "Mojammel Hossain Saikat",
    status: "Active",
    employeeId: "66974",
    designation: "labor",
    idNumber: "A20139723",
    dacoId: "DMM-010-8383",
    group: "Irrigation",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 108,
    name: "Saiful Md Jafor",
    status: "Active",
    employeeId: "67394",
    designation: "labor",
    idNumber: "2521601324",
    dacoId: "DMM-011-0511",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 109,
    name: "Razib Bepery",
    status: "Active",
    employeeId: "67354",
    designation: "labor",
    idNumber: "2507724652",
    dacoId: "",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 110,
    name: "MD Jakir Hossen",
    status: "Active",
    employeeId: "67041",
    designation: "labor",
    idNumber: "2523931562",
    dacoId: "DMM-011-0501",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 111,
    name: "Mohammad Alamin Mia",
    status: "Active",
    employeeId: "67466",
    designation: "labor",
    idNumber: "2510120526",
    dacoId: "",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 112,
    name: "Salim Siddiqur",
    status: "Active",
    employeeId: "67353",
    designation: "labor",
    idNumber: "2494139062",
    dacoId: "",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 113,
    name: "MD Sohag Mia",
    status: "Active",
    employeeId: "67407",
    designation: "labor",
    idNumber: "2498313234",
    dacoId: "",
    group: "Nursery",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 114,
    name: "Jomsid Ali",
    status: "Active",
    employeeId: "68769",
    designation: "labor",
    idNumber: "2596861993",
    dacoId: "",
    group: "Nursery",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 115,
    name: "Md Assadullah",
    status: "Active",
    employeeId: "68755",
    designation: "labor",
    idNumber: "2628025633",
    dacoId: "",
    group: "Nursery",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 116,
    name: "Md Hiro Mia",
    status: "Active",
    employeeId: "68756",
    designation: "labor",
    idNumber: "2629001708",
    dacoId: "",
    group: "Nursery",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 117,
    name: "Jisu Das",
    status: "Active",
    employeeId: "68824",
    designation: "labor",
    idNumber: "2625321316",
    dacoId: "",
    group: "Nursery",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 118,
    name: "Anowar Hossain",
    status: "Active",
    employeeId: "68765",
    designation: "labor",
    idNumber: "2631852494",
    dacoId: "",
    group: "Nursery",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 119,
    name: "MD ARIFUL ISALM",
    status: "Active",
    employeeId: "68504",
    designation: "labor",
    idNumber: "2511128486",
    dacoId: "",
    group: "Street light",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 120,
    name: "Dinesh Bhar",
    status: "Active",
    employeeId: "68757",
    designation: "labor",
    idNumber: "2630496079",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 121,
    name: "Zaj Miah",
    status: "Active",
    employeeId: "67433",
    designation: "labor",
    idNumber: "2518754243",
    dacoId: "DMM-011-0512",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 122,
    name: "Mohammad Mitun",
    status: "Active",
    employeeId: "67442",
    designation: "labor",
    idNumber: "2508425903",
    dacoId: "DMM-011-0624",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 123,
    name: "Jakirul Islam",
    status: "Active",
    employeeId: "67333",
    designation: "labor",
    idNumber: "2532075823",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 124,
    name: "Faruk Mia",
    status: "Active",
    employeeId: "67393",
    designation: "labor",
    idNumber: "2508426042",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 125,
    name: "Mohammad Hossain",
    status: "Active",
    employeeId: "67343",
    designation: "labor",
    idNumber: "2495729556",
    dacoId: "DMM-011-6733",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 126,
    name: "Rajib Mia",
    status: "Active",
    employeeId: "67350",
    designation: "labor",
    idNumber: "2532076003",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 127,
    name: "MD Biplob Mia",
    status: "Active",
    employeeId: "67358",
    designation: "labor",
    idNumber: "2532076185",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 128,
    name: "Sohel mia",
    status: "Active",
    employeeId: "68754",
    designation: "labor",
    idNumber: "2628262038",
    dacoId: "",
    group: "Irrigation",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 129,
    name: "MD Faruk Mia",
    status: "Active",
    employeeId: "67351",
    designation: "labor",
    idNumber: "2495723666",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 130,
    name: "Shahmeraj Miah",
    status: "Active",
    employeeId: "67342",
    designation: "labor",
    idNumber: "2495723708",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 131,
    name: "Kajol Soltan",
    status: "Active",
    employeeId: "67344",
    designation: "labor",
    idNumber: "2513346292",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 132,
    name: "MD Saiful",
    status: "Active",
    employeeId: "67431",
    designation: "labor",
    idNumber: "2500807702",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 133,
    name: "Semul Hossain",
    status: "Active",
    employeeId: "67352",
    designation: "labor",
    idNumber: "2495723849",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 134,
    name: "Krishna Bind Nanda Bind",
    status: "Active",
    employeeId: "67481",
    designation: "labor",
    idNumber: "2485304162",
    dacoId: "DMM-011-0620",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 135,
    name: "MD Numan Mia",
    status: "Active",
    employeeId: "67434",
    designation: "labor",
    idNumber: "2526230780",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 136,
    name: "Muhammad Tayyeb",
    status: "Active",
    employeeId: "67552",
    designation: "labor",
    idNumber: "2523147565",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 137,
    name: "MD Jahidur Rahman",
    status: "Active",
    employeeId: "68766",
    designation: "labor",
    idNumber: "2576353243",
    dacoId: "",
    group: "Irrigation",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 138,
    name: "MD Shemal Miah",
    status: "Active",
    employeeId: "68762",
    designation: "labor",
    idNumber: "2624202632",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 139,
    name: "Md Juwel Isalm",
    status: "Active",
    employeeId: "67361",
    designation: "labor",
    idNumber: "2428049825",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 140,
    name: "Raju Ray",
    status: "Active",
    employeeId: "68759",
    designation: "labor",
    idNumber: "2630496145",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 141,
    name: "Muneeb Usman",
    status: "Active",
    employeeId: "67868",
    designation: "labor",
    idNumber: "2633481094",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 142,
    name: "MD Iqabal Hasan",
    status: "Active",
    employeeId: "68763",
    designation: "labor",
    idNumber: "2627978048",
    dacoId: "",
    group: "Irrigation",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 143,
    name: "Saelim Ali Ahmed",
    status: "Active",
    employeeId: "68767",
    designation: "labor",
    idNumber: "2488041803",
    dacoId: "",
    group: "Irrigation",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 144,
    name: "Bijoy Roy",
    status: "Active",
    employeeId: "68758",
    designation: "labor",
    idNumber: "2630495691",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 145,
    name: "Sanjoy Roy",
    status: "Active",
    employeeId: "68760",
    designation: "labor",
    idNumber: "2630495659",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 146,
    name: "Sabuj",
    status: "Active",
    employeeId: "68733",
    designation: "labor",
    idNumber: "2631190523",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 147,
    name: "MD yashin",
    status: "Active",
    employeeId: "68731",
    designation: "labor",
    idNumber: "2631190739",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 148,
    name: "MD salim",
    status: "Active",
    employeeId: "68730",
    designation: "labor",
    idNumber: "2596870424",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 149,
    name: "MD Iqbal",
    status: "Active",
    employeeId: "68764",
    designation: "labor",
    idNumber: "2574986515",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 150,
    name: "Shahin Miha",
    status: "Active",
    employeeId: "68737",
    designation: "labor",
    idNumber: "2629852829",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 151,
    name: "Nazmul Hasan",
    status: "Active",
    employeeId: "69336",
    designation: "labor",
    idNumber: "2633996943",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-06-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 152,
    name: "Waskoroni",
    status: "Active",
    employeeId: "68740",
    designation: "labor",
    idNumber: "2627145473",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 153,
    name: "MD Sumon",
    status: "Active",
    employeeId: "68742",
    designation: "labor",
    idNumber: "2630239016",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 154,
    name: "MD Saiful Islam",
    status: "Active",
    employeeId: "68729",
    designation: "labor",
    idNumber: "2629534708",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 155,
    name: "Asa Pramanik",
    status: "Active",
    employeeId: "68745",
    designation: "labor",
    idNumber: "2631316235",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 156,
    name: "MD Anowar Shek",
    status: "Active",
    employeeId: "68738",
    designation: "labor",
    idNumber: "2630239180",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 157,
    name: "MD Alam Miah",
    status: "Active",
    employeeId: "68739",
    designation: "labor",
    idNumber: "2630239149",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 158,
    name: "MD Hassan",
    status: "Active",
    employeeId: "68750",
    designation: "labor",
    idNumber: "2626474189",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 159,
    name: "MD Mohar Ali",
    status: "Active",
    employeeId: "68748",
    designation: "labor",
    idNumber: "2630238950",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 160,
    name: "MD Forid Ali",
    status: "Active",
    employeeId: "68732",
    designation: "labor",
    idNumber: "2631189491",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-20",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 161,
    name: "MD Robiul Islam",
    status: "Active",
    employeeId: "68743",
    designation: "labor",
    idNumber: "2629501038",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-20",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 162,
    name: "Muhammad Shabir Hassan",
    status: "Active",
    employeeId: "#N/A",
    designation: "labor",
    idNumber: "QZ6808782",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-07-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 163,
    name: "MD Rayhan Shek",
    status: "Active",
    employeeId: "68744",
    designation: "labor",
    idNumber: "2632041766",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-20",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 164,
    name: "Zeeshan Hussain Shah",
    status: "Active",
    employeeId: "68753",
    designation: "labor",
    idNumber: "2636518140",
    dacoId: "",
    group: "Irrigation",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 165,
    name: "Saefarz Ahemd",
    status: "Active",
    employeeId: "68758",
    designation: "labor",
    idNumber: "X6097991",
    dacoId: "DMM-010-9478",
    group: "Irrigation",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 166,
    name: "Md Anower Sheik",
    status: "Active",
    employeeId: "68790",
    designation: "labor",
    idNumber: "2622199970",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 167,
    name: "MD Mahfuz Sawker",
    status: "Active",
    employeeId: "68774",
    designation: "labor",
    idNumber: "2628909059",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 168,
    name: "Razibul Haque",
    status: "Active",
    employeeId: "68746",
    designation: "labor",
    idNumber: "2628079457",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 169,
    name: "Rasel Molla",
    status: "Active",
    employeeId: "68781",
    designation: "labor",
    idNumber: "2623866262",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 170,
    name: "Sojal Akkash",
    status: "Active",
    employeeId: "68801",
    designation: "labor",
    idNumber: "2622316319",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-22",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 171,
    name: "Umar Daraz Khan",
    status: "Active",
    employeeId: "69200",
    designation: "labor",
    idNumber: "2589367313",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 172,
    name: "Md Sohel Miah",
    status: "Active",
    employeeId: "68802",
    designation: "labor",
    idNumber: "2519950931",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 173,
    name: "Sojib haque miah",
    status: "Active",
    employeeId: "67742",
    designation: "labor",
    idNumber: "2615719156",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 174,
    name: "Muhammmad Tahir Younas",
    status: "Active",
    employeeId: "65028",
    designation: "Technician",
    idNumber: "2626108019",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Indian",
    medicalInsurance: "",
  },
  {
    slNo: 175,
    name: "MD Uzzal",
    status: "Active",
    employeeId: "68793",
    designation: "labor",
    idNumber: "2631196967",
    dacoId: "",
    group: "Irrigation",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 176,
    name: "Ismail Uddin",
    status: "Active",
    employeeId: "68785",
    designation: "labor",
    idNumber: "2626890988",
    dacoId: "",
    group: "Irrigation",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 177,
    name: "Mojibor Rahaman",
    status: "Active",
    employeeId: "68735",
    designation: "labor",
    idNumber: "2631190846",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 178,
    name: "Imran miah",
    status: "Active",
    employeeId: "67743",
    designation: "labor",
    idNumber: "2608329096",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 179,
    name: "Mohammad Namdim",
    status: "Active",
    employeeId: "69257",
    designation: "labor",
    idNumber: "2637191046",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-05-09",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 180,
    name: "Mohammad Shahidullah",
    status: "Active",
    employeeId: "68794",
    designation: "labor",
    idNumber: "2602776177",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 181,
    name: "MD Abu Musa",
    status: "Active",
    employeeId: "68795",
    designation: "labor",
    idNumber: "2599721814",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 182,
    name: "Masdur Rhaman",
    status: "Active",
    employeeId: "68537",
    designation: "labor",
    idNumber: "2482796352",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 183,
    name: "Asad Khan",
    status: "Active",
    employeeId: "68590",
    designation: "labor",
    idNumber: "2549811186",
    dacoId: "",
    group: "Landscaping",
    companyName: "Nabatat",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-05-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 184,
    name: "Atif liaqt",
    status: "Active",
    employeeId: "69204",
    designation: "labor",
    idNumber: "2628920460",
    dacoId: "",
    group: "Irrigation",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-05-01",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 185,
    name: "MD Suman",
    status: "Active",
    employeeId: "68768",
    designation: "labor",
    idNumber: "2622835896",
    dacoId: "",
    group: "Irrigation",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-05-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 186,
    name: "Mohd Sakib",
    status: "Active",
    employeeId: "#N/A",
    designation: "labor",
    idNumber: "I0412142",
    dacoId: "",
    group: "Roads and Grounds",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-06-14",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 187,
    name: "Md Nazrul Islam",
    status: "Active",
    employeeId: "60501",
    designation: "labor",
    idNumber: "2591632092",
    dacoId: "DMM-010-6393",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-15",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 188,
    name: "MD Manik",
    status: "Active",
    employeeId: "68752",
    designation: "labor",
    idNumber: "2621807839",
    dacoId: "",
    group: "Landscaping",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-20",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 189,
    name: "Rasel Mia",
    status: "Active",
    employeeId: "52889",
    designation: "labor",
    idNumber: "2613525845",
    dacoId: "",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 190,
    name: "Md Delear Hosen",
    status: "Active",
    employeeId: "52888",
    designation: "labor",
    idNumber: "2598519292",
    dacoId: "DMM-010-7348",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 191,
    name: "Abul Kasem",
    status: "Active",
    employeeId: "52679",
    designation: "labor",
    idNumber: "2616610081",
    dacoId: "DMM-010-7588",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 192,
    name: "Kazi Majharul Islam",
    status: "Active",
    employeeId: "52900",
    designation: "labor",
    idNumber: "2623338098",
    dacoId: "DMM-010-6920",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 193,
    name: "MD Soheldul",
    status: "Active",
    employeeId: "52617",
    designation: "labor",
    idNumber: "2609558776",
    dacoId: "DMM-010-6979",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 194,
    name: "Osman Gani",
    status: "Active",
    employeeId: "52680",
    designation: "labor",
    idNumber: "2617410143",
    dacoId: "DMM-010-7445",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 195,
    name: "Md Tuhin Miah",
    status: "Active",
    employeeId: "69211",
    designation: "labor",
    idNumber: "2613529888",
    dacoId: "DMM-010-6921",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 196,
    name: "Md Shamin Hossain",
    status: "Active",
    employeeId: "52895",
    designation: "labor",
    idNumber: "2621517172",
    dacoId: "DMM-010-7117",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 197,
    name: "Shawon Joynal Miah",
    status: "Active",
    employeeId: "52887",
    designation: "labor",
    idNumber: "2600988691",
    dacoId: "DMM-010-6922",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 198,
    name: "Md Bayzid",
    status: "Active",
    employeeId: "52899",
    designation: "labor",
    idNumber: "2605965405",
    dacoId: "DMM-010-7346",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 199,
    name: "Md Obaidul Haque",
    status: "Active",
    employeeId: "52892",
    designation: "labor",
    idNumber: "2601066596",
    dacoId: "DMM-010-7347",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 200,
    name: "Solaiman Molla",
    status: "Active",
    employeeId: "52893",
    designation: "labor",
    idNumber: "2627727072",
    dacoId: "",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 201,
    name: "Amr Amin",
    status: "Active",
    employeeId: "49603",
    designation: "labor",
    idNumber: "2551812098",
    dacoId: "DMM-010-6253",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Egyptian",
    medicalInsurance: "",
  },
  {
    slNo: 202,
    name: "Muhammad Jamal Khalid",
    status: "Active",
    employeeId: "49601",
    designation: "labor",
    idNumber: "2588521498",
    dacoId: "DMM-010-6919",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Pakistani",
    medicalInsurance: "",
  },
  {
    slNo: 203,
    name: "Md Rana Miah",
    status: "Active",
    employeeId: "52809",
    designation: "labor",
    idNumber: "2622865711",
    dacoId: "DMM-010-6923",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 204,
    name: "Deepak Kumar Sitak Singh",
    status: "Active",
    employeeId: "#N/A",
    designation: "labor",
    idNumber: "2598689442",
    dacoId: "DMM-010-7448",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 205,
    name: "Amarjeet Singh",
    status: "Active",
    employeeId: "69212",
    designation: "labor",
    idNumber: "2598689186",
    dacoId: "DMM-010-7444",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 206,
    name: "Sujon Mia",
    status: "Active",
    employeeId: "52850",
    designation: "labor",
    idNumber: "2471809810",
    dacoId: "",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Bangladeshi",
    medicalInsurance: "",
  },
  {
    slNo: 207,
    name: "Pawan Shreeram",
    status: "Active",
    employeeId: "52849",
    designation: "labor",
    idNumber: "2586471076",
    dacoId: "DMM-010-6263",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-04-01",
    nationality: "Indian",
    medicalInsurance: "",
  },
  {
    slNo: 208,
    name: "Abdul Razzak",
    status: "Active",
    employeeId: "52285",
    designation: "labor",
    idNumber: "2591104647",
    dacoId: "DMM-010-6240",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-06-08",
    nationality: "Indian",
    medicalInsurance: "",
  },
  {
    slNo: 209,
    name: "MD Hossain",
    status: "Active",
    employeeId: "N/A",
    designation: "labor",
    idNumber: "2504247822",
    dacoId: "",
    group: "Ecopower",
    companyName: "Safari",
    iqamaExpiryDate: "",
    dacoExpiryDate: "2026-06-08",
    nationality: "Indian",
    medicalInsurance: "",
  },
];

// Helper function to calculate remaining days from current date
const getDaysRemaining = (expiryDateString?: string) => {
  if (!expiryDateString) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDateString);
  if (isNaN(expiry.getTime())) return null; // Fallback for Hijri or non-standard date strings
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Render badge depending on urgency
const renderExpiryBadge = (dateString?: string) => {
  const days = getDaysRemaining(dateString);
  if (days === null) return <span className="text-muted-foreground">—</span>;

  let badgeStyle =
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  let label = `${days} Days Left`;

  if (days < 0) {
    badgeStyle =
      "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 animate-pulse";
    label = `Expired (${Math.abs(days)}d ago)`;
  } else if (days <= 30) {
    badgeStyle =
      "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20";
    label = `${days} Days (Urgent)`;
  } else if (days <= 60) {
    badgeStyle =
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20";
    label = `${days} Days Left`;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-mono font-medium">{dateString}</span>
      <span
        className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold inline-block text-center w-fit ${badgeStyle}`}
      >
        {label}
      </span>
    </div>
  );
};

const filterStatusOptions: FilterOption[] = [
  { label: "Expired", value: "EXPIRED" },
  { label: "Expiring in 30 Days", value: "30_DAYS" },
  { label: "Expiring in 60 Days", value: "60_DAYS" },
  { label: "Valid", value: "VALID" },
];

export default function Expiration() {
  const [data, setData] = useState<MockDocumentExpiry[]>(MOCK_EXPIRY_DATA);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [expiryStatusFilter, setExpiryStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MockDocumentExpiry | null>(
    null,
  );

  const [form, setForm] = useState<Partial<MockDocumentExpiry>>({
    name: "",
    email: "",
    employeeId: "",
    idNumber: "",
    dacoId: "",
    group: "Administrative / Management",
    companyName: "Safari Group",
    iqamaExpiryDate: "",
    dacoExpiryDate: "",
    workLocation: "",
    remark: "",
    designation: "",
    nationality: "Saudi",
    status: "Active",
  });

  // Dynamic Group filter options
  const groupOptions = useMemo(() => {
    const uniqueGroups = Array.from(
      new Set(data.map((e) => e.group).filter(Boolean)),
    );
    return uniqueGroups.map((g) => ({ label: g, value: g }));
  }, [data]);

  // Combined Search & Filtering logic
  const filtered = useMemo(() => {
    return data.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        item.name.toLowerCase().includes(q) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        item.employeeId.toLowerCase().includes(q) ||
        item.idNumber.includes(q) ||
        (item.dacoId && item.dacoId.toLowerCase().includes(q)) ||
        item.group.toLowerCase().includes(q) ||
        item.companyName.toLowerCase().includes(q);

      const matchGroup = groupFilter === "all" || item.group === groupFilter;

      // Expiry days status filter checking Iqama OR DACO
      const iqamaDays = getDaysRemaining(item.iqamaExpiryDate);
      const dacoDays = getDaysRemaining(item.dacoExpiryDate);
      const minDays = Math.min(iqamaDays ?? Infinity, dacoDays ?? Infinity);

      let matchExpiry = true;
      if (expiryStatusFilter === "EXPIRED") {
        matchExpiry =
          (iqamaDays !== null && iqamaDays < 0) ||
          (dacoDays !== null && dacoDays < 0);
      } else if (expiryStatusFilter === "30_DAYS") {
        matchExpiry = minDays >= 0 && minDays <= 30;
      } else if (expiryStatusFilter === "60_DAYS") {
        matchExpiry = minDays >= 0 && minDays <= 60;
      } else if (expiryStatusFilter === "VALID") {
        matchExpiry = minDays > 60;
      }

      return matchSearch && matchGroup && matchExpiry;
    });
  }, [data, search, groupFilter, expiryStatusFilter]);

  // Pagination Logic
  const paginated = useMemo(() => {
    if (pageSize === 0) return filtered;
    return filtered.slice((page - 1) * pageSize, page * pageSize);
  }, [filtered, page, pageSize]);

  const openAdd = () => {
    setEditingRecord(null);
    setForm({
      name: "",
      email: "",
      employeeId: "",
      idNumber: "",
      dacoId: "",
      group: "Administrative / Management",
      companyName: "Safari Group",
      iqamaExpiryDate: "",
      dacoExpiryDate: "",
      workLocation: "",
      remark: "",
      designation: "",
      nationality: "Saudi",
      status: "Active",
    });
    setDialogOpen(true);
  };

  const openEdit = (record: MockDocumentExpiry) => {
    setEditingRecord(record);
    setForm({ ...record });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (
      !form.name?.trim() ||
      !form.employeeId?.trim() ||
      !form.iqamaExpiryDate
    ) {
      toast.error("Name, Employee ID, and Iqama Expiry Date are required");
      return;
    }

    if (editingRecord) {
      setData((prev) =>
        prev.map((item) =>
          item.slNo === editingRecord.slNo
            ? ({ ...item, ...form } as MockDocumentExpiry)
            : item,
        ),
      );
      toast.success("Document expiry dates updated");
    } else {
      const newRec: MockDocumentExpiry = {
        slNo: Date.now(),
        name: form.name || "",
        employeeId: form.employeeId || "",
        idNumber: form.idNumber || "",
        iqamaExpiryDate: form.iqamaExpiryDate || "",
        status: form.status || "Active",
        designation: form.designation || "Staff",
        group: form.group || "Administrative / Management",
        companyName: form.companyName || "Safari Group",
        nationality: form.nationality || "Saudi",
        ...form,
      };
      setData((prev) => [newRec, ...prev]);
      toast.success("New expiration tracking record created");
    }
    setDialogOpen(false);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((e) => ({
        "SL No": e.slNo,
        "Employee ID": e.employeeId,
        Name: e.name,
        "Iqama / ID": e.idNumber,
        "Iqama Expiry": e.iqamaExpiryDate || "N/A",
        "Iqama Days Left": getDaysRemaining(e.iqamaExpiryDate) ?? "N/A",
        "DACO ID": e.dacoId || "",
        "DACO Expiry": e.dacoExpiryDate || "",
        "DACO Days Left": getDaysRemaining(e.dacoExpiryDate) ?? "N/A",
        Group: e.group,
        Company: e.companyName,
        Location: e.workLocation || "",
        Remark: e.remark || "",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expiry_Report");
    XLSX.writeFile(wb, "iqama_daco_expiry_report.xlsx");
    toast.success("Excel report downloaded");
  };

  const exportPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(14);
    doc.text("Safari Group - Iqama & DACO Expiry Monitoring Report", 14, 15);
    autoTable(doc, {
      startY: 22,
      head: [
        [
          "#",
          "Emp ID",
          "Name",
          "Iqama No.",
          "Iqama Expiry",
          "Iqama Status",
          "DACO ID",
          "DACO Expiry",
          "DACO Status",
          "Group",
        ],
      ],
      body: filtered.map((e) => {
        const iDays = getDaysRemaining(e.iqamaExpiryDate);
        const dDays = getDaysRemaining(e.dacoExpiryDate);
        return [
          e.slNo,
          e.employeeId,
          e.name,
          e.idNumber,
          e.iqamaExpiryDate || "—",
          iDays !== null ? (iDays < 0 ? "EXPIRED" : `${iDays} days`) : "—",
          e.dacoId || "—",
          e.dacoExpiryDate || "—",
          dDays !== null ? (dDays < 0 ? "EXPIRED" : `${dDays} days`) : "—",
          e.group,
        ];
      }),
      styles: { fontSize: 8 },
    });
    doc.save("iqama_daco_expiry_report.pdf");
    toast.success("PDF report downloaded");
  };

  const columns: Column<MockDocumentExpiry>[] = [
    {
      key: "slNo",
      label: "#",
      render: (emp) => (
        <span className="text-xs text-muted-foreground font-mono font-medium">
          {emp.slNo}
        </span>
      ),
    },
    {
      key: "employeeId",
      label: "Emp ID",
      render: (emp) => (
        <span className="font-semibold text-xs text-primary font-mono">
          {emp.employeeId}
        </span>
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
              {emp.designation} • {emp.nationality}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "iqamaExpiryDate",
      label: "Iqama / ID Expiry",
      render: (emp) => (
        <div className="min-w-[140px]">
          <p className="text-[11px] text-muted-foreground font-mono mb-0.5">
            ID: {emp.idNumber}
          </p>
          {renderExpiryBadge(emp.iqamaExpiryDate)}
        </div>
      ),
    },
    {
      key: "dacoExpiryDate",
      label: "DACO ID Expiry",
      render: (emp) => (
        <div className="min-w-[140px]">
          <p className="text-[11px] text-muted-foreground font-mono mb-0.5">
            DACO: {emp.dacoId || "—"}
          </p>
          {renderExpiryBadge(emp.dacoExpiryDate)}
        </div>
      ),
    },
    {
      key: "group",
      label: "Group & Company",
      render: (emp) => (
        <div className="min-w-[150px]">
          <p className="text-xs font-medium text-foreground">{emp.group}</p>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{emp.companyName}</span>
          </div>
        </div>
      ),
    },
    {
      key: "remark",
      label: "Status / Remark",
      render: (emp) => (
        <span className="text-xs text-muted-foreground italic truncate max-w-[150px] block">
          {emp.remark || emp.status || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className:
        "text-right sticky right-0 bg-background/95 backdrop-blur-sm z-10",
      render: (emp) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => openEdit(emp)}
            className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            title="Update Expiry Dates"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
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
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-amber-500" />
            Iqama & DACO Expiry Tracker
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Monitoring document expiration dates and remaining countdown days
          </p>
        </div>
      </div>

      {/* Expiry Control Bar: Group & Expiry Status Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 border rounded-xl shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Group Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              Group:
            </span>
            <Select
              value={groupFilter}
              onValueChange={(v) => {
                setGroupFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs w-[180px]">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groupOptions.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
      </div>

      {/* Main Table Wrapper */}
      <div className="border rounded-xl shadow-sm bg-card overflow-hidden">
        {/*
          Horizontal scroll is enabled for wide columns.
          Vertical scroll activates only when visible rows exceed 10 (max-h-[520px]).
        */}
        <div
          className={`w-full overflow-x-auto ${
            paginated.length > 10
              ? "max-h-[520px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20"
              : "overflow-y-visible"
          }`}
        >
          <DataTable<MockDocumentExpiry>
            data={paginated}
            columns={columns}
            rowKey={(e) => String(e.slNo)}
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="Search Employee, Iqama, DACO ID, Group..."
            filterValue={expiryStatusFilter}
            onFilterChange={(v) => {
              setExpiryStatusFilter(v);
              setPage(1);
            }}
            filterOptions={filterStatusOptions}
            filterPlaceholder="All Expiry Statuses"
            page={page}
            pageSize={pageSize === 0 ? filtered.length || 1 : pageSize}
            total={filtered.length}
            onPageChange={setPage}
            emptyMessage="No matching document expiration records found"
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
                <Button
                  size="sm"
                  onClick={openAdd}
                  className="h-8 text-xs bg-primary"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Track Record
                </Button>
              </div>
            }
          />
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRecord
                ? "Update Expiry Dates"
                : "Add Expiry Track Record"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Employee Name *
                </label>
                <Input
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Employee ID *
                </label>
                <Input
                  value={form.employeeId || ""}
                  onChange={(e) =>
                    setForm({ ...form, employeeId: e.target.value })
                  }
                  placeholder="67712"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Iqama / ID Number
                </label>
                <Input
                  value={form.idNumber || ""}
                  onChange={(e) =>
                    setForm({ ...form, idNumber: e.target.value })
                  }
                  placeholder="1063800229"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Iqama Expiry Date *
                </label>
                <Input
                  type="date"
                  value={form.iqamaExpiryDate || ""}
                  onChange={(e) =>
                    setForm({ ...form, iqamaExpiryDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  DACO ID
                </label>
                <Input
                  value={form.dacoId || ""}
                  onChange={(e) => setForm({ ...form, dacoId: e.target.value })}
                  placeholder="DAC-9011"
                />
              </div>
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  DACO Expiry Date
                </label>
                <Input
                  type="date"
                  value={form.dacoExpiryDate || ""}
                  onChange={(e) =>
                    setForm({ ...form, dacoExpiryDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-medium text-muted-foreground mb-1 block">
                  Group / Department
                </label>
                <Input
                  value={form.group || ""}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                />
              </div>
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
            </div>

            <div>
              <label className="font-medium text-muted-foreground mb-1 block">
                Renewal Remark
              </label>
              <Input
                value={form.remark || ""}
                onChange={(e) => setForm({ ...form, remark: e.target.value })}
                placeholder="e.g. Iqama renewal fees paid"
              />
            </div>

            <Button onClick={handleSave} className="w-full mt-2 bg-primary">
              <RefreshCw className="h-4 w-4 mr-1.5" />
              {editingRecord ? "Update Record" : "Save Record"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
