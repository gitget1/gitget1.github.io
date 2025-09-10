import { IsString, IsNumber, IsPositive, Min, Max } from 'class-validator';

export class PlacePermissionDto {
  @IsString()
  googlePlaceId: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  userLat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  userLon: number;

  @IsNumber()
  @IsPositive()
  radiusInKm: number;
}
