import { baseApi } from "@/redux/baseApi";
import type { TEmployee } from "@/types/employee.type";

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    addEmployee: builder.mutation({
      query: (employeeData) => ({
        url: "/employees/create",
        method: "POST",
        data: employeeData,
      }),
      invalidatesTags: ["EMPLOYEE"],
    }),
    // https://ems-backen.vercel.app/api/v1/employees/all-Employee
    getAllEmployees: builder.query<TEmployee[], void>({
      query: (params) => ({
        url: "employees/all-Employee",
        method: "GET",
        params: params,
      }),
      providesTags: ["EMPLOYEE"],
    }),
    getSingaleEmployee: builder.query<TEmployee, string>({
      query: (id) => ({
        url: `employees/${id}`,
        method: "GET",
      }),
      providesTags: ["EMPLOYEE"],
    }),
  }),
});

export const {
  useAddEmployeeMutation,
  useGetAllEmployeesQuery,
  useGetSingaleEmployeeQuery,
} = employeesApi;
