import { Body, Controller, Post, UseGuards, Get, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlaceUserPermissionService } from './place-user-permission.service';
import { GetUser } from 'src/@common/decorators/get-user.decorator';
import { User } from 'src/auth/user.entity';
import { PlacePermissionDto } from './dto/place-permission.dto';

interface VerifyLocationDto {
  placeId: string;
  userLatitude: number;
  userLongitude: number;
  placeLatitude: number;
  placeLongitude: number;
}

@Controller('place-permission')
@UseGuards(AuthGuard())
export class PlaceUserPermissionController {
  constructor(private placeUserPermissionService: PlaceUserPermissionService) {}

  @Post()
  async verifyLocationWithGooglePlaceId(
    @Body() placePermissionDto: PlacePermissionDto,
    @GetUser() user: User,
  ) {
    const { googlePlaceId, userLat, userLon, radiusInKm } = placePermissionDto;

    return this.placeUserPermissionService.verifyLocationWithGooglePlaceId(
      user,
      googlePlaceId,
      userLat,
      userLon,
      radiusInKm,
    );
  }

  @Post('verify-location')
  async verifyLocation(
    @Body() verifyLocationDto: VerifyLocationDto,
    @GetUser() user: User,
  ) {
    const {
      placeId,
      userLatitude,
      userLongitude,
      placeLatitude,
      placeLongitude,
    } = verifyLocationDto;

    return this.placeUserPermissionService.verifyLocationAndSavePermission(
      user,
      placeId,
      userLatitude,
      userLongitude,
      placeLatitude,
      placeLongitude,
    );
  }

  @Get('check-permission')
  async checkPermission(
    @Query('placeId') placeId: string,
    @GetUser() user: User,
  ) {
    const permission =
      await this.placeUserPermissionService.checkUserPermission(user, placeId);

    return {
      hasPermission: !!permission,
      permission,
    };
  }
}
