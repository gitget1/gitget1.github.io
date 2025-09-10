import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getPointBalance, getPointTransactions, adjustPoints} from '../../api/point';

interface PointTransaction {
  id: number;
  amount: number;
  type: 'earned' | 'spent' | 'refund';
  reason: string;
  description?: string;
  balanceAfter: number;
  createdAt: string;
}

const PointScreen = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPointData();
  }, []);

  const loadPointData = async () => {
    try {
      setLoading(true);
      const [balanceResponse, transactionsResponse] = await Promise.all([
        getPointBalance(),
        getPointTransactions(1, 20),
      ]);

      setBalance(balanceResponse.data.balance);
      setTransactions(transactionsResponse.data.transactions);
    } catch (error) {
      console.error('포인트 데이터 로드 실패:', error);
      Alert.alert('오류', '포인트 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPointData();
    setRefreshing(false);
  };

  const handleAddTestPoints = async () => {
    try {
      Alert.alert(
        '테스트 포인트 추가',
        '100포인트를 추가하시겠습니까?',
        [
          {text: '취소', style: 'cancel'},
          {
            text: '확인',
            onPress: async () => {
              await adjustPoints({
                amount: 100,
                reason: 'admin_adjust',
                description: '테스트 포인트 추가',
              });
              await loadPointData();
              Alert.alert('성공', '100포인트가 추가되었습니다.');
            },
          },
        ],
      );
    } catch (error) {
      Alert.alert('오류', '포인트 추가에 실패했습니다.');
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned':
        return 'add-circle';
      case 'spent':
        return 'remove-circle';
      case 'refund':
        return 'refresh';
      default:
        return 'help';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned':
        return '#4CAF50';
      case 'spent':
        return '#F44336';
      case 'refund':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const getTransactionText = (type: string) => {
    switch (type) {
      case 'earned':
        return '획득';
      case 'spent':
        return '사용';
      case 'refund':
        return '환불';
      default:
        return '기타';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>포인트 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* 포인트 잔액 카드 */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Icon name="account-balance-wallet" size={32} color="#4CAF50" />
            <Text style={styles.balanceTitle}>포인트 잔액</Text>
          </View>
          <Text style={styles.balanceAmount}>{balance.toLocaleString()}P</Text>
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleAddTestPoints}>
            <Text style={styles.testButtonText}>테스트 포인트 추가</Text>
          </TouchableOpacity>
        </View>

        {/* 포인트 사용 안내 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>포인트 획득 방법</Text>
          <View style={styles.infoItem}>
            <Icon name="rate-review" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>리뷰 작성: +10포인트</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="location-on" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>위치 인증: +5포인트</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="thumb-up" size={20} color="#4CAF50" />
            <Text style={styles.infoText}>리뷰 좋아요: +1포인트</Text>
          </View>
        </View>

        {/* 거래 내역 */}
        <View style={styles.transactionsCard}>
          <Text style={styles.transactionsTitle}>거래 내역</Text>
          {transactions.length > 0 ? (
            transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <Icon
                    name={getTransactionIcon(transaction.type)}
                    size={24}
                    color={getTransactionColor(transaction.type)}
                  />
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description || getTransactionText(transaction.type)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.createdAt)}
                    </Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color: transaction.amount > 0 ? '#4CAF50' : '#F44336',
                      },
                    ]}>
                    {transaction.amount > 0 ? '+' : ''}
                    {transaction.amount.toLocaleString()}P
                  </Text>
                  <Text style={styles.transactionBalance}>
                    잔액: {transaction.balanceAfter.toLocaleString()}P
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={48} color="#ccc" />
              <Text style={styles.emptyText}>거래 내역이 없습니다.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  balanceCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  testButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 12,
    color: '#666',
  },
  transactionsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionBalance: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default PointScreen;
