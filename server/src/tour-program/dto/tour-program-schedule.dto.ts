import { IsString, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';

export class TourProgramScheduleDto {
  @IsNumber()
  @IsNotEmpty()
  day!: number;

  @IsNumber()
  @IsNotEmpty()
  scheduleSequence!: number;

  @IsString()
  @IsNotEmpty()
  placeId!: string;

  @IsString()
  @IsNotEmpty()
  placeName!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lon!: number;

  @IsString()
  placeDescription!: string;

  @IsNumber()
  @Min(0)
  @Max(1440) // 최대 24시간(1440분)
  travelTime!: number;
}
