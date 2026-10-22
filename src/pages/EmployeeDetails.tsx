import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetAllEmployeesQuery } from "@/redux/features/employees/employees.api";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router";

interface Employee {
 _id?: string;
 id?: string | number;
 companyName: string;
 dacoId: string | null;
 email: string;
 employeeId: string | number;
 group: string;
 idNumber: string;
 images: string[];
 jobTitle: string;
 joiningDate: string;
 name: string;
 nationality: string;
 phoneNumber: string;
 remark: string;
 status: string;
 workLocation: string;
}

function Detail({ label, value }: { label: string; value?: string | number | null }) {
 return (
  <div className="space-y-1">
   <p className="text-sm text-muted-foreground">{label}</p>
   <p className="font-medium break-words">{value || "-"}</p>
  </div>
 );
}

// Finds the array of employees no matter how the API wraps it
function extractEmployees(data: any): Employee[] {
 if (Array.isArray(data)) return data;
 if (Array.isArray(data?.data)) return data.data;
 if (Array.isArray(data?.data?.employees)) return data.data.employees;
 if (Array.isArray(data?.employees)) return data.employees;
 if (Array.isArray(data?.result)) return data.result;
 return [];
}

export default function EmployeeDetails() {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const { data, isLoading, isError } = useGetAllEmployeesQuery(undefined);

 const employees = extractEmployees(data);

 const employee = employees.find(
  (emp) =>
   String(emp.employeeId) === id ||
   String(emp._id) === id ||
   String(emp.id) === id
 );

 // Debug: remove once it works
 console.log("URL id:", id);
 console.log("raw data:", data);
 console.log("employees count:", employees.length);
 console.log("first employee:", employees[0]);

 if (isLoading) {
  return (
   <div className="flex h-screen items-center justify-center">
    <p>Loading...</p>
   </div>
  );
 }

 if (isError) {
  return (
   <div className="flex h-screen items-center justify-center">
    <p className="text-destructive">Failed to load employees.</p>
   </div>
  );
 }

 if (!employee) {
  return (
   <div className="flex h-screen flex-col items-center justify-center gap-4">
    <p>Employee not found.</p>
    <p className="text-sm text-muted-foreground">
     Looking for id: {id} (loaded {employees.length} employees)
    </p>
    <Button variant="outline" onClick={() => navigate(-1)}>
     Go Back
    </Button>
   </div>
  );
 }

 return (
  <div className="mx-auto max-w-3xl space-y-6 p-6">
   <Button variant="outline" onClick={() => navigate(-1)}>
    <ArrowLeft className="mr-2 h-4 w-4" />
    Back
   </Button>

   <Card>
    <CardHeader className="flex flex-row items-center justify-between">
     <CardTitle className="text-2xl">{employee.name}</CardTitle>
     <Badge variant={employee.status === "ACTIVE" ? "default" : "secondary"}>
      {employee.status}
     </Badge>
    </CardHeader>

    <CardContent>
     <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <Detail label="Employee ID" value={employee.employeeId} />
      <Detail label="Company" value={employee.companyName} />
      <Detail label="Email" value={employee.email} />
      <Detail label="Phone Number" value={employee.phoneNumber} />
      <Detail label="Job Title" value={employee.jobTitle} />
      <Detail label="Group" value={employee.group} />
      <Detail label="Nationality" value={employee.nationality} />
      <Detail label="ID Number" value={employee.idNumber} />
      <Detail
       label="Joining Date"
       value={
        employee.joiningDate
         ? new Date(employee.joiningDate).toLocaleDateString()
         : "-"
       }
      />
      <Detail label="Work Location" value={employee.workLocation} />
      <Detail label="DACO ID" value={employee.dacoId} />
      <Detail label="Remark" value={employee.remark} />
     </div>
    </CardContent>
   </Card>
  </div>
 );
}
