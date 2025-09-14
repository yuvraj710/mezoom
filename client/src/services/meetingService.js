import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const meetingService = {
  async createMeeting(title, description, isPrivate = false) {
    try {
      const response = await api.post('/meetings/create', {
        title,
        description,
        isPrivate
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create meeting');
    }
  },

  async getMeeting(meetingId) {
    try {
      const response = await api.get(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get meeting');
    }
  },

  async joinMeeting(meetingId) {
    try {
      const response = await api.post(`/meetings/${meetingId}/join`, {
        meetingId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to join meeting');
    }
  },

  async endMeeting(meetingId) {
    try {
      const response = await api.post(`/meetings/${meetingId}/end`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to end meeting');
    }
  },

  async getMyMeetings() {
    try {
      const response = await api.get('/meetings/user/my-meetings');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get meetings');
    }
  }
};
