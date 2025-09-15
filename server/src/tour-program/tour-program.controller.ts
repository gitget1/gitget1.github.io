import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  ValidationPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { TourProgramService } from './tour-program.service';
import { SaveTourProgramRequestDto } from './dto/save-tour-program-request.dto';
import { GetUser } from 'src/@common/decorators/get-user.decorator';
import { User } from 'src/auth/user.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('tour-program')
@UseGuards(AuthGuard())
export class TourProgramController {
  constructor(private tourProgramService: TourProgramService) {}

  @Post()
  async createTourProgram(
    @Body(ValidationPipe) saveTourProgramDto: SaveTourProgramRequestDto,
    @GetUser() user: User,
  ) {
    const tourProgram = await this.tourProgramService.createTourProgram(
      saveTourProgramDto,
      user,
    );

    return {
      status: 'OK',
      message: '투어 프로그램이 생성되었습니다.',
      data: tourProgram,
    };
  }

  @Put(':id')
  async updateTourProgram(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) saveTourProgramDto: SaveTourProgramRequestDto,
    @GetUser() user: User,
  ) {
    const tourProgram = await this.tourProgramService.updateTourProgram(
      id,
      saveTourProgramDto,
      user,
    );

    return {
      status: 'OK',
      message: '투어 프로그램이 수정되었습니다.',
      data: tourProgram,
    };
  }

  @Get(':id')
  async getTourProgram(@Param('id', ParseIntPipe) id: number) {
    const tourProgram = await this.tourProgramService.getTourProgram(id);

    return {
      status: 'OK',
      message: '투어 프로그램을 조회했습니다.',
      data: tourProgram,
    };
  }

  @Get()
  async getUserTourPrograms(@GetUser() user: User) {
    const tourPrograms =
      await this.tourProgramService.getUserTourPrograms(user);

    return {
      status: 'OK',
      message: '사용자의 투어 프로그램 목록을 조회했습니다.',
      data: tourPrograms,
    };
  }

  @Delete(':id')
  async deleteTourProgram(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ) {
    await this.tourProgramService.deleteTourProgram(id, user);

    return {
      status: 'OK',
      message: '투어 프로그램이 삭제되었습니다.',
    };
  }

  @Get(':id/unlock-status')
  async getUnlockStatus(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ) {
    const unlockStatus = await this.tourProgramService.getUnlockStatus(
      id,
      user,
    );

    return {
      status: 'OK',
      message: '일정 해제 상태를 조회했습니다.',
      data: unlockStatus,
    };
  }

  @Post(':id/unlock')
  async unlockSchedule(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    unlockData: { unlocked: boolean; unlockMethod: string; unlockCost: number },
    @GetUser() user: User,
  ) {
    await this.tourProgramService.unlockSchedule(id, unlockData, user);

    return {
      status: 'OK',
      message: '일정 해제 상태가 저장되었습니다.',
    };
  }
}
