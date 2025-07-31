import axiosInstance from './axios';

// 예약 상태 변경 API
export const updateReservationStatus = async (
  reservationId: number,
  status: 'ACCEPTED' | 'PENDING' | 'REJECTED',
) => {
  try {
    const response = await axiosInstance.patch(
      `/reservations/${reservationId}/status`,
      {status},
    );
    return response.data;
  } catch (error) {
    console.error('예약 상태 변경 실패:', error);
    throw error;
  }
};

// 예약 목록 조회 API
export const getReservations = async (startDate: string, endDate: string) => {
  try {
    const response = await axiosInstance.get(
      `/reservations?startDate=${startDate}&endDate=${endDate}`,
    );
    return response.data;
  } catch (error) {
    console.error('예약 목록 조회 실패:', error);
    throw error;
  }
};
