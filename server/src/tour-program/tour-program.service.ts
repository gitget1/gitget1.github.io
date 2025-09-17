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

  async getTourPrograms(filters: {
    mbti?: string;
    hashtags?: string;
    regions?: string;
  }): Promise<TourProgram[]> {
    const queryBuilder = this.tourProgramRepository
      .createQueryBuilder('tourProgram')
      .leftJoinAndSelect('tourProgram.schedules', 'schedules')
      .leftJoinAndSelect('tourProgram.user', 'user');

    // 해시태그 필터 (배열에서 포함 검색)
    if (filters.hashtags) {
      const hashtagArray = filters.hashtags.split(',').map((tag) => tag.trim());
      queryBuilder.andWhere('tourProgram.hashtags && :hashtags', {
        hashtags: hashtagArray,
      });
    }

    // 지역 필터
    if (filters.regions) {
      const regionArray = filters.regions
        .split(',')
        .map((region) => region.trim());
      queryBuilder.andWhere('tourProgram.region IN (:...regions)', {
        regions: regionArray,
      });
    }

    // MBTI 필터는 현재 User 엔티티에 mbti 필드가 없으므로 임시로 제외
    // TODO: User 엔티티에 mbti 필드 추가 후 구현

    return queryBuilder.orderBy('tourProgram.createdAt', 'DESC').getMany();
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

  async getUnlockStatus(
    id: number,
    user: User,
  ): Promise<{ unlocked: boolean }> {
    const tourProgram = await this.tourProgramRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!tourProgram) {
      throw new NotFoundException('투어 프로그램을 찾을 수 없습니다.');
    }

    // 투어 프로그램 소유자이거나 해제된 상태인 경우에만 접근 가능
    if (tourProgram.user.id !== user.id && !tourProgram.unlocked) {
      throw new ForbiddenException(
        '해당 투어 프로그램의 일정을 확인할 권한이 없습니다.',
      );
    }

    return { unlocked: tourProgram.unlocked };
  }

  async unlockSchedule(
    id: number,
    unlockData: { unlocked: boolean; unlockMethod: string; unlockCost: number },
    user: User,
  ): Promise<void> {
    const tourProgram = await this.tourProgramRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!tourProgram) {
      throw new NotFoundException('투어 프로그램을 찾을 수 없습니다.');
    }

    // 투어 프로그램 소유자만 해제할 수 있음
    if (tourProgram.user.id !== user.id) {
      throw new ForbiddenException(
        '해당 투어 프로그램을 해제할 권한이 없습니다.',
      );
    }

    tourProgram.unlocked = unlockData.unlocked;
    tourProgram.unlockMethod = unlockData.unlockMethod;
    tourProgram.unlockCost = unlockData.unlockCost;

    await this.tourProgramRepository.save(tourProgram);
  }
}
