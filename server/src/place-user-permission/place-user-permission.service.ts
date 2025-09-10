import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlaceUserPermission } from './place-user-permission.entity';
import { User } from 'src/auth/user.entity';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PlaceUserPermissionService {
  constructor(
    @InjectRepository(PlaceUserPermission)
    private placeUserPermissionRepository: Repository<PlaceUserPermission>,
    private configService: ConfigService,
  ) {}

  // 두 지점 간의 거리 계산 (Haversine formula)
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // 지구 반지름 (미터)
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Google Places API를 사용하여 Place ID로부터 좌표 정보 가져오기
  private async getPlaceCoordinates(googlePlaceId: string): Promise<{
    latitude: number;
    longitude: number;
    name: string;
  }> {
    const apiKey = this.configService.get('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      throw new BadRequestException(
        'Google Places API 키가 설정되지 않았습니다.',
      );
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: googlePlaceId,
            fields: 'geometry,name',
            key: apiKey,
          },
        },
      );

      if (response.data.status !== 'OK') {
        throw new BadRequestException(
          `Google Places API 오류: ${response.data.status}`,
        );
      }

      const place = response.data.result;
      const location = place.geometry.location;

      return {
        latitude: location.lat,
        longitude: location.lng,
        name: place.name,
      };
    } catch (error) {
      if (error.response?.data?.error_message) {
        throw new BadRequestException(
          `Google Places API 오류: ${error.response.data.error_message}`,
        );
      }
      throw new BadRequestException('장소 정보를 가져올 수 없습니다.');
    }
  }

  // 위치 검증 및 권한 저장
  async verifyLocationAndSavePermission(
    user: User,
    placeId: string,
    userLatitude: number,
    userLongitude: number,
    placeLatitude: number,
    placeLongitude: number,
  ): Promise<{ isVerified: boolean; distance: number; message: string }> {
    // 거리 계산
    const distance = this.calculateDistance(
      userLatitude,
      userLongitude,
      placeLatitude,
      placeLongitude,
    );

    // 100미터 이내면 검증 성공
    const isVerified = distance <= 100;

    // 권한 정보 저장
    const permission = this.placeUserPermissionRepository.create({
      placeId,
      userLatitude,
      userLongitude,
      placeLatitude,
      placeLongitude,
      isVerified,
      distance,
      user,
    });

    await this.placeUserPermissionRepository.save(permission);

    return {
      isVerified,
      distance: Math.round(distance),
      message: isVerified
        ? '현장 방문이 확인되었습니다. 리뷰를 작성할 수 있습니다.'
        : `현재 위치가 장소로부터 ${Math.round(
            distance,
          )}m 떨어져 있습니다. 100m 이내에서 다시 시도해주세요.`,
    };
  }

  // Google Place ID를 사용한 위치 검증 및 권한 확인
  async verifyLocationWithGooglePlaceId(
    user: User,
    googlePlaceId: string,
    userLat: number,
    userLon: number,
    radiusInKm: number,
  ): Promise<{
    hasPermission: boolean;
    distance: number;
    placeName: string;
    message: string;
  }> {
    // Google Place ID에서 좌표 추출 (클라이언트에서 전달된 형식에 따라)
    let placeLat: number;
    let placeLon: number;
    let placeName: string;

    // Place ID가 좌표 조합 형식인지 확인
    if (googlePlaceId.includes('_')) {
      const [latStr, lonStr] = googlePlaceId.split('_');
      placeLat = parseFloat(latStr);
      placeLon = parseFloat(lonStr);
      placeName = `장소 (${placeLat.toFixed(6)}, ${placeLon.toFixed(6)})`;
    } else {
      // 실제 Google Place ID인 경우 API 호출
      try {
        const placeInfo = await this.getPlaceCoordinates(googlePlaceId);
        placeLat = placeInfo.latitude;
        placeLon = placeInfo.longitude;
        placeName = placeInfo.name;
      } catch (error) {
        // API 호출 실패 시 기본값 사용
        placeLat = 37.5665; // 서울시청 기본값
        placeLon = 126.978;
        placeName = '알 수 없는 장소';
      }
    }

    // 거리 계산 (미터 단위)
    const distance = this.calculateDistance(
      userLat,
      userLon,
      placeLat,
      placeLon,
    );

    // 반경 내에 있는지 확인 (km를 m로 변환)
    const radiusInMeters = radiusInKm * 1000;
    const hasPermission = distance <= radiusInMeters;

    // 권한 정보 저장
    const permission = this.placeUserPermissionRepository.create({
      placeId: googlePlaceId,
      userLatitude: userLat,
      userLongitude: userLon,
      placeLatitude: placeLat,
      placeLongitude: placeLon,
      isVerified: hasPermission,
      distance,
      user,
    });

    await this.placeUserPermissionRepository.save(permission);

    return {
      hasPermission,
      distance: Math.round(distance),
      placeName,
      message: hasPermission
        ? `현장 방문이 확인되었습니다. ${placeName}에서 리뷰를 작성할 수 있습니다.`
        : `${placeName}으로부터 ${Math.round(distance)}m 떨어져 있습니다. ${radiusInKm}km 이내에서 다시 시도해주세요.`,
    };
  }

  // 사용자의 장소 권한 확인
  async checkUserPermission(
    user: User,
    placeId: string,
  ): Promise<PlaceUserPermission | null> {
    return this.placeUserPermissionRepository.findOne({
      where: {
        user: { id: user.id },
        placeId,
        isVerified: true,
      },
      order: { createdAt: 'DESC' },
    });
  }
}
