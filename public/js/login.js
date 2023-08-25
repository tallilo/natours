import axios from 'axios';
import { showAlert } from './alert';
export const login = async (email, password) => {
  try {
    axios.defaults.withCredentials = true;
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      withCredentials: true, // Include this option
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Loged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
    console.log(res);
  } catch (err) {
    showAlert('error', 'incorrect password or email, try again!');
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/users/logout',
      withCredentials: true, // Include this option
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log(res);
    if (res.data.status === 'success') {
      location.reload(true);
    }
  } catch (err) {
    showAlert('error', 'Error logging out! Try again!');
  }
};
