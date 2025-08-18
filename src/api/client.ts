import axios from 'axios';

const client = axios.create({
  baseURL: 'https://api.api-ninjas.com',
  headers: {
    'X-Api-Key': process.env.REACT_APP_API_NINJAS_API_KEY || '',
  },
});

export default client;
