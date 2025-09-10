import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/auth/user.entity';

export enum PointTransactionType {
  EARNED = 'earned', // 획득
  SPENT = 'spent', // 사용
  REFUND = 'refund', // 환불
}

export enum PointTransactionReason {
  REVIEW_WRITE = 'review_write', // 리뷰 작성
  REVIEW_LIKE = 'review_like', // 리뷰 좋아요
  LOCATION_VERIFY = 'location_verify', // 위치 인증
  PURCHASE = 'purchase', // 구매
  REFUND = 'refund', // 환불
  ADMIN_ADJUST = 'admin_adjust', // 관리자 조정
}

@Entity()
export class Point extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.points, { eager: false })
  user: User;

  @Column()
  amount: number; // 포인트 양 (양수: 획득, 음수: 사용)

  @Column({
    type: 'enum',
    enum: PointTransactionType,
  })
  type: PointTransactionType;

  @Column({
    type: 'enum',
    enum: PointTransactionReason,
  })
  reason: PointTransactionReason;

  @Column({ nullable: true })
  description?: string; // 거래 설명

  @Column({ nullable: true })
  relatedId?: string; // 관련 ID (리뷰 ID, 주문 ID 등)

  @Column({ default: 0 })
  balanceAfter: number; // 거래 후 잔액

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
