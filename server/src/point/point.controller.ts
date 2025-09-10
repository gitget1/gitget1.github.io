import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PointService } from './point.service';
import { User } from 'src/auth/user.entity';
import { GetUser } from 'src/@common/decorators/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { PointTransactionReason } from './point.entity';

@Controller('point')
export class PointController {
  constructor(private pointService: PointService) {}

  // 사용자 포인트 잔액 조회
  @Get('/balance')
  @UseGuards(AuthGuard())
  async getBalance(@GetUser() user: User) {
    const balance = await this.pointService.getUserBalance(user);
    return {
      status: '200 OK',
      message: '포인트 잔액 조회 성공',
      data: {
        balance,
        userId: user.id,
      },
    };
  }

  // 포인트 거래 내역 조회
  @Get('/transactions')
  @UseGuards(AuthGuard())
  async getTransactions(
    @GetUser() user: User,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const { transactions, total } = await this.pointService.getUserTransactions(
      user,
      pageNum,
      limitNum,
    );

    return {
      status: '200 OK',
      message: '포인트 거래 내역 조회 성공',
      data: {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    };
  }

  // 포인트로 상품 구매
  @Post('/purchase')
  @UseGuards(AuthGuard())
  async purchaseWithPoints(
    @GetUser() user: User,
    @Body()
    purchaseData: {
      productId: string;
      productName: string;
      pointsRequired: number;
    },
  ) {
    const { productId, productName, pointsRequired } = purchaseData;

    const result = await this.pointService.purchaseWithPoints(
      user,
      productId,
      productName,
      pointsRequired,
    );

    if (result.success) {
      return {
        status: '200 OK',
        message: result.message,
        data: {
          transaction: result.point,
          newBalance: result.point?.balanceAfter,
        },
      };
    } else {
      return {
        status: '400 BAD_REQUEST',
        message: result.message,
        data: null,
      };
    }
  }

  // 관리자 포인트 조정 (개발/테스트용)
  @Post('/admin/adjust')
  @UseGuards(AuthGuard())
  async adjustPoints(
    @GetUser() user: User,
    @Body()
    adjustData: {
      amount: number;
      reason: PointTransactionReason;
      description?: string;
    },
  ) {
    const { amount, reason, description } = adjustData;

    if (amount > 0) {
      const point = await this.pointService.addPoints(
        user,
        amount,
        reason,
        description,
      );
      return {
        status: '200 OK',
        message: `${amount}포인트가 추가되었습니다.`,
        data: { transaction: point },
      };
    } else {
      const result = await this.pointService.spendPoints(
        user,
        Math.abs(amount),
        reason,
        description,
      );

      if (result.success) {
        return {
          status: '200 OK',
          message: result.message,
          data: { transaction: result.point },
        };
      } else {
        return {
          status: '400 BAD_REQUEST',
          message: result.message,
          data: null,
        };
      }
    }
  }
}
