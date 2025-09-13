import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://124.60.137.10:8083';

// 포인트 잔액 조회
export const getPointBalance = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await axios.get(`${BASE_URL}/point/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error('포인트 잔액 조회 실패:', error);
    throw error;
  }
};

// 포인트 거래 내역 조회
export const getPointTransactions = async (
  page: number = 1,
  limit: number = 20,
) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await axios.get(`${BASE_URL}/point/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        page,
        limit,
      },
    });

    return response.data;
  } catch (error) {
    console.error('포인트 거래 내역 조회 실패:', error);
    throw error;
  }
};

// 포인트로 상품 구매
export const purchaseWithPoints = async (purchaseData: {
  productId: string;
  productName: string;
  pointsRequired: number;
}) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await axios.post(
      `${BASE_URL}/point/purchase`,
      purchaseData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('포인트 구매 실패:', error);
    throw error;
  }
};

// 관리자 포인트 조정 (개발/테스트용)
export const adjustPoints = async (adjustData: {
  amount: number;
  reason: string;
  description?: string;
}) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await axios.post(
      `${BASE_URL}/point/admin/adjust`,
      adjustData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('포인트 조정 실패:', error);
    throw error;
  }
};
