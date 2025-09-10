import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PlaceUserPermission } from './place-user-permission.entity';
import { PlaceUserPermissionService } from './place-user-permission.service';
import { PlaceUserPermissionController } from './place-user-permission.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PlaceUserPermission]), ConfigModule],
  providers: [PlaceUserPermissionService],
  controllers: [PlaceUserPermissionController],
  exports: [PlaceUserPermissionService],
})
export class PlaceUserPermissionModule {}
