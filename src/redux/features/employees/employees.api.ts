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
    // http://localhost:5000/api/v1/employees/all-Employee
    getAllEmployees: builder.query<TEmployee[], void>({
      query: (params) => ({
        url: "employees/all-Employee",
        method: "GET",
        params: params,
      }),
      providesTags: ["EMPLOYEE"],
    }),
  }),
});

export const { useAddEmployeeMutation, useGetAllEmployeesQuery } = employeesApi;
