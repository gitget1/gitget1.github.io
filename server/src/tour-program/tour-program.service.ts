import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TourProgram } from './entities/tour-program.entity';
import { TourProgramSchedule } from './entities/tour-program-schedule.entity';
import { SaveTourProgramRequestDto } from './dto/save-tour-program-request.dto';
import { User } from 'src/auth/user.entity';

@Injectable()
export class TourProgramService {
  constructor(
    @InjectRepository(TourProgram)
    private tourProgramRepository: Repository<TourProgram>,
    @InjectRepository(TourProgramSchedule)
    private tourProgramScheduleRepository: Repository<TourProgramSchedule>,
  ) {}

  async createTourProgram(
    saveTourProgramDto: SaveTourProgramRequestDto,
    user: User,
  ): Promise<TourProgram> {
    const { schedules, ...tourProgramData } = saveTourProgramDto;

    // 투어 프로그램 생성
    const tourProgram = this.tourProgramRepository.create({
      ...tourProgramData,
      user,
    });

    const savedTourProgram = await this.tourProgramRepository.save(tourProgram);

    // 스케줄 생성
    const scheduleEntities = schedules.map((schedule) =>
      this.tourProgramScheduleRepository.create({
        ...schedule,
        tourProgram: savedTourProgram,
      }),
    );

    await this.tourProgramScheduleRepository.save(scheduleEntities);

    return this.tourProgramRepository.findOne({
      where: { id: savedTourProgram.id },
      relations: ['schedules', 'user'],
    });
  }

  async updateTourProgram(
    id: number,
    saveTourProgramDto: SaveTourProgramRequestDto,
    user: User,
  ): Promise<TourProgram> {
    const tourProgram = await this.tourProgramRepository.findOne({
      where: { id },
      relations: ['schedules', 'user'],
    });

    if (!tourProgram) {
      throw new NotFoundException('투어 프로그램을 찾을 수 없습니다.');
    }

    if (tourProgram.user.id !== user.id) {
      throw new ForbiddenException(
        '해당 투어 프로그램을 수정할 권한이 없습니다.',
      );
    }

    const { schedules, ...tourProgramData } = saveTourProgramDto;

    // 기존 스케줄 삭제
    await this.tourProgramScheduleRepository.delete({ tourProgram: { id } });

    // 투어 프로그램 정보 업데이트
    Object.assign(tourProgram, tourProgramData);
    const updatedTourProgram =
      await this.tourProgramRepository.save(tourProgram);

    // 새 스케줄 생성
    const scheduleEntities = schedules.map((schedule) =>
      this.tourProgramScheduleRepository.create({
        ...schedule,
        tourProgram: updatedTourProgram,
      }),
    );

    await this.tourProgramScheduleRepository.save(scheduleEntities);

    return this.tourProgramRepository.findOne({
      where: { id },
      relations: ['schedules', 'user'],
    });
  }

  async getTourProgram(id: number): Promise<TourProgram> {
    const tourProgram = await this.tourProgramRepository.findOne({
      where: { id },
      relations: ['schedules', 'user'],
    });

    if (!tourProgram) {
      throw new NotFoundException('투어 프로그램을 찾을 수 없습니다.');
    }

    return tourProgram;
  }

  async getUserTourPrograms(user: User): Promise<TourProgram[]> {
    return this.tourProgramRepository.find({
      where: { user: { id: user.id } },
      relations: ['schedules'],
      order: { createdAt: 'DESC' },
    });
  }

  async deleteTourProgram(id: number, user: User): Promise<void> {
    const tourProgram = await this.tourProgramRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!tourProgram) {
      throw new NotFoundException('투어 프로그램을 찾을 수 없습니다.');
    }

    if (tourProgram.user.id !== user.id) {
      throw new ForbiddenException(
        '해당 투어 프로그램을 삭제할 권한이 없습니다.',
      );
    }

    await this.tourProgramRepository.softDelete(id);
  }
}
