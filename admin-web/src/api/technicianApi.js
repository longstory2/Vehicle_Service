import axiosClient from "./axiosClient";

const technicianApi = {
  getPending: () => axiosClient.get("/technicians/pending"),
  approve: (id) => axiosClient.put(`/technicians/${id}/approve`),
};

export default technicianApi;
