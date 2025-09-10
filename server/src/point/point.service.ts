import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Point,
  PointTransactionType,
  PointTransactionReason,
} from './point.entity';
import { User } from 'src/auth/user.entity';

@Injectable()
export class PointService {
  constructor(
    @InjectRepository(Point)
    private pointRepository: Repository<Point>,
  ) {}

  // 사용자의 현재 포인트 잔액 조회
  async getUserBalance(user: User): Promise<number> {
    const lastTransaction = await this.pointRepository.findOne({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });

    return lastTransaction ? lastTransaction.balanceAfter : 0;
  }

  // 포인트 거래 내역 조회
  async getUserTransactions(
    user: User,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ transactions: Point[]; total: number }> {
    const [transactions, total] = await this.pointRepository.findAndCount({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { transactions, total };
  }

  // 포인트 추가 (획득)
  async addPoints(
    user: User,
    amount: number,
    reason: PointTransactionReason,
    description?: string,
    relatedId?: string,
  ): Promise<Point> {
    const currentBalance = await this.getUserBalance(user);
    const newBalance = currentBalance + amount;

    const point = this.pointRepository.create({
      user,
      amount,
      type: PointTransactionType.EARNED,
      reason,
      description,
      relatedId,
      balanceAfter: newBalance,
    });

    return await this.pointRepository.save(point);
  }

  // 포인트 사용
  async spendPoints(
    user: User,
    amount: number,
    reason: PointTransactionReason,
    description?: string,
    relatedId?: string,
  ): Promise<{ success: boolean; point?: Point; message: string }> {
    const currentBalance = await this.getUserBalance(user);

    if (currentBalance < amount) {
      return {
        success: false,
        message: `포인트가 부족합니다. 현재 잔액: ${currentBalance}포인트`,
      };
    }

    const newBalance = currentBalance - amount;

    const point = this.pointRepository.create({
      user,
      amount: -amount, // 음수로 저장
      type: PointTransactionType.SPENT,
      reason,
      description,
      relatedId,
      balanceAfter: newBalance,
    });

    const savedPoint = await this.pointRepository.save(point);

    return {
      success: true,
      point: savedPoint,
      message: `${amount}포인트가 사용되었습니다. 잔액: ${newBalance}포인트`,
    };
  }

  // 포인트 환불
  async refundPoints(
    user: User,
    amount: number,
    reason: PointTransactionReason,
    description?: string,
    relatedId?: string,
  ): Promise<Point> {
    const currentBalance = await this.getUserBalance(user);
    const newBalance = currentBalance + amount;

    const point = this.pointRepository.create({
      user,
      amount,
      type: PointTransactionType.REFUND,
      reason,
      description,
      relatedId,
      balanceAfter: newBalance,
    });

    return await this.pointRepository.save(point);
  }

  // 리뷰 작성 시 포인트 지급
  async rewardForReview(
    user: User,
    reviewId: string,
    placeName: string,
  ): Promise<Point> {
    const pointsToReward = 10; // 리뷰 작성 시 10포인트 지급
    return await this.addPoints(
      user,
      pointsToReward,
      PointTransactionReason.REVIEW_WRITE,
      `${placeName} 리뷰 작성`,
      reviewId,
    );
  }

  // 위치 인증 시 포인트 지급
  async rewardForLocationVerify(
    user: User,
    placeId: string,
    placeName: string,
  ): Promise<Point> {
    const pointsToReward = 5; // 위치 인증 시 5포인트 지급
    return await this.addPoints(
      user,
      pointsToReward,
      PointTransactionReason.LOCATION_VERIFY,
      `${placeName} 위치 인증`,
      placeId,
    );
  }

  // 포인트로 상품 구매
  async purchaseWithPoints(
    user: User,
    productId: string,
    productName: string,
    pointsRequired: number,
  ): Promise<{ success: boolean; point?: Point; message: string }> {
    return await this.spendPoints(
      user,
      pointsRequired,
      PointTransactionReason.PURCHASE,
      `${productName} 구매`,
      productId,
    );
  }
}
