import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const loginUser = async (data) => {
  const response = await axios.post(
    `${API_URL}/Auth/login`,
    data
  );

  return response.data;
};

export const signupUser = async (data) => {
  const response = await axios.post(
    `${API_URL}/Auth/signup`,
    data
  );

  return response.data;
};