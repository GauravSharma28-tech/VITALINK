
const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:5010/api/auth/login', {
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    console.log('Login Success:', response.data);
  } catch (error) {
    console.error('Login Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLogin();
