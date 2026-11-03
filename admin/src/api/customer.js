import api from "../api/axios";

const response = await api.get("/customers");
const customers = response.data.data;

console.log(customers);
