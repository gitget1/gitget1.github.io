import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TourProgram } from './entities/tour-program.entity';
import { TourProgramSchedule } from './entities/tour-program-schedule.entity';
import { TourProgramService } from './tour-program.service';
import { TourProgramController } from './tour-program.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TourProgram, TourProgramSchedule])],
  providers: [TourProgramService],
  controllers: [TourProgramController],
  exports: [TourProgramService],
})
export class TourProgramModule {}
