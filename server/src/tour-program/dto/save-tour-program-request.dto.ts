import {
  IsString,
  IsNumber,
  IsArray,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TourProgramScheduleDto } from './tour-program-schedule.dto';

export class SaveTourProgramRequestDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  guidePrice!: number;

  @IsString()
  @IsNotEmpty()
  region!: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @IsArray()
  @Type(() => TourProgramScheduleDto)
  @IsNotEmpty()
  schedules!: TourProgramScheduleDto[];
}
