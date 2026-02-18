import axios from 'axios';

const API_BASE = 'https://vplite-stg.voiceplug.ai/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  // do not throw for non-2xx automatically (we'll handle errors in .catch)
  validateStatus: () => true,
});

export const createCancelSource = () => axios.CancelToken.source();

export default client;
